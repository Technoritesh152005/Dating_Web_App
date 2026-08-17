'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/user_interface/Button'

export function CameraCapture({ onCapture }) {

    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const [error, setError] = useState('')
    const [capturedUrl, setCapturedUrl] = useState('')
    const [ready, setReady] = useState(false)

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (capturedUrl) {
                URL.revokeObjectURL(capturedUrl)
            }
        }
    }, [capturedUrl])

    const startCamera = useCallback(async () => {
        setError('')
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 480, height: 480 },
                audio: false
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setReady(true)
            }
        } catch (err) {
            setError('Camera access is required for verification. Please allow camera permission and try again.')
        }
    }, [])

    useEffect(() => {
        startCamera()
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop())
        }
    }, [startCamera])

    const capture = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) {
            setError('Failed to capture image. Please try again.')
            return
        }

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        canvas.toBlob((blob) => {
            if (!blob) {
                setError('Failed to process image. Please try again.')
                return
            }
            const url = URL.createObjectURL(blob)
            setCapturedUrl(url)
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
            onCapture(file)
            streamRef.current?.getTracks().forEach((track) => track.stop())
        }, 'image/jpeg', 0.9)
    }

    const retake = () => {
        if (capturedUrl) {
            URL.revokeObjectURL(capturedUrl)
        }
        setCapturedUrl('')
        onCapture(null)
        startCamera()
    }

    return (
        <div className="flex flex-col items-center">
            <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-card border border-cream/10 bg-dusk-light">
                {error ? (
                    <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-sindoor-light">{error}</div>
                ) : capturedUrl ? (
                    <img src={capturedUrl} alt="Captured selfie" className="h-full w-full object-cover" />
                ) : (
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-5">
                {capturedUrl ? (
                    <Button type="button" variant="secondary" onClick={retake}>
                        Retake
                    </Button>
                ) : (
                    <Button type="button" variant="primary" onClick={capture} disabled={!ready || !!error} showBloom>
                        Capture selfie
                    </Button>
                )}
            </div>
        </div>
    )
}