import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { ArrowRight, Lock, User, Eye, EyeOff, Code } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './Login.css'; // Import custom styles

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
        <div className="login-container">
            <Toaster position="top-center" reverseOrder={false} />
            {/* Background Orbs */}
            <div className="login-bg-orb" style={{ top: '-10%', left: '-10%', background: 'var(--primary)' }}></div>
            <div className="login-bg-orb" style={{ bottom: '-10%', right: '-10%', background: 'var(--secondary)' }}></div>

            <div className="login-glass-card">
                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <div className="login-logo-container">
                        <img src="/Nec.png" alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
                    </div>
                    <h1 className="login-title">Welcome Back</h1>
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
                            aria-label="Roll Number"
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
                            aria-label="Password"
                            style={{ paddingLeft: '48px', paddingRight: '48px', marginBottom: '0' }}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
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
                Don't have an account? <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>Register Here</button>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '10px', textAlign: 'center' }}>Secure Campus Access System v2.0</p>

            {/* Developers Button */}
            <button
                onClick={() => navigate('/developers')}
                className="developers-btn"
            >
                <Code size={16} />
                <span>Developers</span>
            </button>
        </div>
    );
};

export default Login;
