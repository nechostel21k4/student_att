import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

const StudentHistory = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('studentToken');
    const sid = localStorage.getItem('studentId');

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        fetchHistory();
    }, [navigate]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/requests/${sid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data) {
                // Backend returns array of requests
                // Sort by date (newest first)? assuming date is available. 
                // Requests usually have 'submitted.time' or 'createdAt'.
                // Let's assume the array is returned as is.
                const sorted = Array.isArray(res.data) ? res.data.reverse() : [];
                setRequests(sorted);
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACCEPTED': return 'var(--success)';
            case 'REJECTED': return 'var(--error)';
            case 'ARRIVED': return 'var(--success)'; // Arrived back
            case 'SUBMITTED': return '#facc15'; // Yellow
            default: return 'var(--text-muted)';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ACCEPTED': return <CheckCircle size={16} />;
            case 'REJECTED': return <XCircle size={16} />;
            case 'ARRIVED': return <CheckCircle size={16} />;
            case 'SUBMITTED': return <AlertCircle size={16} />;
            default: return <FileText size={16} />;
        }
    };

    if (loading) return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '24px 24px 100px 24px' }}>
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="skeleton" style={{ width: '150px', height: '32px', marginBottom: '8px' }}></div>
                        <div className="skeleton" style={{ width: '250px', height: '16px' }}></div>
                    </div>
                    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                </div>

                <div className="glass-card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div className="skeleton" style={{ width: '100px', height: '20px', marginBottom: '8px', borderRadius: '8px' }}></div>
                                <div className="skeleton" style={{ width: '180px', height: '16px' }}></div>
                            </div>
                            <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '20px' }}></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{
            width: '100%',
            display: 'flex', justifyContent: 'center',
            padding: '16px 16px 100px 16px' // Reduced padding for mobile
        }}>
            <div style={{
                width: '100%', maxWidth: '800px',
                display: 'flex', flexDirection: 'column', gap: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: 'white' }}>History</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>Your past leave and permission requests</p>
                    </div>
                    <button onClick={fetchHistory} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <RefreshCw size={20} />
                    </button>
                </div>

                {requests.length === 0 ? (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No history found</p>
                    </div>
                ) : (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                        {requests.map((req, index) => (
                            <div key={index} style={{
                                padding: '16px',
                                display: 'flex', flexDirection: 'column', gap: '8px',
                                borderBottom: index < requests.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>

                                    {/* Left: Type, Date, Time */}
                                    <div style={{ minWidth: '0', flex: 1 }}> {/* MinWidth 0 allows text truncation if needed */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                color: req.type === 'LEAVE' ? '#818cf8' : '#c084fc',
                                                fontWeight: 'bold', fontSize: '0.85rem',
                                                background: req.type === 'LEAVE' ? 'rgba(129, 140, 248, 0.1)' : 'rgba(192, 132, 252, 0.1)',
                                                padding: '2px 8px', borderRadius: '4px'
                                            }}>
                                                {req.type}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                {formatDate(req.createdAt || req.submitted?.time)}
                                            </span>
                                        </div>

                                        <div style={{ color: 'white', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                            {req.type === 'LEAVE' ? (
                                                <span>{formatDate(req.fromDate)} - {formatDate(req.toDate)}</span>
                                            ) : (
                                                <span>{formatDate(req.date)} • {formatTime(req.fromTime)} - {formatTime(req.toTime)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Status */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        color: getStatusColor(req.status),
                                        fontWeight: '600', fontSize: '0.8rem',
                                        background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '8px',
                                        alignSelf: 'flex-start' // Ensure it doesn't stretch
                                    }}>
                                        {getStatusIcon(req.status)}
                                        <span>{req.status}</span>
                                    </div>
                                </div>

                                {/* Reason (if any) */}
                                {req.reason && (
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        "{req.reason}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentHistory;
