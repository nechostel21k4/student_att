
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { CreditCard, Calendar, Info, Clock, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStudent } from '../context/StudentContext';

const FeesCost = () => {
    const { profile } = useStudent();
    const navigate = useNavigate();
    const [feeReminders, setFeeReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentYear, setStudentYear] = useState(null);
    const [studentGender, setStudentGender] = useState(null);

    useEffect(() => {
        const fetchStudentDataAndReminders = async () => {
            try {
                const token = localStorage.getItem('studentToken');
                const sid = localStorage.getItem('studentId');

                if (!token || !sid) {
                    navigate('/');
                    return;
                }

                if (profile && profile.year) {
                    setStudentYear(profile.year);
                    setStudentGender(profile.gender);

                    // Then fetch fee reminders for that year
                    const remindersRes = await axios.get(`${API_BASE_URL}/fees/student/${profile.year}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (remindersRes.data.success) {
                        setFeeReminders(remindersRes.data.messages || []);
                    }
                } else if (profile && !profile.year) {
                    toast.error("Student profile not found");
                }
            } catch (error) {
                console.error("Error loading fees data:", error);
                toast.error("Failed to load fee information");
            } finally {
                if (profile) setLoading(false);
            }
        };

        fetchStudentDataAndReminders();
    }, [navigate, profile]);

    const formatMessage = (message) => {
        if (!message) return "";
        const genderWord = studentGender?.toUpperCase() === "MALE" ? "మీ అబ్బాయి" : "మీ అమ్మాయి";
        return message.replace("మీ అబ్బాయి/అమ్మాయి", genderWord);
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto',
            padding: '24px',
            paddingBottom: '100px'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 8px 0', color: 'white' }}>
                    Fees <span style={{ color: 'var(--primary)' }}>Cost</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
                    Announcements regarding hostel fee structures for your academic year.
                </p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card skeleton" style={{ height: '160px', borderRadius: '24px' }}></div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {feeReminders.length > 0 ? (
                        feeReminders.map((reminder) => (
                            <div key={reminder._id} className="glass-card" style={{
                                padding: '24px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Decorative Gradient */}
                                <div style={{
                                    position: 'absolute', top: 0, right: 0,
                                    width: '100px', height: '100px',
                                    background: 'transparent',
                                    zIndex: 0
                                }} />

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div className="fee-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                padding: '10px',
                                                background: 'rgba(37, 99, 235, 0.1)',
                                                borderRadius: '12px',
                                                color: 'var(--primary)'
                                            }}>
                                                <IndianRupee size={24} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontWeight: '700' }}>
                                                    Fee Announcement
                                                </h3>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} />
                                                    {new Date(reminder.submittedTime || reminder.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="year-badge" style={{
                                            background: 'rgba(34, 197, 94, 0.1)',
                                            color: '#22c55e',
                                            padding: '4px 12px',
                                            borderRadius: '100px',
                                            fontSize: '0.8rem',
                                            fontWeight: '700'
                                        }}>
                                            {reminder.customYearText ? reminder.customYearText : (reminder.year === "ALL" ? "ALL YEARS" : `YEAR ${reminder.year}`)}
                                        </div>
                                    </div>

                                    <div style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        marginBottom: '16px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <p style={{ margin: 0, color: '#e2e8f0', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                            {formatMessage(reminder.message)}
                                        </p>
                                    </div>

                                    <div className="fee-footer" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px' }}>
                                        {reminder.templateType === "SAME_AS_LAST_YEAR" ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
                                                <span style={{ fontSize: '0.9rem', color: '#86efac', fontWeight: 'bold' }}>
                                                    Same as Last Year Structure
                                                </span>
                                            </div>
                                        ) : reminder.feeAmountNonAC ? (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></div>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                        Non-AC: <b style={{ color: 'white' }}>{reminder.feeAmountNonAC}</b>
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                        AC: <b style={{ color: 'white' }}>{reminder.feeAmountAC}</b>
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Info size={16} color="var(--primary)" />
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                    {reminder.feeAmount && !reminder.feeAmount.includes("undefined") ? (
                                                        <>Amount: <b style={{ color: 'white' }}>{reminder.feeAmount}</b></>
                                                    ) : (
                                                        <b style={{ color: 'white' }}>Announcement</b>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '32px',
                            border: '2px dashed rgba(255,255,255,0.1)'
                        }}>
                            <CreditCard size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
                            <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>No announcements yet</h3>
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                Check back later for your academic year's fee announcements.
                            </p>
                        </div>
                    )}
                </div>
            )}
            <style>{`
                @media (max-width: 768px) {
                    .glass-card {
                        padding: 16px !important;
                        border-radius: 20px !important;
                    }
                    .fee-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 12px !important;
                    }
                    .year-badge {
                        position: static !important;
                        align-self: flex-start !important;
                    }
                    .fee-footer {
                        gap: 12px !important;
                    }
                    h1 {
                        font-size: 1.75rem !important;
                    }
                    h3 {
                        font-size: 1.1rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default FeesCost;
