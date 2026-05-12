import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Camera, CheckCircle, AlertTriangle, ScanFace } from 'lucide-react';
import { useStudent } from '../context/StudentContext';

const RegisterFace = () => {
    const { loadProfile } = useStudent();
    const webcamRef = useRef(null);
    const [capturing, setCapturing] = useState(false);
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle'); // idle, success, error
    const [capturedImage, setCapturedImage] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceApi, setFaceApi] = useState(null);
    const navigate = useNavigate();

    // Load FaceAPI Models
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                const faceapiModule = await import('face-api.js');
                setFaceApi(faceapiModule);
                await Promise.all([
                    faceapiModule.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapiModule.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapiModule.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (err) {
                console.error("Model Load Error:", err);
                setMessage("Failed to load AI models. Please refresh.");
                setStatus('error');
            }
        };
        loadModels();
    }, []);

    const handleCapture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
            setMessage('');
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setMessage('');
        setStatus('idle');
    };

    const registerFace = async () => {
        if (!capturedImage) return;
        if (!modelsLoaded || !faceApi) {
            setMessage('AI Models still loading... please wait.');
            return;
        }

        setCapturing(true);
        setMessage('Analysing Face...');
        setStatus('idle');

        try {
            // 1. Process Image & Detect Face Locally
            const img = new Image();
            img.src = capturedImage;
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 640;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Detect Face
            const detection = await faceApi.detectSingleFace(canvas, new faceApi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setMessage('No face detected. Please Retake.');
                setStatus('error');
                setCapturing(false);
                return;
            }

            // 2. Prepare Upload
            setMessage('Registering...');
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
            const descriptor = Array.from(detection.descriptor);

            const formData = new FormData();
            formData.append('image', blob, 'face.jpg');
            formData.append('rollNo', localStorage.getItem('studentId'));
            formData.append('faceDescriptor', JSON.stringify(descriptor));

            // 3. Send to Backend
            const token = localStorage.getItem('studentToken');
            await axios.post(`${API_BASE_URL}/attendance/register-face`, formData, { 
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                } 
            });

            setMessage('Face Registered Successfully!');
            setStatus('success');
            await loadProfile();
            setTimeout(() => navigate('/dashboard'), 2000);

        } catch (error) {
            // Error logged without exposing server details
            setMessage('Registration Failed. Try again.');
            setStatus('error');
        }
        setCapturing(false);
    };

    return (
        <div className="animate-fadeIn" style={{ 
            padding: '24px 16px', 
            width: '100%', 
            maxWidth: '500px', 
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        }}>
            {/* Unified Header */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px 0', color: 'white', letterSpacing: '-0.5px' }}>Register Face</h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {localStorage.getItem('studentName') || localStorage.getItem('studentId')}
                </p>
            </div>

            {/* Camera / Image Container */}
            <div className="webcam-container" style={{ 
                width: '100%', 
                aspectRatio: '1/1', 
                background: 'black', 
                borderRadius: '32px', 
                overflow: 'hidden', 
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                border: '2px solid rgba(255,255,255,0.05)'
            }}>
                {!capturedImage ? (
                    modelsLoaded ? (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            mirrored={true}
                            width="100%"
                            height="100%"
                            videoConstraints={{ facingMode: "user" }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                            <ScanFace size={48} className="animate-pulse mb-4" />
                            <p>Loading AI Models...</p>
                        </div>
                    )
                ) : (
                    <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
            </div>

            <p className="text-center" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', padding: '0 10px', margin: 0 }}>
                {!capturedImage ? "Ensure your face is clearly visible and well-lit." : "Review your photo. Ensure face is clear."}
            </p>

            {/* Status Message */}
            {message && (
                <div className="text-center flex items-center justify-center gap-2" style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    color: status === 'success' ? '#6ee7b7' : '#fca5a5',
                    fontWeight: '600'
                }}>
                    {status === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    <span>{message}</span>
                </div>
            )}

            {/* Controls */}
            <div style={{ marginTop: 'auto', width: '100%' }}>
                {!capturedImage ? (
                    <button
                        onClick={handleCapture}
                        disabled={!modelsLoaded}
                        className="btn btn-primary"
                        style={{ height: '56px', fontSize: '1.1rem', width: '100%', opacity: modelsLoaded ? 1 : 0.7, borderRadius: '16px' }}
                    >
                        <Camera size={20} />
                        {modelsLoaded ? 'Capture Photo' : 'Loading...'}
                    </button>
                ) : (
                    <div className="flex gap-3" style={{ width: '100%' }}>
                        <button
                            onClick={handleRetake}
                            disabled={capturing}
                            className="btn"
                            style={{ flex: 1, height: '56px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '16px' }}
                        >
                            Retake
                        </button>
                        <button
                            onClick={registerFace}
                            disabled={capturing}
                            className="btn btn-primary"
                            style={{ flex: 1, height: '56px', borderRadius: '16px' }}
                        >
                            {capturing ? 'Registering...' : 'Confirm'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegisterFace;
