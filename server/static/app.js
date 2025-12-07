let sessionId = null;
let mediaRecorder = null;
let callActive = false;
let muteActive = false;
let recordedChunks = [];
let isRecording = false;
let callStream = null;
let callRecorder = null;
let callChunks = [];
let vadAnalyser = null;
let vadSource = null;
let audioCtx = null;
let vadSilenceMs = 800;
let vadThreshold = 0.01; // RMS threshold
let minChunkMs = 700;
let maxChunkMs = 8000;
let lastVoiceTs = 0;
let chunkStartTs = 0;

const llmSelect = document.getElementById("llm-select");
const ttsModelSelect = document.getElementById("tts-model-select");
const speakerSelect = document.getElementById("speaker-select");
const callToggle = document.getElementById("call-toggle");
const muteToggle = document.getElementById("mute-toggle");
const statusText = document.getElementById("status-text");
const sessionLabel = document.getElementById("session-label");
const chatMessagesEl = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const uploadBtn = document.getElementById("upload-btn");
const audioFile = document.getElementById("audio-file");
const recordBtn = document.getElementById("record-btn");

async function loadModels() {
    const res = await fetch("/api/models");
    if (!res.ok) return;
    const data = await res.json();
    const models = data.llm_models || [];
    const ttsModels = data.tts_models || [];

    function populate(selectEl, items, valueKey, labelKey, def) {
        selectEl.innerHTML = "";
        items.forEach((item) => {
            const opt = document.createElement("option");
            opt.value = item[valueKey];
            opt.textContent = item[labelKey];
            if (item[valueKey] === def) opt.selected = true;
            selectEl.appendChild(opt);
        });
    }

    populate(llmSelect, models, "tag", "name", data.default_model);
    populate(ttsModelSelect, ttsModels, "id", "id", data.default_tts_model || (ttsModels[0] || {}).id);

    function setSpeakersForModel(modelId) {
        const found = ttsModels.find((m) => m.id === modelId);
        const available = (found && found.speakers) || [];
        const speakerItems = available.map((s) => ({ id: s, name: s }));
        populate(speakerSelect, speakerItems, "id", "name", available[0] || "");
        speakerSelect.disabled = speakerItems.length === 0;
    }

    setSpeakersForModel(ttsModelSelect.value);
    ttsModelSelect.addEventListener("change", () => setSpeakersForModel(ttsModelSelect.value));
}

async function createSession(mode = "chat") {
    // Do not create a new session if one already exists; reuse current chat.
    if (sessionId) return sessionId;
    const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
    });
    if (!res.ok) throw new Error("Failed to create session");
    const data = await res.json();
    sessionId = data.session_id;
    sessionLabel.textContent = `Session ${sessionId}`;
    statusText.textContent = `Mode: ${mode}`;
    await loadChatHistory();
    return sessionId;
}

async function ensureSession() {
    if (sessionId) return;
    await createSession("chat");
}

async function sendTextMessage(text) {
    await ensureSession();
    const res = await fetch("/api/send_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            text,
            model: llmSelect.value || null,
            tts_model: ttsModelSelect.value || null,
            speaker: speakerSelect.value || null,
        }),
    });
    if (!res.ok) throw new Error("Send failed");
    const data = await res.json();
    await loadChatHistory();
    new Audio(data.coach_audio_url).play().catch(() => { });
}

async function sendAudioBlob(blob, opts = {}) {
    await ensureSession();
    const fd = new FormData();
    fd.append("session_id", sessionId);
    fd.append("audio", blob, "audio.webm");
    fd.append("model", llmSelect.value || "");
    fd.append("tts_model", ttsModelSelect.value || "");
    fd.append("speaker", speakerSelect.value || "");
    if (opts.callMode) fd.append("call_mode", "true");
    const res = await fetch("/api/process_audio", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Audio processing failed");
    const data = await res.json();
    await loadChatHistory();
    new Audio(data.coach_audio_url).play().catch(() => { });
}

async function loadChatHistory() {
    if (!sessionId) return;
    const res = await fetch(`/api/chat/history?session_id=${sessionId}`);
    if (!res.ok) return;
    const data = await res.json();
    chatMessagesEl.innerHTML = "";
    data.messages.forEach((m) => {
        const bubble = document.createElement("div");
        bubble.className = `bubble ${m.sender}`;
        const text = document.createElement("div");
        text.textContent = m.text || "";
        bubble.appendChild(text);
        if (m.audio_path) {
            const audio = document.createElement("audio");
            audio.controls = true;
            audio.src = m.audio_path.replace(/^.*output[\\/]/, "/output/");
            bubble.appendChild(audio);
        }
        const meta = document.createElement("span");
        meta.className = "meta";
        meta.textContent = m.sender === "coach" ? "Coach" : "You";
        bubble.appendChild(meta);
        chatMessagesEl.appendChild(bubble);
    });
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            isRecording = false;
            recordBtn.textContent = "🎙";
            if (recordedChunks.length > 0) {
                const blob = new Blob(recordedChunks, { type: "audio/webm" });
                await sendAudioBlob(blob);
            }
        };
        mediaRecorder.start();
        isRecording = true;
        recordBtn.textContent = "■";
        statusText.textContent = "Recording... release to send";
    } catch (err) {
        alert("Mic access failed: " + err);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    }
}

async function startCallCapture() {
    console.log("callRecorder", callRecorder);
    if (callRecorder) return;
    try {
        console.log("trying to get user media");
        callStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        vadSource = audioCtx.createMediaStreamSource(callStream);
        vadAnalyser = audioCtx.createAnalyser();
        vadAnalyser.fftSize = 2048;
        const dataArray = new Float32Array(vadAnalyser.fftSize);
        vadSource.connect(vadAnalyser);

        callChunks = [];
        lastVoiceTs = performance.now();
        chunkStartTs = performance.now();

        callRecorder = new MediaRecorder(callStream);
        callRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) callChunks.push(e.data);
        };
        callRecorder.start();
        console.log("callRecorder started");
        const vadLoop = async () => {
            if (!callActive || !vadAnalyser) return;
            vadAnalyser.getFloatTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
            const rms = Math.sqrt(sum / dataArray.length);
            const now = performance.now();
            const voiced = rms > vadThreshold;
            if (voiced) lastVoiceTs = now;
            const chunkAge = now - chunkStartTs;
            const silenceAge = now - lastVoiceTs;
            const shouldCut = chunkAge >= minChunkMs && (silenceAge >= vadSilenceMs || chunkAge >= maxChunkMs);
            console.log("shouldCut", shouldCut, chunkAge, silenceAge, lastVoiceTs, chunkStartTs, callChunks.length, muteActive);
            if (shouldCut && callChunks.length > 0 && !muteActive) {
                const blob = new Blob(callChunks, { type: "audio/webm" });
                callChunks = [];
                chunkStartTs = now;
                lastVoiceTs = now;
                statusText.textContent = "Sending call chunk...";
                try {
                    await sendAudioBlob(blob, { callMode: true });
                    statusText.textContent = "Call mode active";
                } catch (err) {
                    console.error(err);
                    statusText.textContent = "Error sending chunk";
                }
            }
            requestAnimationFrame(vadLoop);
        };
        requestAnimationFrame(vadLoop);
        statusText.textContent = "Call mode active (listening)";
    } catch (err) {
        console.error(err);
        statusText.textContent = "Mic access failed";
    }
}

function stopCallCapture() {
    if (callRecorder) {
        if (callRecorder.state === "recording") callRecorder.stop();
        callRecorder = null;
    }
    if (callStream) {
        callStream.getTracks().forEach((t) => t.stop());
        callStream = null;
    }
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
    vadAnalyser = null;
    vadSource = null;
    callChunks = [];
}

// Event bindings
callToggle.addEventListener("click", async () => {
    await ensureSession();
    callActive = !callActive;
    callToggle.textContent = callActive ? "End Call" : "Start Call";
    if (callActive) {
        console.log("Starting call capture");
        startCallCapture();
        console.log("Call capture started");
    } else {
        stopCallCapture();
        console.log("Call capture stopped");
        statusText.textContent = "Chat mode";
    }
});

muteToggle.addEventListener("click", () => {
    muteActive = !muteActive;
    muteToggle.textContent = muteActive ? "Unmute" : "Mute";
    statusText.textContent = muteActive ? "Call muted" : callActive ? "Call mode active" : "Chat mode";
});

chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = "";
    statusText.textContent = "Sending text...";
    try {
        await sendTextMessage(text);
        statusText.textContent = callActive ? "Call mode active" : "Chat mode";
    } catch (err) {
        alert(err.message);
        statusText.textContent = "Error sending text";
    }
});

uploadBtn.addEventListener("click", () => audioFile.click());

audioFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    statusText.textContent = "Uploading audio...";
    try {
        await sendAudioBlob(file);
        statusText.textContent = callActive ? "Call mode active" : "Chat mode";
    } catch (err) {
        alert(err.message);
        statusText.textContent = "Error sending audio";
    } finally {
        audioFile.value = "";
    }
});

recordBtn.addEventListener("click", () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

// Init
loadModels().then(() => ensureSession().then(loadChatHistory));

