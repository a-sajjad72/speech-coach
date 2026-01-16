import asyncio
import logging
import os
from concurrent.futures import Executor
from typing import List, Dict, Any

from ollama import Client, ResponseError  # type: ignore
from tqdm.auto import tqdm  # type: ignore

from .config import LLM_CONFIG

logger = logging.getLogger("speech_coach.ollama")


class OllamaService:
    def __init__(self):
        self.client = Client()
        self.default_model = self._select_default_model()

    def _detect_ram_gb(self) -> float:
        try:
            import psutil  # type: ignore

            return psutil.virtual_memory().total / (1024**3)
        except Exception:
            # Fallback: best-effort using os.sysconf on POSIX
            try:
                pages = os.sysconf("SC_PHYS_PAGES")
                page_size = os.sysconf("SC_PAGE_SIZE")
                return (pages * page_size) / (1024**3)
            except Exception:
                logger.warning("Unable to detect RAM; defaulting to 8GB")
                return 8.0

    def _select_default_model(self) -> str:
        tiers = LLM_CONFIG.get("hardware_tiers", [])
        ram_gb = self._detect_ram_gb()
        logger.info("Detected RAM: %.1f GB", ram_gb)

        def tier_fits(t):
            return ram_gb >= t.get("min_ram_gb", 0) and ram_gb <= t.get("max_ram_gb", 9999)

        fitting = [t for t in tiers if tier_fits(t)]
        if not fitting and tiers:
            # If none fit upper bound, pick the highest tier below RAM
            fitting = sorted([t for t in tiers if ram_gb >= t.get("min_ram_gb", 0)], key=lambda x: x.get("min_ram_gb", 0), reverse=True)[:1]
        if not fitting and tiers:
            # Otherwise just fall back to lowest tier
            fitting = [tiers[0]]

        # Choose the tier with the highest min_ram among fitting
        chosen_tier = sorted(fitting, key=lambda t: t.get("min_ram_gb", 0), reverse=True)[0]
        logger.info("Chosen tier=%s (%.1f-%.1f GB)", chosen_tier.get("tier_id"), chosen_tier.get("min_ram_gb"), chosen_tier.get("max_ram_gb"))

        for model in chosen_tier.get("models", []):
            if model.get("is_primary_recommendation"):
                logger.info("Selected primary model=%s tier=%s", model.get("ollama_tag"), chosen_tier.get("tier_id"))
                return model.get("ollama_tag")
        if chosen_tier.get("models"):
            logger.info("No primary flagged in tier; using first listed")
            return chosen_tier["models"][0].get("ollama_tag")
        raise RuntimeError("No LLM models found in configuration.")

    def _ensure_model_pulled(self, model: str):
        try:
            self.client.show(model)
        except ResponseError:
            # Model not present; pull it with streamed progress.
            logger.info("Pulling Ollama model=%s", model)
            pbar = None
            last_completed = 0
            try:
                for chunk in self.client.pull(model, stream=True):
                    status = chunk.get("status")
                    completed = chunk.get("completed")
                    total = chunk.get("total")
                    if total and pbar is None:
                        pbar = tqdm(total=total, desc=f"Pull {model}", unit="B", unit_scale=True)
                    if pbar and completed is not None:
                        pbar.update(max(completed - last_completed, 0))
                        last_completed = completed
                    elif status:
                        logger.info("Pulling %s: %s", model, status)
                if pbar:
                    pbar.close()
            finally:
                logger.info("Pull completed model=%s", model)

    def _chat_sync(self, messages: List[Dict[str, str]], model: str) -> str:
        """Blocking internal method for chat."""
        try:
            logger.info("Calling Ollama model=%s msgs=%s", model, len(messages))
            response = self.client.chat(model=model, messages=messages)
            return response["message"]["content"]
        except ResponseError as exc:
            # Surface meaningful message
            raise RuntimeError(f"Ollama chat failed: {exc}") from exc

    async def chat(self, messages: List[Dict[str, str]], model: str | None = None) -> str:
        target_model = model or self.default_model
        
        # We can pull in the main thread (blocking) or offload it too. 
        # Pulling is rare (once per model), so leaving it sync or partly sync is okay, 
        # but let's be safe. _ensure_model_pulled interacts with tqdm which might be cleaner on main thread 
        # or we might want to check it quickly. 
        # However, `chat` is the main loop. 
        
        # NOTE: _ensure_model_pulled calls client.pull which is network IO. 
        # Ideally that should be async too. But let's stick to the main chat function first.
        # We will keep _ensure_model_pulled as is for now, assuming models are largely present or the user accepts the wait.
        # If we really want non-blocking pull, we'd need more work. 
        
        loop = asyncio.get_running_loop()
        
        # Ensure requested model is available (this might block, but it's okay for now as it's a "setup" step)
        if target_model != self.default_model:
            await loop.run_in_executor(None, self._ensure_model_pulled, target_model)
        else:
             # Lazy check for default
            await loop.run_in_executor(None, self._ensure_model_pulled, target_model)

        return await loop.run_in_executor(None, self._chat_sync, messages, target_model)


