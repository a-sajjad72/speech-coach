import type { VADConfig, AudioRecorderConfig } from "./types"

const DEFAULT_VAD_CONFIG: VADConfig = {
    threshold: 0.01, // RMS threshold for voice detection
    silenceMs: 800, // Duration of silence before cutting chunk
    minChunkMs: 700, // Minimum chunk duration
    maxChunkMs: 8000, // Maximum chunk duration
}

/**
 * Audio recorder with Voice Activity Detection (VAD)
 */
export class AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null
    private mediaStream: MediaStream | null = null
    private audioContext: AudioContext | null = null
    private analyser: AnalyserNode | null = null
    private dataArray: Float32Array | null = null
    private chunks: Blob[] = []
    private vadConfig: VADConfig
    private lastVoiceTimestamp = 0
    private chunkStartTimestamp = 0
    private isRecording = false
    private isMuted = false
    private vadLoopId: number | null = null

    private onAudioChunk?: (blob: Blob) => void
    private onError?: (error: Error) => void

    constructor(config: AudioRecorderConfig = {}) {
        this.vadConfig = { ...DEFAULT_VAD_CONFIG, ...config.vadConfig }
        this.onAudioChunk = config.onAudioChunk
        this.onError = config.onError
    }

    /**
     * Start recording with VAD
     */
    async start(): Promise<void> {
        if (this.isRecording) {
            console.warn("AudioRecorder: Already recording")
            return
        }

        try {
            // Get user media
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Set up Web Audio API for VAD
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const source = this.audioContext.createMediaStreamSource(this.mediaStream)
            this.analyser = this.audioContext.createAnalyser()
            this.analyser.fftSize = 2048
            this.dataArray = new Float32Array(this.analyser.fftSize)
            source.connect(this.analyser)

            // Set up MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.mediaStream, {
                mimeType: "audio/webm",
            })

            this.chunks = []
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.chunks.push(event.data)
                }
            }

            this.mediaRecorder.start()
            this.isRecording = true
            this.lastVoiceTimestamp = performance.now()
            this.chunkStartTimestamp = performance.now()

            // Start VAD loop
            this.startVADLoop()
        } catch (error) {
            this.handleError(error as Error)
            throw error
        }
    }

    /**
     * Stop recording and cleanup
     */
    stop(): void {
        if (!this.isRecording) return

        this.isRecording = false

        if (this.vadLoopId !== null) {
            cancelAnimationFrame(this.vadLoopId)
            this.vadLoopId = null
        }

        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop()
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop())
            this.mediaStream = null
        }

        if (this.audioContext) {
            this.audioContext.close()
            this.audioContext = null
        }

        this.analyser = null
        this.dataArray = null
        this.chunks = []
    }

    /**
     * Set mute state (pause sending chunks without stopping recording)
     */
    setMuted(muted: boolean): void {
        this.isMuted = muted
    }

    /**
     * Check if currently recording
     */
    get recording(): boolean {
        return this.isRecording
    }

    /**
     * Check if currently muted
     */
    get muted(): boolean {
        return this.isMuted
    }

    /**
     * VAD loop that analyzes audio and sends chunks
     */
    private startVADLoop(): void {
        const loop = () => {
            if (!this.isRecording || !this.analyser || !this.dataArray) return

            // Analyze audio data
            this.analyser.getFloatTimeDomainData(this.dataArray)

            // Calculate RMS (Root Mean Square) for volume detection
            let sum = 0
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i] * this.dataArray[i]
            }
            const rms = Math.sqrt(sum / this.dataArray.length)

            const now = performance.now()
            const isVoiced = rms > this.vadConfig.threshold

            if (isVoiced) {
                this.lastVoiceTimestamp = now
            }

            const chunkAge = now - this.chunkStartTimestamp
            const silenceAge = now - this.lastVoiceTimestamp

            // Determine if we should cut the chunk
            const shouldCut =
                chunkAge >= this.vadConfig.minChunkMs &&
                (silenceAge >= this.vadConfig.silenceMs || chunkAge >= this.vadConfig.maxChunkMs)

            if (shouldCut && this.chunks.length > 0 && !this.isMuted) {
                this.sendChunk()
            }

            this.vadLoopId = requestAnimationFrame(loop)
        }

        this.vadLoopId = requestAnimationFrame(loop)
    }

    /**
     * Send accumulated chunks as a single blob
     */
    private sendChunk(): void {
        if (this.chunks.length === 0) return

        const blob = new Blob(this.chunks, { type: "audio/webm" })
        this.chunks = []
        this.chunkStartTimestamp = performance.now()
        this.lastVoiceTimestamp = performance.now()

        if (this.onAudioChunk) {
            this.onAudioChunk(blob)
        }
    }

    /**
     * Handle errors
     */
    private handleError(error: Error): void {
        console.error("AudioRecorder error:", error)
        if (this.onError) {
            this.onError(error)
        }
    }
}

/**
 * Audio playback queue for sequential playback
 */
export class AudioPlaybackQueue {
    private queue: string[] = []
    private isPlaying = false
    private currentAudio: HTMLAudioElement | null = null

    /**
     * Add audio URL to queue
     */
    enqueue(audioUrl: string): void {
        this.queue.push(audioUrl)
        if (!this.isPlaying) {
            this.playNext()
        }
    }

    /**
     * Play next audio in queue
     */
    private async playNext(): Promise<void> {
        if (this.queue.length === 0) {
            this.isPlaying = false
            return
        }

        this.isPlaying = true
        const url = this.queue.shift()!

        try {
            this.currentAudio = new Audio(url)

            await new Promise<void>((resolve, reject) => {
                if (!this.currentAudio) {
                    reject(new Error("Audio element not initialized"))
                    return
                }

                this.currentAudio.onended = () => resolve()
                this.currentAudio.onerror = () => reject(new Error("Audio playback failed"))
                this.currentAudio.play().catch(reject)
            })
        } catch (error) {
            console.error("Error playing audio:", error)
        } finally {
            this.currentAudio = null
            this.playNext()
        }
    }

    /**
     * Stop playback and clear queue
     */
    stop(): void {
        this.queue = []
        if (this.currentAudio) {
            this.currentAudio.pause()
            this.currentAudio = null
        }
        this.isPlaying = false
    }

    /**
     * Check if currently playing
     */
    get playing(): boolean {
        return this.isPlaying
    }
}
