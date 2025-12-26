import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { ArrowLeft, Camera, CheckCircle, AlertTriangle, ScanFace } from 'lucide-react';

const RegisterFace = () => {
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

            const ctx = canvas.getContext('2d');
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
            await axios.post(`${API_BASE_URL}/attendance/register-face`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            setMessage('Face Registered Successfully!');
            setStatus('success');
            setTimeout(() => navigate('/dashboard'), 2000);

        } catch (error) {
            console.error(error);
            setMessage('Registration Failed. Try again.');
            setStatus('error');
        }
        setCapturing(false);
    };

    return (
        <div className="glass-card animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => navigate('/dashboard')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Register Face</h2>
                <div style={{ width: '36px' }}></div>
            </div>

            <div className="text-center mb-4">
                <h3 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'capitalize' }}>
                    {localStorage.getItem('studentName') || localStorage.getItem('studentId')}
                </h3>
            </div>

            {/* Camera / Image Container */}
            <div className="webcam-container mb-4" style={{ height: '350px', background: 'black', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                {!capturedImage ? (
                    modelsLoaded ? (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
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

            <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem', padding: '0 10px' }}>
                {!capturedImage ? "Ensure your face is clearly visible and well-lit." : "Review your photo. Ensure face is clear."}
            </p>

            {/* Status Message */}
            {message && (
                <div className={`glass-card text-center mb-4 flex items-center justify-center gap-2`} style={{
                    padding: '12px',
                    background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${status === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                    {status === 'success' ? <CheckCircle size={18} color="#6ee7b7" /> : <AlertTriangle size={18} color="#fca5a5" />}
                    <span>{message}</span>
                </div>
            )}

            {/* Controls */}
            {!capturedImage ? (
                <button
                    onClick={handleCapture}
                    disabled={!modelsLoaded}
                    className="btn btn-primary"
                    style={{ height: '56px', fontSize: '1.1rem', width: '100%', opacity: modelsLoaded ? 1 : 0.7 }}
                >
                    <Camera size={20} />
                    {modelsLoaded ? 'Capture Photo' : 'Loading...'}
                </button>
            ) : (
                <div className="flex gap-3">
                    <button
                        onClick={handleRetake}
                        disabled={capturing}
                        className="btn"
                        style={{ flex: 1, height: '56px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                        Retake
                    </button>
                    <button
                        onClick={registerFace}
                        disabled={capturing}
                        className="btn btn-primary"
                        style={{ flex: 1, height: '56px' }}
                    >
                        {capturing ? 'Register' : 'Confirm & Register'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RegisterFace;
