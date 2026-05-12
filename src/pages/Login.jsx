import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { ArrowRight, Lock, User, Eye, EyeOff, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import './Login.css';
import { saveStudentSession } from '../services/studentStorage';
import { useStudent } from '../context/StudentContext';

const Login = () => {
    const [rollNo, setRollNo] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { loadProfile } = useStudent();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [marquee, setMarquee] = useState({ text: '', isEnabled: false });

    useEffect(() => {
        const token = localStorage.getItem('studentToken');
        if (token) { navigate('/dashboard'); }
    }, [navigate]);

    useEffect(() => {
        const fetchMarquee = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/marquee`);
                if (res.data) { setMarquee(res.data); }
            } catch (error) { console.error("Failed to fetch marquee", error); }
        };
        fetchMarquee();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Client-side sanitization to prevent common SQL injection attempts
        const sanitizeInput = (str) => {
            if (typeof str !== 'string') return '';
            // Trim whitespace and remove common SQL injection characters
            return str.trim().replace(/['";\-/*]/g, '');
        };

        const cleanRollNo = sanitizeInput(rollNo);
        const cleanPassword = password.trim(); // We only trim password, as some characters might be valid in a hash/complex password but we avoid special SQL chars in rollNo

        if (!cleanRollNo || !cleanPassword) {
            toast.error("Please fill in all fields correctly");
            setLoading(false);
            return;
        }

        // Basic pattern check for Roll Number (Assuming it shouldn't have special chars)
        if (/[^A-Z0-9]/.test(cleanRollNo)) {
            toast.error("Invalid Roll Number format");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/student-auth/login`, { 
                rollNo: cleanRollNo, 
                password: cleanPassword 
            });
            if (response.data.success && response.data.token) {
                // 1. Save session details first
                saveStudentSession(response.data.token, cleanRollNo);
                
                // 2. Trigger profile load in the background (don't await)
                // This starts the fetch but lets the UI proceed to navigation instantly
                loadProfile();
                
                // 3. Navigate immediately for "Zero-Latency" feel
                navigate('/dashboard', { state: { loginSuccess: true } });
            } else {
                toast.error(response.data.message || 'Login failed');
            }
        } catch (err) {
            console.error("Login Error:", err);
            toast.error(err.response?.data?.message || "Invalid credentials");
        }
        setLoading(false);
    };

    return (
        <div className="login-container">
            {/* Marquee Strip */}
            {marquee.isEnabled && marquee.text && (
                <div style={{
                    position: 'absolute', top: 'env(safe-area-inset-top, 0px)', left: 0, width: '100%',
                    color: '#cad5f5ff', padding: '12px 0', zIndex: 1000,
                    fontWeight: 'bold', fontSize: '1rem', overflow: 'hidden',
                    display: 'flex', userSelect: 'none',
                    maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                }}>
                    <div className="marquee-content">
                        <span>{marquee.text} &nbsp; • &nbsp; </span>
                        <span>{marquee.text} &nbsp; • &nbsp; </span>
                        <span>{marquee.text} &nbsp; • &nbsp; </span>
                        <span>{marquee.text} &nbsp; • &nbsp; </span>
                    </div>
                    <div className="marquee-content" aria-hidden="true">
                        <span>{marquee.text} &nbsp; • &nbsp; </span>
                        <span>{marquee.text} &nbsp; • &nbsp; </span>
                        <span>{marquee.text} &nbsp; • &nbsp; </span>
                        <span>{marquee.text} &nbsp; • &nbsp; </span>
                    </div>
                </div>
            )}


            {/* Background Orbs (Desktop Only) */}
            <div className="login-bg-orb desktop-only" style={{ top: '-10%', left: '-10%', background: 'var(--primary)' }}></div>
            <div className="login-bg-orb desktop-only" style={{ bottom: '-10%', right: '-10%', background: 'var(--secondary)' }}></div>
            <div className="login-bottom-glow desktop-only"></div>

            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                    type: "spring", 
                    damping: 25, 
                    stiffness: 200,
                    delay: 0.1
                }}
                className="login-glass-card"
            >
                {/* Drag Handle for Bottom Sheet */}
                <div className="sheet-handle"></div>

                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <img src="/HostelX.png" alt="HostelX Logo" style={{ width: '80px', height: '80px', marginBottom: '1rem', objectFit: 'contain' }} />
                    <h1 className="login-title">HostelX</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.95rem' }}>Sign in to access your portal</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                            <User size={20} />
                        </div>
                        <input
                            type="text"
                            value={rollNo}
                            onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                            className="input-field"
                            placeholder="Roll Number"
                            style={{ paddingLeft: '48px', marginBottom: '0' }}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                            <Lock size={20} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="Password"
                            style={{ paddingLeft: '48px', paddingRight: '48px', marginBottom: '0' }}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)',
                                background: 'none', border: 'none',
                                color: 'var(--text-muted)', cursor: 'pointer', display: 'flex'
                            }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-10px' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            style={{
                                background: 'none', border: 'none', color: 'var(--primary)',
                                fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500'
                            }}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        animate={loading ? { 
                            backgroundColor: ['var(--primary)', 'rgba(37, 99, 235, 0.8)', 'var(--primary)'],
                            transition: { repeat: Infinity, duration: 1.5 }
                        } : {}}
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                            fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '8px', position: 'relative', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN'}</span>
                    </motion.button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
                        Don't have an account? <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>Register Here</button>
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '16px' }}>Secure Campus Access System v2.0</p>
                    <div style={{ marginTop: '12px' }}>
                        <a 
                            href="/privacy.html" 
                            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
                        >
                            Privacy Policy
                        </a>
                        <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 8px' }}>•</span>
                        <a 
                            href="/terms.html" 
                            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
                        >
                            Terms of Use
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
