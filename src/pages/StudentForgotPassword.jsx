import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Key, ArrowRight, CheckCircle, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifyStudent, verifyOtp, updatePassword } from '../services/authService';
import './Login.css'; // Reusing login styles

const StudentForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form states
    const [rollNo, setRollNo] = useState('');
    const [phoneNo, setPhoneNo] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI states
    const [showPassword, setShowPassword] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleVerifyRollNo = async (e) => {
        e.preventDefault();
        if (!rollNo) return toast.error("Please enter your Roll Number");

        setLoading(true);
        try {
            const data = await verifyStudent(rollNo);
            if (data.isExist) {
                const maskedPhone = data.phoneNo
                    ? data.phoneNo.slice(0, 2) + "*****" + data.phoneNo.slice(7, 10)
                    : "registered mobile";
                setPhoneNo(maskedPhone);
                toast.success(`OTP sent to ${maskedPhone}`);
                setStep(2);
                setResendTimer(90);
            } else {
                toast.error(`Roll Number ${rollNo} not found`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to verify Roll Number");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (otp.length !== 4) return toast.error("Please enter a valid 4-digit OTP");

        setLoading(true);
        try {
            const data = await verifyOtp(rollNo, otp);
            if (data.isOTPValid) {
                toast.success("OTP Verified!");
                setResetToken(data.resetToken);
                setStep(3);
            } else {
                toast.error("Invalid OTP");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error verifying OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;

        try {
            const data = await verifyStudent(rollNo); // Re-trigger OTP
            if (data.isExist) {
                toast.success("OTP Resent Successfully");
                setResendTimer(90);
            }
        } catch (err) {
            toast.error("Failed to resend OTP");
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match");
        }
        if (newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        setLoading(true);
        try {
            const data = await updatePassword(rollNo, newPassword, resetToken);
            if (data.isUpdated) {
                toast.success("Password Updated Successfully!");
                setTimeout(() => navigate('/'), 1500);
            } else {
                toast.error("Failed to update password");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error updating password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">

            <div className="login-bottom-glow"></div>

            <div className="login-glass-card">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h1 className="login-title">Reset Password</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {step === 1 && "Enter your Roll No to receive OTP"}
                        {step === 2 && "Enter OTP sent to your mobile"}
                        {step === 3 && "Set your new password"}
                    </p>
                </div>

                {step === 1 && (
                    <form onSubmit={handleVerifyRollNo} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                value={rollNo}
                                onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                                className="input-field"
                                placeholder="Enter Roll Number"
                                autoComplete="off"
                                style={{ paddingLeft: '48px', marginBottom: '0' }}
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary"
                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            {loading ? 'Verifying...' : 'Send OTP'}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '-10px' }}>
                            OTP sent into {phoneNo}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                <Smartphone size={20} />
                            </div>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="input-field"
                                placeholder="Enter 4-digit OTP"
                                autoComplete="one-time-code"
                                style={{ paddingLeft: '48px', letterSpacing: '2px', fontSize: '1.2rem', textAlign: 'center', marginBottom: '0' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Change Roll No</button>
                            <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0}
                                style={{ background: 'none', border: 'none', color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--primary)', cursor: resendTimer > 0 ? 'default' : 'pointer' }}>
                                {resendTimer > 0 ? `Resend in ${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}` : "Resend OTP"}
                            </button>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary"
                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                            {!loading && <CheckCircle size={20} />}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input-field"
                                placeholder="New Password"
                                style={{ paddingLeft: '48px', marginBottom: '0' }}
                                required
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                <Key size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-field"
                                placeholder="Confirm New Password"
                                style={{ paddingLeft: '48px', marginBottom: '0' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" id="showPass" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
                            <label htmlFor="showPass" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Show Passwords</label>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary"
                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            {loading ? 'Updating...' : 'Reset Password'}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button onClick={() => navigate('/')}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <ArrowLeft size={16} /> Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentForgotPassword;
