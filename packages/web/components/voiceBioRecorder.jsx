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

    //   /streams r data that flows //tiny data
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      //the recorder which stores the audio in browser
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/mpeg']
        .find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      chunksRef.current = []
      recorderRef.current = recorder

      //when started listen all the chunks and save it in stream
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        // /convert in blob where blob is a collection of chubks
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })

        //convert the audioblob in file type
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
    } catch {
      setError('Microphone permission is required to record your voice introduction')
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

  return (
    <div>
      <p>Voice introduction</p>
      <p>Record a short introduction, up to 15 seconds.</p>

      {recording ? (
        <button type="button" onClick={stopRecording}>
          Stop recording ({seconds}s)
        </button>
      ) : (
        <button type="button" onClick={startRecording}>
          Record voice introduction
        </button>
      )}

      {value && (
        <audio
          controls
          src={typeof value === 'string' ? value : URL.createObjectURL(value)}
          className="mt-3 w-full"
        />
      )}

      {error && <p>{error}</p>}
    </div>
  )
}