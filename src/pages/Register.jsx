import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { ArrowRight, Lock, User, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import './Login.css';

const Register = () => {
    const navigate = useNavigate();

    // Form States
    const [step, setStep] = useState(1); // 1: Validate, 2: Register
    const [rollNo, setRollNo] = useState('');
    const [studentData, setStudentData] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // UI States
    const [loading, setLoading] = useState(false);

    // Step 1: Validate Roll Number
    const handleValidate = async (e) => {
        e.preventDefault();
        if (!rollNo || rollNo.length !== 10) {
            toast.error("Please enter a valid 10-digit Roll Number");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/student/register/${rollNo}`);
            const { isExist, isRegistered, hosteler } = response.data;

            if (isExist) {
                if (isRegistered) {
                    toast.error("Student already registered. Please Login or Reset Password");
                    setTimeout(() => navigate('/'), 2000);
                } else {
                    setStudentData(hosteler);
                    if (hosteler.email) setEmail(hosteler.email);
                    setStep(2);
                    toast.success("Validation Successful! Please set your password.");
                }
            } else {
                toast.error("Student Not Found. Student doesn't exist");
            }
        } catch (err) {
            console.error("Validation Error:", err);
            toast.error("Error validating roll number. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Register Student
    const handleRegister = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error("Email is required");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/student-auth/register-student`, {
                rollNo,
                email,
                hosteler: studentData,
                password
            });

            if (response.data.success) {
                toast.success("Register Successful! You have successfully registered into HostelX Portal");
                setTimeout(() => navigate('/'), 2000);
            } else {
                toast.error("Register Unsuccessful! Something went wrong. Try Again or Consult Hostel Admin");
            }
        } catch (err) {
            console.error("Registration Error:", err);
            toast.error("Error during registration. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">


            {/* Background Glow Effect */}
            <div className="login-bottom-glow"></div>

            <div className="login-glass-card">
                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 1.75rem)', fontWeight: '800', margin: 0, color: 'white' }}>
                        HostelX
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
                        {step === 1 ? 'Student Registration' : `Completing registration for ${rollNo}`}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleValidate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                value={rollNo}
                                onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                                className="input-field"
                                placeholder="Roll Number (e.g., 22471A05M6)"
                                aria-label="Roll Number"
                                style={{ paddingLeft: '48px', marginBottom: '0', textTransform: 'uppercase' }}
                                required
                                maxLength={10}
                            />
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
                            {loading ? 'Validating...' : 'Validate Roll Number'}
                            <ArrowRight size={20} />
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Student Details Summary */}
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <CheckCircle size={16} color="var(--success)" />
                                <span style={{ fontWeight: '600', color: 'white' }}>{studentData.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <span>{studentData.branch} - {studentData.year} Year</span>
                                <span>{studentData.college}</span>
                            </div>
                        </div>

                        {!studentData.email && (
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                    <User size={20} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field"
                                    placeholder="Personal Email Address"
                                    aria-label="Email Address"
                                    style={{ paddingLeft: '48px', marginBottom: '0' }}
                                    required
                                />
                            </div>
                        )}

                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="Create Password"
                                aria-label="Create Password"
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

                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                <Lock size={20} />
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-field"
                                placeholder="Confirm Password"
                                aria-label="Confirm Password"
                                style={{ paddingLeft: '48px', marginBottom: '0' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => { setStep(1); setPassword(''); setConfirmPassword(''); }}
                                className="btn-secondary"
                                aria-label="Go back to roll number validation"
                                style={{ width: 'auto', padding: '16px' }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{
                                    flex: 1, padding: '16px', borderRadius: '12px', border: 'none',
                                    fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                            >
                                {loading ? 'Registering...' : 'Register'}
                                <CheckCircle size={20} />
                            </button>
                        </div>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
