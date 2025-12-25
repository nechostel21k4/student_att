import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, FileText, Send, History, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config';

const StudentLeave = () => {
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [requestType, setRequestType] = useState('LEAVE'); // LEAVE or PERMISSION
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState(''); // For Leave
    const [fromTime, setFromTime] = useState(''); // For Permission
    const [toTime, setToTime] = useState(''); // For Permission
    const [reason, setReason] = useState('');

    const token = localStorage.getItem('studentToken');
    const sid = localStorage.getItem('studentId');

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        fetchStudentData();
    }, [navigate]);

    const fetchStudentData = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/student/${sid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.isExist) {
                setStudent(res.data.hosteler);
            }
        } catch (err) {
            console.error("Failed to fetch student", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!student) return;

        setSubmitting(true);

        try {
            // Construct lastRequest object
            const baseRequest = {
                name: student.name,
                rollNo: student.rollNo,
                hostelId: student.hostelId,
                id: `REQ${Date.now()} `, // Generated Unique ID
                phoneNo: student.phoneNo,
                parentPhoneNo: student.parentPhoneNo,
                reason: reason,
                type: requestType,
                isActive: true,
                status: 'SUBMITTED',
                submitted: {
                    time: new Date(),
                    name: student.name,
                    rollNo: student.rollNo
                }
            };

            let requestPayload = {};

            if (requestType === 'LEAVE') {
                requestPayload = {
                    ...baseRequest,
                    fromDate: new Date(fromDate),
                    toDate: new Date(toDate)
                };
            } else {
                // Permission logic
                // Combine date + time
                const dateObj = new Date(fromDate);
                const [h1, m1] = fromTime.split(':');
                const [h2, m2] = toTime.split(':');

                const fTime = new Date(dateObj);
                fTime.setHours(parseInt(h1), parseInt(m1));

                const tTime = new Date(dateObj);
                tTime.setHours(parseInt(h2), parseInt(m2));

                requestPayload = {
                    ...baseRequest,
                    date: dateObj,
                    fromTime: fTime,
                    toTime: tTime
                };
            }

            const payload = {
                student: student,
                lastRequest: requestPayload
            };

            const res = await axios.post(`${API_BASE_URL}/student/createRequestAndUpdate/${sid}`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data) {
                alert("Request Submitted Successfully!");
                setReason('');
                setFromDate('');
                setToDate('');
                setFromTime('');
                setToTime('');
            } else {
                alert("Submission Failed");
            }

        } catch (err) {
            console.error("Submit error", err);
            alert("Error submitting request");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '24px 24px 100px 24px' }}>
            <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ width: '300px', height: '16px' }}></div>
                </div>
                <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="skeleton" style={{ flex: 1, height: '40px', borderRadius: '12px' }}></div>
                        <div className="skeleton" style={{ flex: 1, height: '40px', borderRadius: '12px' }}></div>
                    </div>
                    <div className="skeleton" style={{ width: '100px', height: '16px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '45px', borderRadius: '12px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '50px', borderRadius: '12px', marginTop: '8px' }}></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="leave-container" style={{
            width: '100%',
            display: 'flex', justifyContent: 'center',
            padding: '16px 16px 100px 16px' // Added responsive padding
        }}>
            <div style={{
                width: '100%', maxWidth: '900px',
                display: 'flex', flexDirection: 'column', gap: '24px'
            }}>
                {/* Page Title */}
                <div>
                    <h1 className="page-title" style={{
                        fontWeight: 'bold', margin: 0,
                        color: 'white',
                        fontSize: '1.75rem', // Adjusted for mobile
                        lineHeight: '1.2'
                    }}>
                        Apply Leave / Permission
                    </h1>
                </div>

                <div className="glass-card leave-card" style={{
                    padding: '20px', // Explicit padding
                    display: 'flex', flexDirection: 'column', gap: '20px'
                }}>

                    {/* Radio Button Toggle - Custom Style */}
                    <div className="toggle-group" style={{
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px',
                        gap: '24px' // Added gap
                    }}>
                        <label className="toggle-label" style={{
                            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                            color: requestType === 'PERMISSION' ? 'white' : 'rgba(255,255,255,0.5)',
                            // fontSize and fontWeight handled by media queries if needed
                            transition: 'all 0.3s'
                        }}>
                            <input
                                type="radio"
                                name="requestType"
                                checked={requestType === 'PERMISSION'}
                                onChange={() => setRequestType('PERMISSION')}
                                style={{ display: 'none' }}
                            />
                            <div className="radio-circle" style={{
                                width: '22px', height: '22px',
                                borderRadius: '50%',
                                border: requestType === 'PERMISSION' ? 'none' : '2px solid rgba(255,255,255,0.4)',
                                background: requestType === 'PERMISSION' ? '#6366f1' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                                boxShadow: requestType === 'PERMISSION' ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
                            }}>
                                {requestType === 'PERMISSION' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                            </div>
                            <span className="toggle-text">Permission</span>
                        </label>

                        <label className="toggle-label" style={{
                            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                            color: requestType === 'LEAVE' ? 'white' : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.3s'
                        }}>
                            <input
                                type="radio"
                                name="requestType"
                                checked={requestType === 'LEAVE'}
                                onChange={() => setRequestType('LEAVE')}
                                style={{ display: 'none' }}
                            />
                            <div className="radio-circle" style={{
                                width: '22px', height: '22px',
                                borderRadius: '50%',
                                border: requestType === 'LEAVE' ? 'none' : '2px solid rgba(255,255,255,0.4)',
                                background: requestType === 'LEAVE' ? '#6366f1' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                                boxShadow: requestType === 'LEAVE' ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
                            }}>
                                {requestType === 'LEAVE' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                            </div>
                            <span className="toggle-text">Leave</span>
                        </label>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit}>

                        {/* Section Header */}
                        <div style={{ marginBottom: '24px' }}>
                            <h2 className="form-section-title" style={{ fontWeight: '600', color: 'white', margin: 0 }}>
                                {requestType === 'LEAVE' ? 'Leave Application' : 'Permission Request'}
                            </h2>
                        </div>

                        <div className="form-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', // Auto-responsive grid
                            gap: '20px'
                        }}>

                            {/* Row 1: Name & Roll Number */}
                            <div className="input-wrapper">
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                    Name <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={student?.name || ''}
                                    readOnly
                                    disabled
                                    className="responsive-input"
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                        padding: '12px', color: 'var(--text-muted)', outline: 'none',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>
                            <div className="input-wrapper">
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                    Roll Number <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={student?.rollNo || ''}
                                    readOnly
                                    disabled
                                    className="responsive-input"
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                        padding: '12px', color: 'var(--text-muted)', outline: 'none',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>

                            {/* Row 2: Hostel ID & Date */}
                            <div className="input-wrapper">
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                    Hostel ID <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={student?.hostelId || ''}
                                    readOnly
                                    disabled
                                    className="responsive-input"
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                        padding: '12px', color: 'var(--text-muted)', outline: 'none',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>

                            {/* Dynamic Fields Based on Type */}
                            {requestType === 'LEAVE' ? (
                                <>
                                    <div className="input-wrapper">
                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            From Date <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            required
                                            className="responsive-input"
                                            style={{
                                                width: '100%', background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                                padding: '12px', color: 'white', outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            To Date <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            required
                                            className="responsive-input"
                                            style={{
                                                width: '100%', background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                                padding: '12px', color: 'white', outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                    </div>
                                    {/* Empty div for grid alignment if needed, or let it flow */}
                                </>
                            ) : (
                                <>
                                    <div className="input-wrapper">
                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            Date <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            required
                                            className="responsive-input"
                                            style={{
                                                width: '100%', background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                                padding: '12px', color: 'white', outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            From Time <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={fromTime}
                                            onChange={(e) => setFromTime(e.target.value)}
                                            required
                                            className="responsive-input"
                                            style={{
                                                width: '100%', background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                                padding: '12px', color: 'white', outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            To Time <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={toTime}
                                            onChange={(e) => setToTime(e.target.value)}
                                            required
                                            className="responsive-input"
                                            style={{
                                                width: '100%', background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                                padding: '12px', color: 'white', outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Reason Row - Spans full width */}
                            <div style={{ gridColumn: '1 / -1' }} className="reason-container">
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                    Reason <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                    rows={3}
                                    placeholder="Enter reason for leave/permission..."
                                    className="responsive-input"
                                    style={{
                                        width: '100%', background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                        padding: '12px', color: 'white', outline: 'none',
                                        transition: 'border-color 0.2s', resize: 'vertical'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>

                        </div>

                        {/* Submit Button */}
                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-start' }} className="submit-container">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn-primary responsive-btn"
                                style={{
                                    padding: '12px 32px', borderRadius: '8px',
                                    fontSize: '1rem', fontWeight: '500',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: submitting ? 0.7 : 1
                                }}
                            >
                                {submitting ? <Loader size={18} className="spin" /> : null}
                                {submitting ? `Applying ${requestType === 'LEAVE' ? 'Leave' : 'Permission'}...` : `Apply ${requestType === 'LEAVE' ? 'Leave' : 'Permission'} `}
                            </button>
                        </div>

                    </form>
                </div>

                <style>{`
    /* Base Styles (Desktop First) */
    .leave-container {
        padding: 24px 24px 100px 24px;
    }
    .leave-card {
        padding: 32px;
    }
    .page-title {
        font-size: 2rem;
    }
    .toggle-group {
        gap: 40px;
        flex-direction: row;
    }
    .toggle-label {
        font-size: 1.1rem;
        font-weight: 500;
    }
    .toggle-text {
        font-size: 1.1rem;
    }
    .form-section-title {
        font-size: 1.5rem;
    }
    .form-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .responsive-input {
        font-size: 1rem;
    }
    .submit-container {
        justify-content: flex-start;
    }

    /* Tablet (Medium Screens) */
    @media(max-width: 1024px) {
        .form-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    /* Mobile (Small Screens) */
    @media(max-width: 768px) {
        .leave-container {
            padding: 16px 16px 80px 16px !important;
        }
        .leave-card {
            padding: 24px;
        }
        .page-title {
            font-size: 1.75rem !important;
            text-align: center;
        }
        .toggle-group {
            gap: 24px;
            justify-content: center;
        }
        .toggle-label {
            font-size: 1rem;
        }
        .toggle-text {
            font-size: 1rem;
        }
        .form-grid {
            grid-template-columns: 1fr !important; /* Stack inputs vertically */
            gap: 16px;
        }
        .form-section-title {
            font-size: 1.25rem;
            text-align: center;
        }
        .submit-container {
            justify-content: center; /* Center button on mobile */
        }
        .responsive-btn {
            width: 100%; /* Full width button on mobile */
            justify-content: center;
        }
    }

    /* Very Small Screens */
    @media(max-width: 480px) {
        .leave-container {
            padding: 12px 12px 60px 12px !important;
        }
        .leave-card {
            padding: 16px;
        }
        .page-title {
            font-size: 1.5rem !important;
        }
        .toggle-group {
            gap: 16px;
        }
        .radio-circle {
            width: 18px !important;
            height: 18px !important;
        }
        .responsive-input {
            font-size: 16px; /* Prevent zoom on iOS input focus */
            padding: 10px !important;
        }
    }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* Custom Scrollbar for textarea */
    textarea::-webkit-scrollbar { width: 8px; }
    textarea::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
    textarea::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }

    /* Date Picker Invert */
    input[type="date"]::-webkit-calendar-picker-indicator,
    input[type="time"]::-webkit-calendar-picker-indicator,
    input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        opacity: 0.6;
        cursor: pointer;
    }
`}</style>
            </div>
        </div>
    );
};

export default StudentLeave;
