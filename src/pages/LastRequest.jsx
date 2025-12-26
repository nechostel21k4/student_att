import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Send, CheckCheck, MapPin, XCircle, Info } from 'lucide-react';
import { API_BASE_URL } from '../config';

const LastRequest = () => {
    const navigate = useNavigate();
    const [lastRequest, setLastRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('studentToken');
    const sid = localStorage.getItem('studentId');

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        fetchLastRequest();
    }, [navigate]);

    const fetchLastRequest = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/student/${sid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.isExist && res.data.hosteler?.lastRequest) {
                setLastRequest(res.data.hosteler.lastRequest);
            }
        } catch (err) {
            console.error("Failed to fetch last request", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    if (loading) return (
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
            <div className="skeleton" style={{ width: '100%', maxWidth: '500px', height: '500px', borderRadius: '24px' }}></div>
        </div>
    );

    if (!lastRequest) return (
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
                <Info size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.5rem' }}>No Active Requests</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>You don't have any ongoing leave or permission requests.</p>
                <button
                    onClick={() => navigate('/leave')}
                    className="btn-primary"
                    style={{
                        marginTop: '24px', width: '100%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                        border: 'none', padding: '12px', borderRadius: '12px',
                        color: 'white', fontWeight: '600', cursor: 'pointer'
                    }}
                >
                    Apply New Request
                </button>
            </div>
        </div>
    );

    // Build timeline details
    const steps = [];

    if (lastRequest.submitted) {
        steps.push({
            title: 'Submitted',
            date: lastRequest.submitted.time,
            actor: 'You',
            icon: Send,
            color: '#3b82f6', // blue-500
            status: 'done'
        });
    }

    if (lastRequest.status !== 'SUBMITTED' && lastRequest.status !== 'CANCELLED01') {
        if (lastRequest.accepted) {
            steps.push({
                title: 'Approved',
                date: lastRequest.accepted.time,
                actor: lastRequest.accepted.name || 'Warden',
                icon: CheckCheck,
                color: '#22c55e', // green-500
                status: 'done'
            });
        } else if (lastRequest.rejected) {
            steps.push({
                title: 'Rejected',
                date: lastRequest.rejected.time,
                actor: lastRequest.rejected.name || 'Warden',
                icon: XCircle,
                color: '#ef4444', // red-500
                status: 'error'
            });
        }
    }

    if (lastRequest.status === 'ARRIVED' && lastRequest.arrived) {
        steps.push({
            title: 'Reported Back',
            date: lastRequest.arrived.time,
            actor: lastRequest.arrived.name || 'Security',
            icon: MapPin,
            color: '#a855f7', // purple-500
            status: 'done'
        });
    }

    // Determine current status color for header
    const getStatusTheme = (status) => {
        if (status === 'ACCEPTED') return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)' };
        if (status === 'REJECTED') return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' };
        if (status === 'ARRIVED') return { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.2)' };
        return { color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.2)' }; // Submitted
    };

    const theme = getStatusTheme(lastRequest.status);

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '24px 16px 80px 16px' }}>
            <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'white' }}>Track Request</h1>
                </div>

                {/* Status Card */}
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>

                    {/* Header Banner */}
                    <div style={{
                        padding: '24px', background: theme.bg,
                        borderBottom: `1px solid ${theme.border} `,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: theme.color, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Current Status
                            </p>
                            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.8rem', color: 'white', fontWeight: '700' }}>
                                {lastRequest.status}
                            </h2>
                        </div>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: theme.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 8px 16px - 4px ${theme.color} 66`
                        }}>
                            {lastRequest.status === 'REJECTED' ? <XCircle color="white" size={28} /> : <CheckCheck color="white" size={28} />}
                        </div>
                    </div>

                    {/* Request Summary */}
                    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Type</label>
                            <div style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }}>{lastRequest.type}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Reference ID</label>
                            <div style={{ color: 'white', fontWeight: '500', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                                #{lastRequest._id ? lastRequest._id.slice(-6).toUpperCase() : '---'}
                            </div>
                        </div>

                        {/* Dates */}
                        {lastRequest.type === 'LEAVE' ? (
                            <>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>From</label>
                                    <div style={{ color: 'white', fontWeight: '500' }}>{formatDate(lastRequest.fromDate)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>To</label>
                                    <div style={{ color: 'white', fontWeight: '500' }}>{formatDate(lastRequest.toDate)}</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Date</label>
                                    <div style={{ color: 'white', fontWeight: '500' }}>{formatDate(lastRequest.date)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Duration</label>
                                    <div style={{ color: 'white', fontWeight: '500' }}>
                                        {formatTime(lastRequest.fromTime)} - {formatTime(lastRequest.toTime)}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Timeline */}
                    <div style={{ padding: '32px 24px' }}>
                        <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', color: 'white', fontWeight: '600' }}>Timeline</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            {steps.map((step, index) => (
                                <div key={index} style={{ display: 'flex', position: 'relative', marginBottom: index === steps.length - 1 ? 0 : '32px' }}>

                                    {/* Line */}
                                    {index !== steps.length - 1 && (
                                        <div style={{
                                            position: 'absolute', left: '26px', top: '50px', bottom: '-32px', width: '2px',
                                            background: 'rgba(255,255,255,0.1)'
                                        }}></div>
                                    )}

                                    {/* Icon Box */}
                                    <div style={{
                                        width: '54px', height: '54px', borderRadius: '16px',
                                        background: `${step.color} 22`, // 20% opacity
                                        border: `1px solid ${step.color} 44`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, marginRight: '20px', zIndex: 2
                                    }}>
                                        <step.icon size={24} color={step.color} />
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, padding: '4px 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h4 style={{ margin: 0, color: 'white', fontSize: '1.05rem', fontWeight: '600' }}>
                                                {step.title}
                                            </h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                                {formatDate(step.date)}
                                            </span>
                                        </div>
                                        <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                                                by {step.actor}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {formatTime(step.date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LastRequest;
