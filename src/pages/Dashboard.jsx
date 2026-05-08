import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
    User, MapPin, Camera, LogOut, Activity, CheckCircle, Home, 
    Clock, Settings, ScanFace, PanelLeft, ArrowRight, FileText, 
    Users, Shield, AlertCircle, Megaphone, IndianRupee, ChevronRight, Utensils,
    Coffee, Soup, Sandwich, Pizza
} from 'lucide-react';

import axios from 'axios';
import toast from 'react-hot-toast';
import { useStudent } from '../context/StudentContext';

const NavItem = ({ icon: Icon, label, active, onClick, danger, isSidebarExpanded }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '16px', borderRadius: '12px', cursor: 'pointer',
            background: active ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
            color: danger ? 'var(--error)' : (active ? 'var(--primary)' : 'var(--text-muted)'),
            transition: 'all 0.3s ease',
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            marginBottom: '8px'
        }}
    >
        <Icon size={24} />
        {isSidebarExpanded && <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>}
    </div>
);

// Haversine Formula
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // in metres
    return d;
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { profile, loading: profileLoading } = useStudent();
    const [studentId, setStudentId] = useState('');
    const location = useLocation();

    const studentName = profile?.name || '';
    const isRegistered = profile?.isRegistered || false;
    const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);

    // Meal State
    const [currentMeal, setCurrentMeal] = useState({ type: 'Meal', icon: Utensils, greeting: 'Hungry?' });

    useEffect(() => {
        const updateMealContext = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 11) {
                setCurrentMeal({ type: 'Breakfast', icon: Coffee, greeting: 'Ready for Breakfast?' });
            } else if (hour >= 11 && hour < 16) {
                setCurrentMeal({ type: 'Lunch', icon: Soup, greeting: 'Time for Lunch!' });
            } else if (hour >= 16 && hour < 19) {
                setCurrentMeal({ type: 'Snacks', icon: Sandwich, greeting: 'Evening Snacks?' });
            } else {
                setCurrentMeal({ type: 'Dinner', icon: Pizza, greeting: 'Dinner is served!' });
            }
        };
        updateMealContext();
        const interval = setInterval(updateMealContext, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (location.state?.loginSuccess) {
            toast.success("Login Successful!", {
                duration: 3000,
                id: 'login-success'
            });
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    useEffect(() => {
        const token = localStorage.getItem('studentToken');
        const sid = localStorage.getItem('studentId');
        if (!token) { navigate('/'); return; }
        setStudentId(sid);
    }, [navigate]);

    const context = useOutletContext() || { isDesktop: window.innerWidth >= 768 };
    const { isDesktop } = context;

    const [isTimeValid, setIsTimeValid] = useState(true);
    const [timeMsg, setTimeMsg] = useState("");
    const [isLocationValid, setIsLocationValid] = useState(false);
    const [locationMsg, setLocationMsg] = useState("Detecting location...");
    const [targetGeo, setTargetGeo] = useState(null); 
    const [currentDist, setCurrentDist] = useState(null);
    const [gpsAccuracy, setGpsAccuracy] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState(() => {
        return localStorage.getItem('studentProfilePicCache') || null;
    });

    useEffect(() => {
        const validateTimeAndFetchGeo = async () => {
            try {
                const token = localStorage.getItem('studentToken');
                const sid = localStorage.getItem('studentId');
                if (!sid || !token || !profile || !profile.hostelId) return;

                const hostelId = profile.hostelId;
                
                let hostelsData = [];
                const cachedSchemas = localStorage.getItem('hostelsSchemaCache');
                const schemaCacheTime = localStorage.getItem('hostelsSchemaCacheTime');
                
                if (cachedSchemas && schemaCacheTime && (Date.now() - parseInt(schemaCacheTime) < 86400000)) {
                    hostelsData = JSON.parse(cachedSchemas);
                } else {
                    const schemasRes = await axios.get(`${API_BASE_URL}/schemas/getHostels`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    hostelsData = schemasRes.data.hostels;
                    localStorage.setItem('hostelsSchemaCache', JSON.stringify(hostelsData));
                    localStorage.setItem('hostelsSchemaCacheTime', Date.now().toString());
                }

                const myHostel = hostelsData.find(h => h.code === hostelId);

                if (myHostel) {
                    const start = myHostel.attendanceStartTime || "00:00";
                    const end = myHostel.attendanceEndTime || "23:59";
                    const now = new Date();

                    const updateDateWithTime = (timeStr) => {
                        if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return new Date();
                        const [h, m] = timeStr.split(':');
                        const d = new Date();
                        d.setHours(parseInt(h) || 0, parseInt(m) || 0, 0, 0);
                        return d;
                    };

                    const startTime = updateDateWithTime(start);
                    const endTime = updateDateWithTime(end);

                    if (now >= startTime && now <= endTime) {
                        setIsTimeValid(true);
                        setTimeMsg("");
                    } else {
                        setIsTimeValid(false);
                        const formatT = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                        setTimeMsg(`Attendance Time: ${formatT(startTime)} - ${formatT(endTime)}`);
                    }

                    if (myHostel.geoCoordinates && myHostel.geoCoordinates.latitude) {
                        setTargetGeo(myHostel.geoCoordinates);
                    } else {
                        setIsLocationValid(true);
                        setLocationMsg("GPS Ignored");
                        setTargetGeo(null);
                    }

                    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                    const cachedMarked = localStorage.getItem('last_attendance_date');
                    
                    if (cachedMarked === todayStr) {
                        setIsAlreadyMarked(true);
                    } else {
                        try {
                            const historyRes = await axios.get(`${API_BASE_URL}/attendance/history/${sid}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const marked = historyRes.data && Array.isArray(historyRes.data) ? historyRes.data.some(r => r.date === todayStr) : false;
                            setIsAlreadyMarked(marked);
                            if (marked) localStorage.setItem('last_attendance_date', todayStr);
                        } catch (err) {
                            console.warn("Failed to fetch attendance history", err.message);
                        }
                    }
                } else {
                    setIsTimeValid(true);
                    setIsLocationValid(true);
                    setLocationMsg("Hostel Details Not Found");
                }
            } catch (error) {
                console.error("Validation failed", error.message);
            }
        };

        if (profile) validateTimeAndFetchGeo();
    }, [profile]);

    useEffect(() => {
        const fetchProfileImage = async () => {
            const sid = localStorage.getItem('studentId');
            if (!sid) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/upload/getImage/${sid}`);
                if (res.data && res.data.imageExist) {
                    setProfileImageUrl(res.data.imagePath);
                    localStorage.setItem('studentProfilePicCache', res.data.imagePath);
                } else {
                    setProfileImageUrl(null);
                    localStorage.removeItem('studentProfilePicCache');
                }
            } catch (err) {
                console.error("Failed to fetch profile image", err.message);
            }
        };
        fetchProfileImage();
    }, []);

    useEffect(() => {
        if (!targetGeo) return;
        let watchId = null;
        const options = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 };
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const dist = getDistanceFromLatLonInMeters(position.coords.latitude, position.coords.longitude, targetGeo.latitude, targetGeo.longitude);
                setCurrentDist(Math.floor(dist));
                setIsLocationValid(dist <= targetGeo.radius);
                setGpsAccuracy(position.coords.accuracy);
                setLocationMsg(""); 
            },
            (error) => {
                setIsLocationValid(false);
                let msg = "Location error";
                if (error.code === 1) msg = "Access Denied (Check Permission)";
                else if (error.code === 2) msg = "Pos Unavailable (Check Settings)";
                else if (error.code === 3) msg = "Location Timeout";
                setLocationMsg(msg);
            },
            options
        );
        return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    }, [targetGeo]);

    const [marquee, setMarquee] = useState({ text: '', isEnabled: false });

    useEffect(() => {
        const fetchMarquee = async () => {
            try {
                const cachedMarquee = sessionStorage.getItem('marqueeCache');
                if (cachedMarquee) setMarquee(JSON.parse(cachedMarquee));
                const res = await axios.get(`${API_BASE_URL}/marquee`);
                if (res.data) {
                    setMarquee(res.data);
                    sessionStorage.setItem('marqueeCache', JSON.stringify(res.data));
                }
            } catch (error) {
                console.error("Failed to fetch marquee", error.message);
            }
        };
        fetchMarquee();
    }, []);

    return (
        <div style={{
            flex: 1, overflowY: 'auto', width: '100%', maxWidth: '1200px',
            margin: '0 auto', padding: '16px 20px', fontFamily: "'Poppins', sans-serif"
        }}>
            {/* Notification Bar */}
            {marquee.isEnabled && marquee.text && (
                <div style={{
                    width: '100%', height: '44px', color: '#C4B5FD', padding: '0 16px',
                    fontWeight: '500', fontSize: '13px', overflow: 'hidden', marginBottom: '24px',
                    display: 'flex', alignItems: 'center', background: '#0B1020',
                    borderTop: '1px solid #1C2236', borderBottom: '1px solid #1C2236',
                    borderRadius: '8px', userSelect: 'none', gap: '12px'
                }}>
                    <Megaphone size={18} color="#3b82f6" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                        <div className="marquee-content" style={{ animationDuration: '10s' }}>
                            <span>{marquee.text} &nbsp; • &nbsp; </span>
                            <span>{marquee.text} &nbsp; • &nbsp; </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '24px', padding: '0 4px', gap: '16px' }}>
                <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: profileImageUrl ? 'transparent' : '#2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: '600', color: '#FFFFFF', overflow: 'hidden',
                    border: profileImageUrl ? '1.5px solid rgba(255,255,255,0.1)' : 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    {profileImageUrl ? <img src={profileImageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (studentName ? studentName.charAt(0).toUpperCase() : 'S')}
                </div>
                <div>
                    <p style={{ color: '#FFFFFF', fontSize: '14px', marginBottom: '2px', fontWeight: '500', opacity: 0.9 }}>Welcome back,</p>
                    <h1 style={{ fontSize: '28px', margin: 0, fontWeight: '700', color: '#FFFFFF', letterSpacing: '0.5px' }}>{studentName ? studentName.split(' ')[0].toUpperCase() : 'STUDENT'}</h1>
                </div>
            </div>

            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                
                {/* COMPACT MEAL HUB CARD */}
                <div 
                    onClick={() => navigate('/food')}
                    style={{
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url("/foodbanner.webp")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '24px', padding: '16px 20px', marginBottom: '20px', cursor: 'pointer',
                        position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
                        minHeight: '100px'
                    }}
                >
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <currentMeal.icon size={16} color="#ff85c0" />
                            <span style={{ fontSize: '11px', fontWeight: '900', color: '#ff85c0', letterSpacing: '2px', textTransform: 'uppercase' }}>{currentMeal.type} Active</span>
                        </div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#FFFFFF', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{currentMeal.greeting}</h2>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', marginTop: '2px', fontWeight: '600' }}>Tap to scan QR</p>
                    </div>

                    <div className="pulse-btn" style={{
                        width: '52px', height: '52px', borderRadius: '50%', background: '#F472B6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 15px rgba(244, 114, 182, 0.4)', position: 'relative', zIndex: 2
                    }}>
                        <Utensils size={24} color="white" />
                        <div className="pulse-ring"></div>
                    </div>

                    {/* Decorative Background Icon */}
                    <Utensils size={120} style={{ position: 'absolute', right: '-20px', top: '-20px', color: 'white', opacity: 0.03, transform: 'rotate(-15deg)' }} />
                </div>

                {/* Check-in Card */}
                <div onClick={() => {
                    if (isAlreadyMarked) toast.success("Attendance already marked!");
                    else if (!isTimeValid) toast.error(timeMsg);
                    else if (!isLocationValid) toast.error(locationMsg);
                    else navigate('/attendance');
                }} style={{ cursor: 'pointer' }}>
                    <div className="checkin-card" style={{
                        backgroundColor: isAlreadyMarked ? '#064e3b' : '#1e293b',
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("/attendance_banner.webp")`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        borderRadius: '28px', padding: '24px', display: 'flex', flexDirection: 'column',
                        minHeight: '180px', marginBottom: '24px', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 20px 50px -12px rgba(0,0,0,0.5)', border: isAlreadyMarked ? '2px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: isLocationValid ? 'rgba(34, 197, 94, 0.4)' : 'rgba(153, 27, 27, 0.6)', width: 'fit-content', padding: '6px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <MapPin size={14} color="white" />
                                <span style={{ fontSize: '12px', fontWeight: '600', color: "#FFFFFF" }}>{targetGeo ? (isLocationValid ? "In Range" : "Out of Range") : "GPS Ignored"}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                                <div>
                                    <h2 style={{ color: '#FFFFFF', margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>{isAlreadyMarked ? "Done" : "Check-in"}</h2>
                                    <p style={{ color: '#FFFFFF', margin: 0, fontSize: '1rem', fontWeight: '600', opacity: 0.95 }}>{isAlreadyMarked ? "Attendance Marked Successfully" : (!isTimeValid ? "Check-in closed" : "Take a photo to mark attendance")}</p>
                                </div>
                                <div style={{ background: isAlreadyMarked ? '#10B981' : '#FFFFFF', borderRadius: '18px', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}>
                                    {isAlreadyMarked ? <CheckCircle size={32} color="white" /> : <ScanFace size={28} color="#1e293b" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Grid (Food Hub Removed) */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ color: '#FFFFFF', margin: '0 0 20px 4px', fontSize: '16px', fontWeight: '600' }}>Quick Actions</h3>
                    <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        {[
                            { to: '/roomies', icon: Users, label: 'Roomies', color: '#22D3EE' },
                            { to: '/leave', icon: FileText, label: 'Apply Leave', color: '#3b82f6' },
                            { to: '/history', icon: Clock, label: 'History', color: '#FACC15' },
                            { to: '/incharge', icon: Shield, label: 'Incharges', color: '#22C55E' },
                            { to: '/complaint', icon: AlertCircle, label: 'Complaint Box', color: '#EF4444' },
                            { to: '/announcement', icon: Megaphone, label: 'Announcements', color: '#F97316' },
                            { to: '/fees-cost', icon: IndianRupee, label: 'Fees Cost', color: '#10B981' },
                            { to: '/last-request', icon: Activity, label: 'Last Request', color: '#06B6D4' }
                        ].map((action, index) => (
                            <Link key={index} to={action.to} style={{ textDecoration: 'none' }}>
                                <div className="action-card" style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: '14px 4px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)',
                                    backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                    minHeight: '110px', textAlign: 'center', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                                }}>
                                    <action.icon size={26} color={action.color} style={{ filter: `drop-shadow(0 0 8px ${action.color}66)`, marginBottom: '10px' }} />
                                    <span style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '11px', opacity: 0.9 }}>{action.label}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* STABLE HELP CARD */}
                <div style={{
                    background: '#0B1220', border: '1px solid #1E293B', borderRadius: '24px', padding: '24px',
                    position: 'relative', overflow: 'hidden', display: 'flex', minHeight: '160px', marginTop: '24px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: '80px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={20} color="#3b82f6" />
                            </div>
                            <h3 style={{ color: '#FFFFFF', margin: 0, fontSize: '18px', fontWeight: '700' }}>Need Help?</h3>
                        </div>
                        <p style={{ color: '#FFFFFF', margin: '0 0 20px 0', fontSize: '14px', fontWeight: '500', opacity: 0.9 }}>We're here to assist you</p>
                        <button onClick={() => navigate('/incharge')}
                            style={{ 
                                background: '#111827', border: '1px solid rgba(255,255,255,0.05)',
                                color: '#FFFFFF', height: '46px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                width: 'fit-content', padding: '0 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            Contact Warden <ChevronRight size={18} />
                        </button>
                    </div>
                    <div style={{ position: 'absolute', right: '-15px', bottom: '-40px', width: '210px', height: '210px', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        <img src="/help_char.webp" alt="Help Character" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 25px rgba(59, 130, 246, 0.2))' }} />
                    </div>
                </div>
            </div>

            <style>{`
                .marquee-content { display: flex; white-space: nowrap; animation: marquee 10s linear infinite; }
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .action-card:hover { background: #1e293b !important; transform: translateY(-2px); }
                .pulse-ring {
                    position: absolute; width: 100%; height: 100%; border-radius: 50%;
                    border: 4px solid #F472B6; animation: pulse 2s infinite;
                }
                @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
                @media (max-width: 640px) {
                    .quick-actions-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 6px !important; }
                    .action-card { min-height: 90px !important; }
                    .action-card span { font-size: 8.5px !important; }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
