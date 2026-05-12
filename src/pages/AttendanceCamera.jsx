import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapPin, ScanFace, CheckCircle, AlertCircle, RefreshCw, ShieldCheck, UserCheck, Eye, ArrowRight, Activity } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';
import { useStudent } from '../context/StudentContext';

const AttendanceCamera = () => {
    const { profile } = useStudent();
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [statusType, setStatusType] = useState('info'); // 'info', 'success', 'error', 'warning'
    const [livenessState, setLivenessState] = useState('INITIAL'); // 'INITIAL', 'TURN_LEFT', 'TURN_RIGHT', 'VERIFIED'
    const [lastEAR, setLastEAR] = useState(1);
    const [location, setLocation] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [detectedName, setDetectedName] = useState('');
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [liveDetectionStatus, setLiveDetectionStatus] = useState('POSITION FACE IN FRAME');
    const navigate = useNavigate();

    const format12Hour = (timeStr) => {
        if (!timeStr) return '--:--';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
    };

    // Liveness Detection Helper: Eye Aspect Ratio (EAR)
    const calculateEAR = (eye) => {
        const p1 = eye[0], p2 = eye[1], p3 = eye[2], p4 = eye[3], p5 = eye[4], p6 = eye[5];
        const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        const v1 = dist(p2, p6);
        const v2 = dist(p3, p5);
        const h = dist(p1, p4);
        return (v1 + v2) / (2.0 * h);
    };

    // Liveness Detection Helper: Yaw (Turn) estimation
    const getYawRatio = (landmarks) => {
        const nose = landmarks.getNose()[0];
        const leftEye = landmarks.getLeftEye()[0];
        const rightEye = landmarks.getRightEye()[3]; // Outer corner
        const leftDist = Math.abs(nose.x - leftEye.x);
        const rightDist = Math.abs(nose.x - rightEye.x);
        return leftDist / rightDist;
    };

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                setLiveDetectionStatus('LOADING MODELS...');
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                console.log("Models loaded successfully");
                setModelsLoaded(true);
                setLiveDetectionStatus('POSITION FACE IN FRAME');
            } catch (err) {
                console.error("Model Load Error:", err);
                setStatus('Error loading face models. Check if /public/models exists.');
                setStatusType('error');
                setLiveDetectionStatus('MODEL ERROR');
            }
        };
        loadModels();
    }, []);

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

    // Time & Location Validation (Route Protection)
    useEffect(() => {
        const checkRestrictions = async () => {
            try {
                const token = localStorage.getItem('studentToken');
                const sid = localStorage.getItem('studentId');
                if (!sid || !token) return;

                if (profile && profile.hostelId) {
                    const hostelId = profile.hostelId;
                    
                    let schemas = null;
                    const cachedSchema = localStorage.getItem('hostelSchemasCache');
                    if (cachedSchema) {
                        const parsed = JSON.parse(cachedSchema);
                        if (Date.now() - parsed.timestamp < 1 * 60 * 60 * 1000) { // 1 hour cache
                            schemas = parsed.data;
                        }
                    }

                    if (!schemas) {
                        const schemasRes = await axios.get(`${API_BASE_URL}/schemas/getHostels`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        schemas = schemasRes.data.hostels;
                        localStorage.setItem('hostelSchemasCache', JSON.stringify({
                            data: schemas,
                            timestamp: Date.now()
                        }));
                    }

                    const myHostel = schemas.find(h => h.code?.toLowerCase() === hostelId?.toLowerCase());
                    if (myHostel) {
                        // Time Check using IST
                        const start = myHostel.attendanceStartTime || "00:00";
                        const end = myHostel.attendanceEndTime || "23:59";
                        
                        // Get current time in IST
                        const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
                        
                        const setTime = (tStr) => {
                            const [h, m] = tStr.split(':');
                            const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
                            d.setHours(parseInt(h), parseInt(m), 0, 0);
                            return d;
                        };

                        const startTimeDate = setTime(start);
                        const endTimeDate = setTime(end);

                        if (nowIST < startTimeDate || nowIST > endTimeDate) {
                            toast.error(`Attendance is closed. Open: ${format12Hour(start)} - ${format12Hour(end)}`, { duration: 5000 });
                            navigate('/dashboard');
                            return;
                        }

                        // Location Check (Double Check)
                        if (myHostel.geoCoordinates && myHostel.geoCoordinates.latitude) {
                            const target = myHostel.geoCoordinates;

                            if ("geolocation" in navigator) {
                                navigator.geolocation.getCurrentPosition((pos) => {
                                    const R = 6371e3;
                                    const lat1 = pos.coords.latitude;
                                    const lon1 = pos.coords.longitude;
                                    const lat2 = target.latitude;
                                    const lon2 = target.longitude;

                                    const dLat = (lat2 - lat1) * Math.PI / 180;
                                    const dLon = (lon2 - lon1) * Math.PI / 180;
                                    const a =
                                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                    const dist = R * c;

                                    if (dist > (target.radius || 200)) {
                                        toast.error(`You are out of range (${Math.round(dist)}m). Go closer to hostel.`);
                                        navigate('/dashboard');
                                    }
                                }, null, { enableHighAccuracy: true });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Check failed", error);
            }
        };
        checkRestrictions();
    }, [navigate, profile]);

    useEffect(() => {
        let interval;
        const hiddenCanvas = document.createElement('canvas');
        const hiddenCtx = hiddenCanvas.getContext('2d');

        if (modelsLoaded && !detectedName) {
            interval = setInterval(async () => {
                if (!webcamRef.current?.video || !canvasRef.current || webcamRef.current.video.readyState !== 4) return;
                try {
                    const video = webcamRef.current.video;
                    const { videoWidth, videoHeight } = video;
                    
                    if (videoWidth === 0 || videoHeight === 0) return;

                    // Set hidden canvas size to match video
                    if (hiddenCanvas.width !== videoWidth) {
                        hiddenCanvas.width = videoWidth;
                        hiddenCanvas.height = videoHeight;
                        faceapi.matchDimensions(canvasRef.current, { width: videoWidth, height: videoHeight });
                    }

                    // Draw current frame to hidden canvas
                    hiddenCtx.drawImage(video, 0, 0, videoWidth, videoHeight);

                    // Detect on the hidden canvas with slightly lower confidence
                    const detection = await faceapi.detectSingleFace(hiddenCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
                        .withFaceLandmarks();
                    
                    if (!detection) {
                        setIsFaceDetected(false);
                        // Security: If person leaves frame after verification, reset liveness check
                        if (livenessState === 'VERIFIED') {
                            setLivenessState('INITIAL');
                            setLiveDetectionStatus('POSITION FACE IN FRAME');
                        } else if (livenessState !== 'VERIFIED') {
                            setLiveDetectionStatus('POSITION FACE IN FRAME');
                        }
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    } else {
                        setIsFaceDetected(true);
                        
                        // Drawing corner brackets
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        const box = detection.detection.box;
                        const { x, y, width, height } = box;
                        
                        // Security: Ensure full face is in frame (not cut off at edges)
                        const edgeMargin = 20;
                        const isCutOff = x < edgeMargin || y < edgeMargin || 
                                         (x + width) > (videoWidth - edgeMargin) || 
                                         (y + height) > (videoHeight - edgeMargin);
                                         
                        if (isCutOff) {
                            setLiveDetectionStatus('CENTER YOUR FACE');
                            setIsFaceDetected(false);
                            // If they move to the edge after verification, reset it
                            if (livenessState === 'VERIFIED') {
                                setLivenessState('INITIAL');
                            }
                            return;
                        }
                        ctx.strokeStyle = '#3b82f6';
                        ctx.lineWidth = 4;
                        const length = 25;
                        ctx.beginPath();
                        ctx.moveTo(x, y + length); ctx.lineTo(x, y); ctx.lineTo(x + length, y);
                        ctx.moveTo(x + width - length, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + length);
                        ctx.moveTo(x, y + height - length); ctx.lineTo(x, y + height); ctx.lineTo(x + length, y + height);
                        ctx.moveTo(x + width - length, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - length);
                        ctx.stroke();

                        // --- Liveness Detection Sequence ---
                        const landmarks = detection.landmarks;
                        const leftEye = landmarks.getLeftEye();
                        const rightEye = landmarks.getRightEye();
                        const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2;
                        const yawRatio = getYawRatio(landmarks);
                        
                        setDebugInfo(`Yaw: ${yawRatio.toFixed(1)}`);

                        if (livenessState === 'INITIAL') {
                            setLivenessState('TURN_LEFT');
                            setLiveDetectionStatus('TURN HEAD LEFT');
                        } else if (livenessState === 'TURN_LEFT') {
                            setLiveDetectionStatus('TURN HEAD LEFT');
                            if (yawRatio > 1.5) {
                                setLivenessState('TURN_RIGHT');
                                setLiveDetectionStatus('TURN HEAD RIGHT');
                            }
                        } else if (livenessState === 'TURN_RIGHT') {
                            setLiveDetectionStatus('TURN HEAD RIGHT');
                            if (yawRatio < 0.65) {
                                setLivenessState('VERIFIED');
                                setLiveDetectionStatus('LIVENESS VERIFIED');
                            }
                        }
                        setLastEAR(avgEAR);
                    }
                } catch (err) { 
                    console.error("Detection error:", err);
                    setDebugInfo('Error: ' + err.message.substring(0, 20));
                }
            }, 200); // Optimized for head turns
        }
        return () => clearInterval(interval);
    }, [modelsLoaded, detectedName, livenessState, lastEAR]);

    const handleSubmit = async () => {
        if (livenessState !== 'VERIFIED') {
            toast.error("Complete verification steps first");
            return;
        }
        setLoading(true);
        setStatus('Verifying Identity...');

        try {
            const imageSrc = webcamRef.current.getScreenshot();
            const img = new Image();
            img.src = imageSrc;
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 640;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 640, 640);

            const detection = await faceapi.detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
                .withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                setStatus('Face not detected clearly. Try again.');
                setStatusType('warning');
                setLoading(false);
                return;
            }

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
            const formData = new FormData();
            formData.append('image', blob, 'attendance.jpg');
            formData.append('studentId', localStorage.getItem('studentId'));
            formData.append('latitude', location?.latitude);
            formData.append('longitude', location?.longitude);
            formData.append('faceDescriptor', JSON.stringify(Array.from(detection.descriptor)));

            const res = await axios.post(`${API_BASE_URL}/attendance/mark`, formData, { 
                headers: { 'Authorization': `Bearer ${localStorage.getItem('studentToken')}` } 
            });

            setDetectedName(res.data.studentName);
            setStatus(`Success: Verified as ${res.data.studentName}`);
            setStatusType('success');
            setTimeout(() => navigate('/dashboard'), 4000);
        } catch (error) {
            setStatus('Failed: ' + (error.response?.data?.message || 'Error'));
            setStatusType('error');
        }
        setLoading(false);
    };

    return (
        <div style={{ 
            width: '100%', minHeight: 'calc(100dvh - 80px)', display: 'flex', flexDirection: 'column',
            padding: '24px', background: '#020617', position: 'relative', overflow: 'hidden' 
        }}>
            {/* Immersive Background Effects */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>

            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ position: 'relative', zIndex: 10, marginBottom: '24px', textAlign: 'center' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                        <ScanFace size={26} color="#60a5fa" />
                    </div>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: '900', margin: 0, color: 'white', letterSpacing: '-1px' }}>
                        Attendance
                    </h2>
                </div>
                <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500', maxWidth: '300px', margin: '0 auto' }}>
                    Hello, <span style={{ color: '#fff', fontWeight: '700' }}>{profile?.name?.split(' ')[0] || 'Student'}</span>. <br/>Center your face in the frame.
                </p>
            </motion.div>

            {/* Main Camera Frame */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 5 }}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '1/1',
                        borderRadius: '40px', overflow: 'hidden', background: '#000',
                        border: '2px solid rgba(255,255,255,0.05)',
                        boxShadow: '0 0 80px rgba(0,0,0,0.5), 0 0 20px rgba(37, 99, 235, 0.1)'
                    }}
                >
                    {modelsLoaded ? (
                        <>
                            <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg"
                                videoConstraints={{ facingMode: "user", aspectRatio: 1 }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                            />
                            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, transform: 'scaleX(-1)' }} />
                            
                            {/* Liveness Guidance Overlay */}
                            {!status && !loading && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    style={{ 
                                        position: 'absolute', bottom: '20px', left: '20px', right: '20px', 
                                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                                        borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)', zIndex: 100
                                    }}
                                >
                                    <div style={{ 
                                        width: '40px', height: '40px', borderRadius: '12px', 
                                        background: livenessState === 'VERIFIED' ? '#10b981' : '#3b82f6',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {livenessState === 'INITIAL' && <UserCheck size={20} color="white" />}
                                        {livenessState === 'TURN_LEFT' && <Activity size={20} color="white" />}
                                        {livenessState === 'TURN_RIGHT' && <Activity size={20} color="white" />}
                                        {livenessState === 'VERIFIED' && <ShieldCheck size={20} color="white" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: 'white', fontWeight: '800', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>
                                            {livenessState === 'INITIAL' && "Detecting..."}
                                            {livenessState === 'TURN_LEFT' && "Turn head left"}
                                            {livenessState === 'TURN_RIGHT' && "Turn head right"}
                                            {livenessState === 'VERIFIED' && "Liveness Verified"}
                                        </p>
                                        <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.7rem', margin: 0 }}>
                                            {debugInfo || (livenessState === 'VERIFIED' ? "Verification complete" : "Security check active")}
                                        </p>
                                    </div>
                                    {livenessState === 'VERIFIED' && <CheckCircle size={20} color="#10b981" />}
                                </motion.div>
                            )}
                        </>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
                            <RefreshCw size={48} color="#3b82f6" className="animate-spin" />
                        </div>
                    )}
                </motion.div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', position: 'relative', zIndex: 10 }}>
                    {[
                        { label: 'GPS', status: location ? 'LOCKED' : 'SEARCHING', active: !!location, icon: MapPin, color: '#22c55e' },
                        { label: 'FACE ID', status: modelsLoaded ? 'READY' : 'LOADING', active: modelsLoaded, icon: ScanFace, color: '#3b82f6' }
                    ].map((badge, i) => (
                        <div key={i} style={{ padding: '12px 20px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <badge.icon size={18} color={badge.active ? badge.color : '#fbbf24'} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{badge.label}</span>
                                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '800' }}>{badge.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ position: 'relative', zIndex: 10, marginTop: '24px', paddingBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <motion.button
                        whileHover={livenessState === 'VERIFIED' ? { scale: 1.02, translateY: -2 } : {}}
                        whileTap={livenessState === 'VERIFIED' ? { scale: 0.98 } : {}}
                        onClick={handleSubmit}
                        disabled={loading || livenessState !== 'VERIFIED'}
                        style={{
                            width: '100%',
                            maxWidth: '360px',
                            padding: '22px',
                            borderRadius: '24px',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            
                            // Liquid Glass Styling
                            background: livenessState === 'VERIFIED' 
                                ? 'rgba(255, 255, 255, 0.08)' 
                                : 'rgba(255, 255, 255, 0.02)',
                            backdropFilter: 'blur(24px) saturate(180%)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderTop: livenessState === 'VERIFIED'
                                ? '1px solid rgba(255, 255, 255, 0.3)'
                                : '1px solid rgba(255, 255, 255, 0.05)',
                            color: livenessState === 'VERIFIED' ? 'white' : 'rgba(255,255,255,0.2)',
                            boxShadow: livenessState === 'VERIFIED'
                                ? '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)'
                                : 'none',
                            cursor: livenessState === 'VERIFIED' ? 'pointer' : 'not-allowed',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            fontSize: '1.1rem'
                        }}
                    >
                        {/* Shimmer Effect */}
                        {livenessState === 'VERIFIED' && !loading && (
                            <motion.div 
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                                    transform: 'skewX(-20deg)', pointerEvents: 'none'
                                }}
                            />
                        )}

                        {loading ? (
                            <RefreshCw className="animate-spin" size={22} />
                        ) : livenessState === 'VERIFIED' ? (
                            <ShieldCheck size={22} />
                        ) : (
                            <Activity size={22} />
                        )}
                        
                        <span style={{ position: 'relative', zIndex: 2 }}>
                            {loading ? 'VERIFYING' : livenessState === 'VERIFIED' ? 'AUTHENTICATE' : 'LIVENESS REQUIRED'}
                        </span>

                        {/* Side Accents */}
                        {livenessState === 'VERIFIED' && (
                            <>
                                <div style={{ position: 'absolute', left: 0, top: '25%', height: '50%', width: '2px', background: '#3b82f6', borderRadius: '0 2px 2px 0', opacity: 0.8 }}></div>
                                <div style={{ position: 'absolute', right: 0, top: '25%', height: '50%', width: '2px', background: '#3b82f6', borderRadius: '2px 0 0 2px', opacity: 0.8 }}></div>
                            </>
                        )}
                    </motion.button>
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', marginTop: '24px', fontWeight: '600', letterSpacing: '1px' }}>
                    SECURE BIOMETRIC PROTOCOL V2.5
                </p>
            </div>

            {/* Immersive Full Screen Status Overlay */}
            <AnimatePresence>
                {((detectedName && statusType === 'success') || (status && (statusType === 'error' || statusType === 'warning'))) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', overflowY: 'auto' }}
                    >
                        <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: statusType === 'success' ? 'radial-gradient(circle at center, #022c22 0%, #020617 100%)' : 'radial-gradient(circle at center, #450a0a 0%, #020617 100%)' }} />
                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                            style={{ width: '140px', height: '140px', borderRadius: '40px', background: statusType === 'success' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', flexShrink: 0 }}
                        >
                            {statusType === 'success' ? <CheckCircle size={80} color="white" /> : <AlertCircle size={80} color="white" />}
                        </motion.div>
                        <h2 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '950', textAlign: 'center', textTransform: 'uppercase' }}>
                            {statusType === 'success' ? 'Verified' : 'Failed'}
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', textAlign: 'center', marginTop: '12px' }}>{status}</p>
                        
                        <div style={{ marginTop: '56px', background: 'rgba(255,255,255,0.03)', borderRadius: '32px', padding: '32px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Identity</span><span style={{ color: 'white', fontWeight: '800' }}>{detectedName || 'Student'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Status</span><span style={{ color: statusType === 'success' ? '#10b981' : '#ef4444' }}>{statusType === 'success' ? 'PRESENT' : 'ERROR'}</span></div>
                        </div>

                        <div style={{ marginTop: '40px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <button onClick={() => statusType === 'success' ? navigate('/dashboard') : window.location.reload()}
                                style={{ width: '100%', padding: '20px', borderRadius: '24px', background: 'white', color: '#020617', fontWeight: '900', border: 'none' }}
                            >
                                {statusType === 'success' ? 'RETURN TO DASHBOARD' : 'RETRY'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AttendanceCamera;
