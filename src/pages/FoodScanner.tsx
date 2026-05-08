import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Utensils, CheckCircle, XCircle, Camera, RefreshCw, ChevronLeft, ChevronRight, ShieldCheck, Calendar, Clock, ArrowRight, LayoutGrid, X, Lock, SwitchCamera, ChevronDown, Play, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../context/StudentContext';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const meals = ['breakfast', 'lunch', 'snacks', 'dinner'];

const FoodScanner: React.FC = () => {
    const { view: routeView } = useParams<{ view: string }>();
    const navigate = useNavigate();
    const studentContext = useStudent();
    
    // Safety check for context
    if (!studentContext) return null;
    const { profile, loading: profileLoading } = studentContext;
    
    // Sync view with route
    const view = routeView === 'menu' ? 'menu' : 'scan';
    
    const [template, setTemplate] = useState<any[]>([]);
    const [scanResult, setScanResult] = useState<any>(null);
    const [todayStatus, setTodayStatus] = useState<any[]>([]);
    const [timings, setTimings] = useState<any[]>([]);
    const [isCameraActive, setIsCameraActive] = useState(false); // Manual start by default
    const [cameras, setCameras] = useState<any[]>([]);
    const [selectedCamIndex, setSelectedCamIndex] = useState(0);
    const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
    
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const startTimeoutRef = useRef<any>(null);
    
    // Audio Refs
    const successAudio = useRef<HTMLAudioElement | null>(null);
    const errorAudio = useRef<HTMLAudioElement | null>(null);

    // Derived registration check
    const isRegistered = (profile as any)?.isRegistered || false;

    useEffect(() => {
        // Initialize Audio
        successAudio.current = new Audio('/sounds/success.ogg');
        errorAudio.current = new Audio('/sounds/error.ogg');
    }, []);

    useEffect(() => {
        if (isRegistered) {
            fetchStatus();
            fetchTemplate();
            fetchTimings();
        }
    }, [isRegistered]);

    // Detect Back Cameras
    useEffect(() => {
        if (view === 'scan' && isRegistered) {
            Html5Qrcode.getCameras().then(devices => {
                if (devices && devices.length > 0) {
                    const filtered = devices.filter(d => {
                        const label = d.label.toLowerCase();
                        const isBack = label.includes('back') || label.includes('rear') || label.includes('environment');
                        const isWide = label.includes('wide') || label.includes('ultra');
                        const isFront = label.includes('front') || label.includes('selfie');
                        
                        return isBack && !isWide && !isFront;
                    });

                    const finalCameras = filtered.length > 0 ? filtered : devices.filter(d => !d.label.toLowerCase().includes('front'));
                    setCameras(finalCameras);
                    setSelectedCamIndex(0);
                }
            }).catch(err => console.error("Error getting cameras", err));
        }
    }, [view, isRegistered]);

    // Force Stop Camera when switching to Menu tab
    useEffect(() => {
        if (view === 'menu') {
            setIsCameraActive(false);
            stopScanner();
        }
    }, [view]);

    // Sync camera state with lifecycle
    useEffect(() => {
        if (view === 'scan' && !scanResult && isCameraActive && isRegistered) {
            clearTimeout(startTimeoutRef.current);
            startTimeoutRef.current = setTimeout(startScanner, 300);
        } else {
            clearTimeout(startTimeoutRef.current);
            stopScanner();
        }
        return () => { 
            clearTimeout(startTimeoutRef.current);
            stopScanner(); 
        };
    }, [view, scanResult, isCameraActive, isRegistered, selectedCamIndex, cameras]);

    const startScanner = async () => {
        try {
            const container = document.getElementById('reader');
            if (!container) return;
            if (!scannerRef.current) scannerRef.current = new Html5Qrcode("reader");
            if (scannerRef.current.isScanning) await scannerRef.current.stop();

            const config = { fps: 10, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 };
            
            if (cameras.length > 0 && cameras[selectedCamIndex]) {
                await scannerRef.current.start(
                    cameras[selectedCamIndex].id,
                    config,
                    onScanSuccess,
                    () => {}
                );
            } else {
                await scannerRef.current.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    () => {}
                );
            }
        } catch (err: any) {
            console.error("Scanner error:", err);
            if (err.includes?.('transition')) {
                clearTimeout(startTimeoutRef.current);
                startTimeoutRef.current = setTimeout(startScanner, 500);
            }
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
            } catch (err) {}
        }
    };

    const fetchTemplate = async () => {
        try {
            const res = await api.get('/meal/template');
            if (res.data.success) setTemplate(res.data.data);
        } catch (error) {}
    };

    const fetchTimings = async () => {
        try {
            const res = await api.get('/meal/active-meal');
            if (res.data.success) setTimings(res.data.allTimings);
        } catch (error) {}
    };

    const fetchStatus = async () => {
        try {
            const res = await api.get('/meal/today-status');
            if (res.data.success) setTodayStatus(res.data.consumed);
        } catch (error) {}
    };

    const format12Hour = (timeStr: string) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
    };

    const onScanSuccess = async (decodedText: string) => {
        setIsCameraActive(false);
        try {
            const res = await api.post('/meal/scan', { qrToken: decodedText });
            if (res.data.success) {
                successAudio.current?.play().catch(e => console.log("Audio block:", e));
                setScanResult({ success: true, message: res.data.message });
                toast.success(res.data.message);
                fetchStatus();
            }
        } catch (error: any) {
            errorAudio.current?.play().catch(e => console.log("Audio block:", e));
            const msg = error.response?.data?.message || "Scan failed";
            setScanResult({ success: false, message: msg });
            toast.error(msg);
        }
    };

    const getFoodForDay = (day: string, meal: string) => {
        return template.find(t => t.dayOfWeek === day && t.mealType === meal)?.foodName || "Not set";
    };

    const isConsumed = (mealType: string) => todayStatus.some(c => c.mealType === mealType);

    const mealIcons: Record<string, any> = {
        breakfast: { icon: Clock, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
        lunch: { icon: Utensils, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
        snacks: { icon: Utensils, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
        dinner: { icon: Utensils, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' }
    };

    const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    if (profileLoading) return null;

    if (!isRegistered) {
        return (
            <div style={{ width: '100%', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Lock size={32} color="#ef4444" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '12px' }}>Access Locked</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px' }}>Only registered students with an active account can access the Meal Center. Please complete your profile registration first.</p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', width: 'auto', fontSize: '0.85rem' }}
                    >
                        RETURN TO DASHBOARD
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '24px 16px 120px 16px',
            fontFamily: "'Inter', sans-serif",
            color: 'white'
        }}>
            <style>{`
                #reader__dashboard_section_csr > span { display: none !important; }
                #reader__filescan_input { display: none !important; }
                #reader video { object-fit: cover !important; border-radius: 32px !important; }
                #reader { border: none !important; width: 100% !important; overflow: hidden !important; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 32px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                }
                .meal-pill {
                    padding: 10px 14px;
                    border-radius: 14px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.8);
                    transition: all 0.3s ease;
                }
                .today-highlight {
                    background: rgba(37, 99, 235, 0.1) !important;
                    border-left: 1px solid rgba(37, 99, 235, 0.1);
                    border-right: 1px solid rgba(37, 99, 235, 0.1);
                }
                .custom-select {
                    appearance: none;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 14px 20px;
                    color: white;
                    font-size: 0.85rem;
                    font-weight: 700;
                    width: 100%;
                    max-width: 300px;
                    cursor: pointer;
                    outline: none;
                    transition: all 0.3s ease;
                    text-align: center;
                }
                .custom-select:focus {
                    border-color: #2563eb;
                    background: rgba(37, 99, 235, 0.1);
                }
                @media (max-width: 900px) {
                    .desktop-only { display: none !important; }
                    .mobile-only { display: block !important; }
                }
                @media (min-width: 901px) {
                    .desktop-only { display: block !important; }
                    .mobile-only { display: none !important; }
                }
            `}</style>

            <div style={{ width: '100%', maxWidth: view === 'menu' ? '1280px' : '600px', transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-1px' }}>Hostel Hub</h1>
                        <p style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '4px' }}>Meal Center</p>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="glass-card" style={{ padding: '6px', display: 'flex', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
                    <button onClick={() => navigate('/food/scan')} style={{ flex: 1, padding: '12px 30px', borderRadius: '26px', border: 'none', fontWeight: '800', fontSize: '0.85rem', background: view === 'scan' ? '#2563eb' : 'transparent', color: view === 'scan' ? 'white' : 'rgba(255,255,255,0.4)', boxShadow: view === 'scan' ? '0 10px 20px rgba(37, 99, 235, 0.3)' : 'none', transition: 'all 0.3s ease' }}>SCAN MEAL</button>
                    <button onClick={() => navigate('/food/menu')} style={{ flex: 1, padding: '12px 30px', borderRadius: '26px', border: 'none', fontWeight: '800', fontSize: '0.85rem', background: view === 'menu' ? '#2563eb' : 'transparent', color: view === 'menu' ? 'white' : 'rgba(255,255,255,0.4)', boxShadow: view === 'menu' ? '0 10px 20px rgba(37, 99, 235, 0.3)' : 'none', transition: 'all 0.3s ease' }}>WEEKLY MENU</button>
                </div>

                {view === 'scan' ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="animate-in fade-in zoom-in duration-500">
                        <div className="glass-card" style={{ padding: '40px', position: 'relative' }}>
                            {scanResult ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ marginBottom: '24px' }}>{scanResult.success ? <CheckCircle size={90} color="#22c55e" strokeWidth={1.5} /> : <XCircle size={90} color="#ef4444" strokeWidth={1.5} />}</div>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '10px' }}>{scanResult.success ? 'Success!' : 'Scan Failed'}</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px', fontSize: '1rem', fontWeight: '500' }}>{scanResult.message}</p>
                                    <button onClick={() => { setScanResult(null); setIsCameraActive(true); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '16px', fontWeight: '800', fontSize: '0.9rem', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)' }}>Try Again</button>
                                </div>
                            ) : isCameraActive ? (
                                <>
                                    <div id="reader" style={{ width: '100%', borderRadius: '32px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', background: '#000' }}></div>
                                    
                                    {/* CAMERA DROPDOWN */}
                                    {cameras.length > 1 && (
                                        <div style={{ marginTop: '24px', textAlign: 'center', position: 'relative' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                                                <Info size={14} color="#2563eb" />
                                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Choose correct lens in dropdown</p>
                                            </div>
                                            <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: '300px' }}>
                                                <select className="custom-select" value={selectedCamIndex} onChange={(e) => setSelectedCamIndex(parseInt(e.target.value))}>
                                                    {cameras.map((cam, idx) => (
                                                        <option key={cam.id} value={idx} style={{ background: '#0f172a', color: 'white' }}>{idx === 0 ? 'Primary Camera' : `Lens ${idx + 1}`}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }} />
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                        <button onClick={() => setIsCameraActive(false)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '16px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)', width: 'auto', minWidth: '180px' }}>Stop Scanning</button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <div style={{ 
                                        width: '110px', height: '110px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '40px', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 35px' 
                                    }}>
                                        <Camera size={45} color="#2563eb" strokeWidth={1.5} />
                                    </div>
                                    <h3 style={{ fontSize: '1.6rem', fontWeight: '900', marginBottom: '15px' }}>Ready to Scan?</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginBottom: '35px', maxWidth: '280px', margin: '0 auto 35px', lineHeight: '1.6' }}>Click the button below to turn on the camera and verify your meal.</p>
                                    <button 
                                        onClick={() => setIsCameraActive(true)}
                                        style={{ 
                                            background: '#2563eb', color: 'white', border: 'none', padding: '14px 40px', 
                                            borderRadius: '16px', fontWeight: '800', width: 'auto', fontSize: '0.9rem',
                                            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            margin: '0 auto'
                                        }}
                                    >
                                        <Camera size={18} />
                                        Scan QR
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Activity List */}
                        <div style={{ marginTop: '45px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', padding: '0 10px' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', margin: 0 }}>Today's Activity</h3>
                                <p style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '800', margin: 0 }}>{new Date().toDateString()}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {meals.map((m, index) => {
                                    const consumed = isConsumed(m);
                                    const timing = timings.find(t => t.mealType === m);
                                    
                                    // Determine Status
                                    const now = new Date();
                                    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                    
                                    let statusText = "Pending";
                                    let statusColor = "rgba(255,255,255,0.3)";
                                    let statusBg = "rgba(255,255,255,0.05)";
                                    let isHighlighted = false;

                                    if (consumed) {
                                        statusText = "Consumed";
                                        statusColor = "#22c55e";
                                        statusBg = "rgba(34, 197, 94, 0.12)";
                                    } else if (timing) {
                                        if (currentTimeStr >= timing.startTime && currentTimeStr <= timing.endTime) {
                                            statusText = "Active Now";
                                            statusColor = "#3b82f6";
                                            statusBg = "rgba(59, 130, 246, 0.2)";
                                            isHighlighted = true;
                                        } else if (currentTimeStr > timing.endTime) {
                                            statusText = "Time Over";
                                            statusColor = "#ef4444";
                                            statusBg = "rgba(239, 68, 68, 0.12)";
                                        }
                                    }

                                    return (
                                        <div key={m} style={{ 
                                            padding: '20px 8px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '12px', 
                                            borderBottom: index !== meals.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                                            background: isHighlighted ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                            borderRadius: isHighlighted ? '20px' : '0'
                                        }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: consumed ? 'rgba(34, 197, 94, 0.15)' : (isHighlighted ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {consumed ? <CheckCircle size={20} color="#22c55e" /> : (isHighlighted ? <div className="animate-pulse"><Utensils size={20} color="#3b82f6" /></div> : <Clock size={20} color="rgba(255,255,255,0.3)" />)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', textTransform: 'capitalize', margin: 0, color: isHighlighted ? '#3b82f6' : 'white' }}>{m}</h4>
                                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: '2px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getFoodForDay(currentDayName, m)}</p>
                                                {timing && <p style={{ fontSize: '0.7rem', color: isHighlighted ? '#60a5fa' : 'rgba(255,255,255,0.3)', fontWeight: '700', marginTop: '2px', textTransform: 'uppercase' }}>{format12Hour(timing.startTime)} - {format12Hour(timing.endTime)}</p>}
                                            </div>
                                            <div style={{ 
                                                padding: '4px 10px', 
                                                borderRadius: '100px', 
                                                background: statusBg, 
                                                color: statusColor, 
                                                fontSize: '0.65rem', 
                                                fontWeight: '900', 
                                                textTransform: 'uppercase', 
                                                letterSpacing: '1px', 
                                                border: `1px solid ${statusColor}33`,
                                                flexShrink: 0,
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {statusText}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Weekly Menu Mobile View */}
                        <div className="mobile-only">
                            <div className="no-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '32px' }}>
                                {days.map(day => (
                                    <button key={day} onClick={() => setSelectedDay(day)} style={{ padding: '14px 28px', borderRadius: '18px', border: 'none', fontWeight: '800', fontSize: '0.85rem', background: selectedDay === day ? 'white' : 'rgba(255,255,255,0.05)', color: selectedDay === day ? '#0f172a' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', transition: 'all 0.3s ease' }}>{day === currentDayName ? 'TODAY' : day}</button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {meals.map((meal, index) => {
                                    const config = mealIcons[meal];
                                    return (
                                        <div key={meal} style={{ padding: '24px 10px', display: 'flex', alignItems: 'center', gap: '24px', borderBottom: index !== meals.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                                            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><config.icon size={26} color={config.color} /></div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '0.8rem', fontWeight: '900', color: config.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                                    {meal} {timings.find(t => t.mealType === meal) && `(${format12Hour(timings.find(t => t.mealType === meal).startTime)} - ${format12Hour(timings.find(t => t.mealType === meal).endTime)})`}
                                                </p>
                                                <h4 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'white' }}>{getFoodForDay(selectedDay, meal)}</h4>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Elite Desktop Weekly Table */}
                        <div className="desktop-only">
                            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <th style={{ width: '180px', padding: '30px', fontSize: '0.8rem', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '3px', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Timeline</th>
                                            {days.map(day => {
                                                const isToday = day === currentDayName;
                                                return (
                                                    <th key={day} className={isToday ? 'today-highlight' : ''} style={{ padding: '30px 10px', fontSize: '0.9rem', fontWeight: '900', color: isToday ? '#2563eb' : 'white', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: isToday ? '3px solid #2563eb' : '2px solid rgba(255,255,255,0.1)', textAlign: 'center', position: 'relative' }}>
                                                        {day.substring(0, 3)}
                                                        {isToday && <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#2563eb' }}>TODAY</div>}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {meals.map((meal, mIdx) => {
                                            const config = mealIcons[meal];
                                            return (
                                                <tr key={meal} style={{ borderBottom: mIdx !== meals.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                                    <td style={{ padding: '30px', background: 'rgba(255,255,255,0.02)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                            <div style={{ padding: '10px', background: config.bg, borderRadius: '12px' }}><config.icon size={20} color={config.color} /></div>
                                                            <div>
                                                                <span style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'capitalize', display: 'block' }}>{meal}</span>
                                                                {timings.find(t => t.mealType === meal) && (
                                                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase' }}>
                                                                        {format12Hour(timings.find(t => t.mealType === meal).startTime)} - {format12Hour(timings.find(t => t.mealType === meal).endTime)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {days.map(day => {
                                                        const isToday = day === currentDayName;
                                                        return (
                                                            <td key={day} className={isToday ? 'today-highlight' : ''} style={{ padding: '20px 10px', textAlign: 'center' }}>
                                                                <div className="meal-pill" style={{ background: isToday ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255,255,255,0.03)', border: isToday ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(255,255,255,0.05)', color: isToday ? 'white' : 'rgba(255,255,255,0.7)', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getFoodForDay(day, meal)}</div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default FoodScanner;
