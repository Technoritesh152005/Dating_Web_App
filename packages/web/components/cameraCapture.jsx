'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from './user_interface/Button.jsx'

export function cameraCapture({ onCapture }) {

    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const [error, setError] = useState('')
    const [capturedUrl, setCaptureUrl] = useState('')
    const [ready, setReady] = useState(false)

    const startCamera = useCallback(async () => {
        
        setError(null)
        try {
            /* This removes the camera from browser */
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 480, height: 480 },
                audio: false
            })
            streamRef.current = stream
            /* put the live camera stream inside my video element */
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setReady(true)
            }
        } catch (err) {
            setError('Camera access is required for verification. Please allow camera permission and try again.');

        }
    }, [])

    /* when the components run , useeffect opens camera and while closing it fress the camera */
    useEffect(() => {
        startCamera();
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, [startCamera]);

    const capture = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)

        /* convert canva pixel to image */
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            setCaptureUrl(url)
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
            /* send this file to parent component */
            onCapture(file)
            streamRef.current?.getTracks().forEach((track) => track.stop());
        }, 'image/jpeg', 1)
    }

    const retake =()=>{
        setCaptureUrl(null)
        onCapture(null)
        startCamera()
    }

    return (
        <div className="flex flex-col items-center">
          <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-card border border-cream/10 bg-dusk-light">
            {error ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-sindoor-light">{error}</div>
            ) : capturedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
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
      );
}