import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// face-api.js is now dynamically imported
import { MapPin, ScanFace, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { API_BASE_URL } from '../config';

const AttendanceCamera = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [statusType, setStatusType] = useState('info'); // info, success, warning, error
    const [location, setLocation] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [detectedName, setDetectedName] = useState('');
    const navigate = useNavigate();
    const [faceApi, setFaceApi] = useState(null); // Store the dynamically imported library



    // 1. Load Models Dynamic Import
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                // Dynamic Import
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
                setStatus('Error loading face models. Refresh.');
                setStatusType('error');
            }
        };
        loadModels();
    }, []);

    // 2. Geolocation
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            }, (err) => {
                setStatus('Error: Location access denied.');
                setStatusType('error');
            });
        }
    }, []);

    // 3. Detection Loop
    const handleVideoOnPlay = () => {
        const interval = setInterval(async () => {
            if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4 && canvasRef.current && faceApi) {
                const video = webcamRef.current.video;
                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                faceApi.matchDimensions(canvasRef.current, displaySize);
                const detections = await faceApi.detectAllFaces(video, new faceApi.SsdMobilenetv1Options({ minConfidence: 0.5 }));
                const resizedDetections = faceApi.resizeResults(detections, displaySize);
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Custom Drawing Logic intentionally removed to show clean feed
                // If we want to show just a subtle box, we can uncomment simple drawing
                // But user requested removal of "neon green border"
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }, 500); // Optimized: Reduced frequency from 100ms to 500ms to save resources
        return () => clearInterval(interval);
    };

    const markAttendance = async () => {
        if (!location) { setStatus('Waiting for GPS...'); return; }
        if (!faceApi) return;
        setLoading(true); setStatus('Verifying Identity...');

        try {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                setStatus('Camera capture failed');
                setLoading(false);
                return;
            }

            // Resize Logic
            const img = new Image();
            img.src = imageSrc;
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 640;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Generate Descriptor Client-Side (Use resized canvas - Faster)
            const detection = await faceApi.detectSingleFace(canvas, new faceApi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setStatus('Face not detected clearly. Try again.');
                setStatusType('warning');
                setLoading(false);
                return;
            }

            const descriptor = Array.from(detection.descriptor); // Convert Float32Array to normal array

            // Create compressed blob from canvas
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));

            const formData = new FormData();
            formData.append('image', blob, 'attendance.jpg');
            formData.append('studentId', localStorage.getItem('studentId'));
            formData.append('latitude', location.latitude);
            formData.append('longitude', location.longitude);
            formData.append('faceDescriptor', JSON.stringify(descriptor)); // Send descriptor

            const res = await axios.post(`${API_BASE_URL}/attendance/mark`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            const studentName = res.data.studentName || "Student";
            setDetectedName(studentName);
            setStatus(`Verified: ${studentName}`);
            setStatusType('success');
            setTimeout(() => navigate('/dashboard'), 4000);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Verification Failed";

            if (msg.includes("already marked")) {
                setStatus(msg);
                setStatusType('warning');
            } else {
                setStatus(`Failed: ${msg}`);
                setStatusType('error');
            }
        }
        setLoading(false);
    };

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
            <div className="glass-card animate-fadeIn" style={{ position: 'relative', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>

                {/* Header */}
                {/* Header */}
                <div style={{ textAlign: 'left' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 4px 0', color: 'white' }}>Attendance</h2>
                    <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)' }}>
                        {localStorage.getItem('studentName')?.split(' ')[0] || 'Student'}
                    </p>
                </div>

                {/* Camera Feed */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1/1', // Square aspect ratio
                    background: 'black',
                    borderRadius: '24px', // Rounded Square
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)'
                }}>
                    {modelsLoaded ? (
                        <>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    facingMode: "user",
                                    aspectRatio: 1, // Force square hardware capture
                                    width: { ideal: 720 },
                                    height: { ideal: 720 }
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover', // Force fill container
                                    transform: 'scaleX(-1)' // Mirror effect
                                }}
                                onUserMedia={handleVideoOnPlay}
                            />
                            <canvas
                                ref={canvasRef}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            />
                        </>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                            <ScanFace size={48} className="animate-pulse mb-4" />
                            <p>Loading Camera...</p>
                        </div>
                    )}

                    {/* Detected Name Overlay */}
                    {detectedName && (
                        <div style={{
                            position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(34, 197, 94, 0.95)', color: 'white', padding: '10px 20px', borderRadius: '30px',
                            display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)'
                        }}>
                            <CheckCircle size={18} />
                            <span style={{ fontWeight: '600' }}>{detectedName}</span>
                        </div>
                    )}
                </div>

                {/* Status Indicators */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="glass-card" style={{
                        padding: '12px', background: 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <MapPin size={16} color={location ? "#4ade80" : "#fbbf24"} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{location ? 'Location Set' : 'Locating...'}</span>
                    </div>
                    <div className="glass-card" style={{
                        padding: '12px', background: 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <ScanFace size={16} color={modelsLoaded ? "#4ade80" : "#fbbf24"} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{modelsLoaded ? 'Face ID Ready' : 'Loading AI'}</span>
                    </div>
                </div>

                {/* Status Message */}
                {status && !detectedName && (
                    <div style={{
                        padding: '12px', borderRadius: '12px', textAlign: 'center',
                        background: statusType === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                            statusType === 'warning' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${statusType === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                            statusType === 'warning' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.2)'
                            }`,
                        color: statusType === 'warning' ? '#facc15' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        {statusType === 'error' ? <AlertCircle size={16} /> : <Activity size={16} />}
                        <span style={{ fontSize: '0.9rem' }}>{status}</span>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={markAttendance}
                    disabled={loading || !location || !modelsLoaded}
                    className="btn-primary"
                    style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '16px', marginTop: '8px' }}
                >
                    {loading ? 'Verifying...' : 'Mark Attendance'}
                </button>
            </div>
        </div>
    );
};

export default AttendanceCamera;
