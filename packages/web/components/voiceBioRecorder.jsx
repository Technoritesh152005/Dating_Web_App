'use client'

import { useEffect, useRef, useState } from 'react'

const MAX_DURATION_SECONDS = 15

export function VoiceBioRecorder({ value, onChange }) {
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState(null)
  const previewUrlRef = useRef(null)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      recorderRef.current?.stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      let options = undefined;
      const supportedTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg'];
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          options = { mimeType: type };
          break;
        }
      }

      const recorder = new MediaRecorder(stream, options)
      chunksRef.current = []
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })

        const extension = audioBlob.type.includes('mp4') ? 'm4a' : audioBlob.type.includes('mpeg') ? 'mp3' : 'webm'
        const audioFile = new File([audioBlob], `voice-bio-${Date.now()}.${extension}`, { type: audioBlob.type })

        onChange(audioFile)
      }

      recorder.stream = stream
      recorder.start()
      setRecording(true)
      setSeconds(0)

      timerRef.current = window.setInterval(() => {
        setSeconds((current) => {
          if (current + 1 >= MAX_DURATION_SECONDS) {
            stopRecording()
          }
          return current + 1
        })
      }, 1000)
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission was denied. Please allow microphone access in your browser settings.')
      } else {
        setError(err.message || 'Unable to start audio recording. Please try again.')
      }
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }

    setRecording(false)
  }

  const audioSrc = typeof value === 'string' ? value : value ? URL.createObjectURL(value) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-pearl">Voice Introduction</p>
          <p className="text-xs text-pearl-dim">Record a short audio introduction (up to 15 seconds).</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center justify-center gap-2 rounded-xl border border-saffron bg-saffron/20 px-4 py-3 font-mono text-xs font-bold text-saffron shadow-saffron-glow animate-pulse"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-saffron" />
            <span>Stop Recording ({seconds}s / 15s)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 font-mono text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>{audioSrc ? 'Re-record Voice Introduction' : 'Record Voice Introduction'}</span>
          </button>
        )}

        {audioSrc && (
          <div className="rounded-xl border border-plum-border bg-plum-night/90 p-3">
            <audio controls src={audioSrc} className="w-full h-8" />
          </div>
        )}

        {error && <p className="text-xs text-sindoor-light font-medium">{error}</p>}
      </div>
    </div>
  )
}