import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// face-api.js is now dynamically imported
import { MapPin, ScanFace, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';
import { useStudent } from '../context/StudentContext';

const AttendanceCamera = () => {
    const { profile } = useStudent();
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
    const [liveDetectionStatus, setLiveDetectionStatus] = useState('POSITION FACE IN FRAME');
    const [isFaceDetected, setIsFaceDetected] = useState(false);

    const format12Hour = (timeStr) => {
        if (!timeStr) return '--:--';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
    };

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

    // 2.5 Time & Location Validation (Route Protection)
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
                                }, (err) => {
                                    console.error("Geo check error", err);
                                    // Optionally strict block if location unavailable
                                    // toast.error("Location required for attendance.");
                                    // navigate('/dashboard');
                                }, { enableHighAccuracy: true });
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

    // 3. Detection Loop (Refactored for safety and lifecycle)
    useEffect(() => {
        let interval;
        if (modelsLoaded && faceApi && !detectedName) {
            interval = setInterval(async () => {
                // Check if all necessary refs are still active before starting work
                if (!webcamRef.current?.video || !canvasRef.current || webcamRef.current.video.readyState !== 4) return;

                try {
                    const video = webcamRef.current.video;
                    const displaySize = { width: video.videoWidth, height: video.videoHeight };
                    
                    // First check
                    if (!canvasRef.current) return;
                    faceApi.matchDimensions(canvasRef.current, displaySize);

                    const detections = await faceApi.detectAllFaces(video, new faceApi.SsdMobilenetv1Options({ minConfidence: 0.5 }));
                    
                    if (detections.length === 0) {
                        setLiveDetectionStatus('FACE NOT DETECTED');
                        setIsFaceDetected(false);
                    } else if (detections.length > 1) {
                        setLiveDetectionStatus('MULTIPLE FACES DETECTED');
                        setIsFaceDetected(false);
                    } else {
                        setLiveDetectionStatus('FACE DETECTED - READY');
                        setIsFaceDetected(true);
                    }
                    
                    // Safety check after await: Ref might have become null during the detection
                    if (!canvasRef.current) return;

                    const canvas = canvasRef.current;
                    if (!canvas) return; // Defensive check for getContext
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        if (detections.length > 0) {
                            const resizedDetections = faceApi.resizeResults(detections, displaySize);
                            
                            // Draw futuristic corner brackets
                            resizedDetections.forEach(det => {
                                const { x, y, width, height } = det.box;
                                ctx.strokeStyle = detections.length === 1 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)';
                                ctx.lineWidth = 4;
                                
                                const length = 25; // Corner length
                                ctx.beginPath();
                                // Top left
                                ctx.moveTo(x, y + length); ctx.lineTo(x, y); ctx.lineTo(x + length, y);
                                // Top right
                                ctx.moveTo(x + width - length, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + length);
                                // Bottom left
                                ctx.moveTo(x, y + height - length); ctx.lineTo(x, y + height); ctx.lineTo(x + length, y + height);
                                // Bottom right
                                ctx.moveTo(x + width - length, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - length);
                                ctx.stroke();
                            });
                        }
                    }
                } catch (err) {
                    console.error("Detection loop error:", err);
                }
            }, 500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [modelsLoaded, faceApi, detectedName]);

    // This is now just a placeholder as the logic is in useEffect
    const handleVideoOnPlay = () => {};

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

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

            const token = localStorage.getItem('studentToken');
            const res = await axios.post(`${API_BASE_URL}/attendance/mark`, formData, { 
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                } 
            });

            const studentName = res.data.studentName || "Student";
            const attendanceStatus = res.data.data?.status; // Present or Absent

            setDetectedName(studentName);

            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            localStorage.setItem('last_attendance_date', todayStr);

            if (attendanceStatus === 'Absent') {
                setStatus(`Marked Absent: Outside Location`);
                setStatusType('warning');
            } else {
                setStatus(`Verified: ${studentName}`);
                setStatusType('success');
            }

            setTimeout(() => navigate('/dashboard'), 4000);
        } catch (error) {
            // Simplified error logging to hide internal server URLs
            const msg = error.response?.data?.message || "Verification Failed";

            if (msg.includes("already marked")) {
                toast.error("Today already taken");
                setStatus("Already marked for today");
                setStatusType('warning');
            } else {
                setStatus(`Failed: ${msg}`);
                setStatusType('error');
            }
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
            <div style={{ position: 'absolute', top: '20%', right: '5%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(34, 197, 94, 0.05) 0%, transparent 70%)', filter: 'blur(60px)' }}></div>

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
                    Hello, <span style={{ color: '#fff', fontWeight: '700' }}>{profile?.name?.split(' ')[0] || localStorage.getItem('studentName')?.split(' ')[0] || 'Student'}</span>. <br/>Center your face in the frame.
                </p>
            </motion.div>

            {/* Main Camera Frame */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 5 }}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '400px',
                        aspectRatio: '1/1',
                        borderRadius: '40px',
                        overflow: 'hidden',
                        background: '#000',
                        border: '2px solid rgba(255,255,255,0.05)',
                        boxShadow: '0 0 80px rgba(0,0,0,0.5), 0 0 20px rgba(37, 99, 235, 0.1)'
                    }}
                >
                    {modelsLoaded ? (
                        <>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    facingMode: "user",
                                    aspectRatio: 1,
                                    width: { ideal: 1080 },
                                    height: { ideal: 1080 }
                                }}
                                style={{
                                    width: '100%', height: '100%', objectFit: 'cover',
                                    transform: 'scaleX(-1)'
                                }}
                                onUserMedia={handleVideoOnPlay}
                            />
                            <canvas
                                ref={canvasRef}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, transform: 'scaleX(-1)' }}
                            />



                            {/* Corner Accents */}
                            {[
                                { top: 30, left: 30, borderLeft: '4px solid #3b82f6', borderTop: '4px solid #3b82f6' },
                                { top: 30, right: 30, borderRight: '4px solid #3b82f6', borderTop: '4px solid #3b82f6' },
                                { bottom: 30, left: 30, borderLeft: '4px solid #3b82f6', borderBottom: '4px solid #3b82f6' },
                                { bottom: 30, right: 30, borderRight: '4px solid #3b82f6', borderBottom: '4px solid #3b82f6' }
                            ].map((style, i) => (
                                <div key={i} style={{ position: 'absolute', width: '40px', height: '40px', zIndex: 4, ...style, borderRadius: '8px', opacity: 0.6 }} />
                            ))}
                        </>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
                            <motion.div 
                                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <ScanFace size={80} color="#3b82f6" />
                            </motion.div>
                            <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: '24px', fontSize: '1rem', fontWeight: '600', letterSpacing: '1px' }}>INITIALIZING PORTAL</p>
                        </div>
                    )}

                    {/* Verifying Overlay */}
                    {loading && (
                        <div style={{ 
                            position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.8)', 
                            backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', 
                            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' 
                        }}>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                style={{ width: '64px', height: '64px', border: '4px solid rgba(37, 99, 235, 0.1)', borderTopColor: '#3b82f6', borderRadius: '50%' }}
                            />
                            <span style={{ color: 'white', fontWeight: '800', fontSize: '1.2rem', letterSpacing: '2px' }}>ANALYZING...</span>
                        </div>
                    )}
                </motion.div>

                {/* Full Screen Status Overlay (Success/Error/Warning) */}
                {((detectedName && statusType === 'success') || (status && (statusType === 'error' || statusType === 'warning'))) && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1000,
                            background: 'rgba(2, 6, 23, 0.7)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px'
                        }}
                    >
                        <motion.div 
                            initial={{ scale: 0.8, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            style={{
                                width: '100%',
                                maxWidth: '340px',
                                background: statusType === 'success' 
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : statusType === 'error'
                                        ? 'rgba(239, 68, 68, 0.2)'
                                        : 'rgba(245, 158, 11, 0.2)',
                                borderRadius: '32px',
                                padding: '48px 32px',
                                border: `1px solid ${statusType === 'success' ? 'rgba(16, 185, 129, 0.3)' : statusType === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '24px',
                                boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 40px ${statusType === 'success' ? 'rgba(16, 185, 129, 0.1)' : statusType === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'}`,
                                textAlign: 'center'
                            }}
                        >
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                                style={{ 
                                    width: '100px', 
                                    height: '100px', 
                                    background: statusType === 'success' ? '#10b981' : statusType === 'error' ? '#ef4444' : '#f59e0b', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    boxShadow: `0 0 50px ${statusType === 'success' ? 'rgba(16, 185, 129, 0.4)' : statusType === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                                }}
                            >
                                {statusType === 'success' ? <CheckCircle size={56} color="white" /> : <AlertCircle size={56} color="white" />}
                            </motion.div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <h3 style={{ 
                                    color: 'white', 
                                    fontWeight: '900', 
                                    fontSize: '1.75rem', 
                                    margin: 0,
                                    letterSpacing: '-0.5px',
                                    background: 'none',
                                    WebkitTextFillColor: 'white'
                                }}>
                                    {statusType === 'success' ? (detectedName || 'Student').toUpperCase() : 'ALERT'}
                                </h3>
                                <p style={{ 
                                    color: statusType === 'success' ? '#6ee7b7' : statusType === 'error' ? '#fca5a5' : '#fcd34d', 
                                    fontWeight: '700', 
                                    fontSize: '1.1rem', 
                                    margin: 0,
                                    letterSpacing: '1px' 
                                }}>
                                    {statusType === 'success' ? 'VERIFIED SUCCESSFULLY' : status.toUpperCase()}
                                </p>
                            </div>

                            {/* Auto-closing progress bar */}
                            <div style={{ 
                                width: '100%', 
                                height: '4px', 
                                background: 'rgba(255,255,255,0.05)', 
                                borderRadius: '2px', 
                                marginTop: '12px',
                                overflow: 'hidden'
                            }}>
                                <motion.div 
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: 4, ease: "linear" }}
                                    onAnimationComplete={() => {
                                        if (statusType !== 'success') {
                                            setStatus('');
                                        }
                                    }}
                                    style={{ 
                                        height: '100%', 
                                        background: statusType === 'success' ? '#10b981' : statusType === 'error' ? '#ef4444' : '#f59e0b',
                                    }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                <div style={{ 
                    display: 'flex', gap: '12px', marginTop: '-24px', position: 'relative', zIndex: 10
                }}>
                    {[
                        { label: 'GPS', status: location ? 'LOCKED' : 'SEARCHING', active: !!location, icon: MapPin, color: '#22c55e', inactiveColor: '#fbbf24' },
                        { label: 'FACE ID', status: modelsLoaded ? 'READY' : 'LOADING', active: modelsLoaded, icon: ScanFace, color: '#3b82f6', inactiveColor: '#fbbf24' }
                    ].map((badge, i) => (
                        <motion.div 
                            key={i}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 + (i * 0.1) }}
                            style={{
                                padding: '12px 20px', 
                                background: 'rgba(15, 23, 42, 0.7)',
                                backdropFilter: 'blur(16px)',
                                borderRadius: '20px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div style={{ 
                                width: '32px', height: '32px', 
                                background: badge.active ? `${badge.color}15` : 'rgba(251, 191, 36, 0.1)', 
                                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                            }}>
                                <badge.icon size={18} color={badge.active ? badge.color : '#fbbf24'} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: '0.5px' }}>{badge.label}</span>
                                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '800' }}>{badge.status}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Real-time instruction */}
                {modelsLoaded && !detectedName && !loading && (
                    <motion.div
                        animate={{
                            opacity: [0.7, 1, 0.7],
                            scale: isFaceDetected ? [1, 1.02, 1] : 1
                        }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{
                            marginTop: '20px',
                            fontWeight: '800',
                            fontSize: '0.95rem',
                            letterSpacing: '1px',
                            color: isFaceDetected ? '#10b981' : '#fca5a5',
                            textAlign: 'center',
                            zIndex: 10,
                            position: 'relative'
                        }}
                    >
                        {liveDetectionStatus}
                    </motion.div>
                )}
            </div>

            {/* Footer Actions */}
            <div style={{ position: 'relative', zIndex: 10, marginTop: '24px', paddingBottom: '32px' }}>
                {status && !detectedName && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            padding: '16px', borderRadius: '20px', textAlign: 'center', marginBottom: '24px',
                            background: statusType === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                                statusType === 'warning' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                            border: `1px solid ${statusType === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                                statusType === 'warning' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(37, 99, 235, 0.2)'
                                }`,
                            color: statusType === 'warning' ? '#facc15' : statusType === 'error' ? '#ef4444' : '#a5b4fc',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            fontSize: '0.95rem', fontWeight: '600'
                        }}
                    >
                        {statusType === 'error' ? <AlertCircle size={20} /> : <Activity size={20} />}
                        <span>{status}</span>
                    </motion.div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    {/* Futuristic Pulse Glow Background */}
                    {!loading && location && modelsLoaded && !detectedName && (
                        <motion.div 
                            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            style={{
                                position: 'absolute', inset: -8,
                                background: 'radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, transparent 70%)',
                                borderRadius: '24px', filter: 'blur(12px)', zIndex: 0
                            }}
                        />
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 12, mass: 0.8 }}
                        onClick={markAttendance}
                        disabled={loading || !location || !modelsLoaded || !!detectedName || !isFaceDetected}
                        style={{ 
                            position: 'relative',
                            width: '100%', 
                            maxWidth: '300px',
                            padding: '16px 28px', 
                            fontSize: '1rem', 
                            borderRadius: '20px', 
                            fontWeight: '900', 
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            zIndex: 1,
                            overflow: 'hidden',
                            cursor: (loading || !location || !modelsLoaded || !!detectedName || !isFaceDetected) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            
                            // Premium Dark Liquid Glass Styling
                            background: (loading || !location || !modelsLoaded || !!detectedName || !isFaceDetected) 
                                ? 'rgba(255,255,255,0.02)' 
                                : 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(24px) saturate(180%)',
                            border: (loading || !location || !modelsLoaded || !!detectedName || !isFaceDetected)
                                ? '1px solid rgba(255,255,255,0.03)'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                            borderTop: (loading || !location || !modelsLoaded || !!detectedName || !isFaceDetected)
                                ? '1px solid rgba(255,255,255,0.03)'
                                : '1px solid rgba(255, 255, 255, 0.3)', // Sharp rim light on top edge
                            color: (loading || !location || !modelsLoaded || !!detectedName || !isFaceDetected) ? 'rgba(255,255,255,0.2)' : 'white',
                            boxShadow: (loading || !location || !modelsLoaded || !!detectedName || !isFaceDetected)
                                ? 'none'
                                : '0 20px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Internal Shimmer Effect */}
                        {!loading && !detectedName && location && modelsLoaded && isFaceDetected && (
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
                            <Activity size={20} className="animate-pulse" />
                        ) : detectedName ? (
                            <CheckCircle size={20} />
                        ) : null}
                        
                        <span style={{ position: 'relative', zIndex: 2 }}>
                            {loading ? 'INITIALIZING' : detectedName ? 'MARKED' : 'AUTHENTICATE'}
                        </span>

                        {/* Side Accents */}
                        <div style={{ position: 'absolute', left: 0, top: '25%', height: '50%', width: '2px', background: '#3b82f6', borderRadius: '0 2px 2px 0', opacity: 0.8 }}></div>
                        <div style={{ position: 'absolute', right: 0, top: '25%', height: '50%', width: '2px', background: '#3b82f6', borderRadius: '2px 0 0 2px', opacity: 0.8 }}></div>
                    </motion.button>
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', marginTop: '24px', fontWeight: '600', letterSpacing: '1px' }}>
                    SECURE BIOMETRIC PROTOCOL V2.5
                </p>
            </div>
        </div>
    );
};

export default AttendanceCamera;
