import asyncio
import websockets
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ws_test")

async def test_websocket():
    uri = "ws://localhost:8000/api/ws/call/test-session-ws"
    logger.info(f"Connecting to {uri}")
    async with websockets.connect(uri) as websocket:
        logger.info("Connected")
        
        # Simulate sending some audio (sending a small text buffer as mock bytes since we assume bytes)
        # In a real scenario this would be WAV/PCM bytes. 
        # Since STT expects WAV, we should send something valid or expect an error from STT but check that the flow works.
        # Sending random bytes might cause Whisper to fail but we want to see if it reaches the pipeline.
        # Let's try to send a tiny wave header if possible, or just fail efficiently.
        
        # Mocking 1 second of silence or just random bytes
        mock_audio = b"RIFF....WAVEfmt ...." # Very fake
        
        logger.info("Sending audio bytes...")
        await websocket.send(mock_audio)
        
        try:
            while True:
                response = await asyncio.wait_for(websocket.recv(), timeout=20.0)
                data = json.loads(response)
                logger.info(f"Received: {data}")
                
                if data.get("type") == "error":
                    # Expected because we sent garbage audio
                    logger.info("Got expected error (invalid audio) or real error.")
                    break
                if data.get("type") == "audio_url":
                    logger.info("Got audio URL! Success.")
                    break
        except asyncio.TimeoutError:
            logger.warning("Timeout waiting for response")
        except Exception as e:
            logger.error(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
