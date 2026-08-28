'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

export function CameraCapture({ onCapture }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const [error, setError] = useState('')
    const [capturedUrl, setCapturedUrl] = useState('')
    const [ready, setReady] = useState(false)

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
                video: { facingMode: 'user', width: 640, height: 640 },
                audio: false
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setReady(true)
            }
        } catch (err) {
            setError('Camera permission is required for face verification. Please enable camera access in your browser settings.')
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
        <div className="flex flex-col items-center w-full max-w-md mx-auto">
            {/* Camera Viewport Container with Square Face Target */}
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-plum-border bg-plum-night shadow-2xl">
                {error ? (
                    <div className="flex h-full items-center justify-center p-6 text-center text-xs text-saffron font-medium">
                        {error}
                    </div>
                ) : capturedUrl ? (
                    <div className="relative h-full w-full">
                        <img src={capturedUrl} alt="Captured verification selfie" className="h-full w-full object-cover" />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-mehendi/40 bg-plum-night/80 px-3 py-1 font-mono text-xs font-bold text-mehendi-light backdrop-blur-md">
                            <span className="h-2 w-2 rounded-full bg-mehendi" />
                            Selfie Captured
                        </div>
                    </div>
                ) : (
                    <div className="relative h-full w-full">
                        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" />

                        {/* Square Face Target Overlay */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                            <div className="h-64 w-64 sm:h-72 sm:w-72 rounded-3xl border-2 border-dashed border-saffron/80 shadow-[0_0_30px_rgba(240,162,2,0.3)] animate-pulse flex items-center justify-center">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-saffron/80 bg-plum-night/80 px-3 py-1 rounded-full border border-saffron/30">
                                    Align Face Here
                                </span>
                            </div>
                        </div>

                        {/* Top Alignment Guide Label */}
                        <div className="absolute top-4 inset-x-0 flex justify-center">
                            <span className="rounded-full border border-saffron/40 bg-plum-night/85 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold backdrop-blur-md">
                                Position face inside square frame
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Action Buttons */}
            <div className="mt-5 w-full">
                {capturedUrl ? (
                    <button
                        type="button"
                        onClick={retake}
                        className="w-full rounded-xl border border-plum-border bg-plum-surface/80 py-3.5 font-mono text-xs uppercase tracking-wider text-pearl-dim transition-colors hover:border-gold/50 hover:text-pearl"
                    >
                        Retake Photo
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={capture}
                        disabled={!ready || !!error}
                        className="w-full rounded-xl bg-saffron-gradient py-3.5 font-mono text-xs uppercase tracking-wider text-pearl font-semibold shadow-saffron-glow transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50"
                    >
                        Take Selfie
                    </button>
                )}
            </div>
        </div>
    )
}