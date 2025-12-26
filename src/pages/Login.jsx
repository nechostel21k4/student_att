import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { ArrowRight, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Force refresh

const Login = () => {
    const [rollNo, setRollNo] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Basic validation
        if (!rollNo || !password) {
            toast.error("Please fill in all fields");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/student-auth/login`, { rollNo, password });
            if (response.data.success && response.data.token) {
                toast.success("Login Successful!");
                localStorage.setItem('studentToken', response.data.token);
                localStorage.setItem('studentId', rollNo);
                if (response.data.student) {
                    localStorage.setItem('studentName', response.data.student.name || '');
                    localStorage.setItem('studentHostel', response.data.student.hostelId || '');
                    localStorage.setItem('isRegistered', String(response.data.student.isRegistered));
                }

                // Small delay to let user see success message
                setTimeout(() => {
                    navigate('/dashboard');
                }, 800);
            } else {
                toast.error(response.data.message || 'Login failed');
            }
        } catch (err) {
            console.error("Login Error:", err);
            if (err.response) {
                toast.error(err.response.data.message || "Invalid credentials");
            } else {
                toast.error("Network error. Please try again.");
            }
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh', width: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            background: 'var(--bg-gradient)',
            padding: '20px' // Ensure padding on small screens
        }}>
            <Toaster position="top-center" reverseOrder={false} />
            {/* Background Orbs - Hidden on very small screens to avoid clutter/overflow issues if any, but overflow hidden handles it. We'll adjust size/blur. */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', maxWidth: '400px', maxHeight: '400px', background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.3, borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', maxWidth: '350px', maxHeight: '350px', background: 'var(--secondary)', filter: 'blur(100px)', opacity: 0.3, borderRadius: '50%' }}></div>

            <div className="glass-card" style={{
                width: '100%', maxWidth: '420px',
                padding: 'clamp(24px, 5vw, 40px)', // Responsive padding
                display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 32px)', // Responsive gap
                zIndex: 1, margin: '0'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '20px',
                        background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px auto',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <img src="/Nec.png" alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '800', margin: 0, color: 'white' }}>Welcome Back</h1>
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



                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                            fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                            marginTop: '8px', opacity: loading ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                        <ArrowRight size={20} />
                    </button>
                </form>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '20px', textAlign: 'center' }}>
                Don't have an account? <span onClick={() => navigate('/register')} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>Register Here</span>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '10px', textAlign: 'center' }}>Secure Campus Access System v2.0</p>
        </div>
    );
};

export default Login;
