import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useStudent } from '../context/StudentContext';

const StudentHistory = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const LIMIT = 8;

    const { profile } = useStudent();
    const token = localStorage.getItem('studentToken');
    const sid = localStorage.getItem('studentId');

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        if (profile && profile.rollNo) {
            fetchHistory(false);
        }
    }, [navigate, profile]);

    const fetchHistory = async (isLoadMore = false) => {
        if (!profile?.rollNo) return;
        const currentPage = isLoadMore ? page + 1 : 1;
        try {
            const res = await axios.get(`${API_BASE_URL}/requests/${profile.rollNo}?page=${currentPage}&limit=${LIMIT}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data && res.data.success) {
                const newRequests = res.data.requests || [];
                if (isLoadMore) {
                    setRequests(prev => [...prev, ...newRequests]);
                    setPage(currentPage);
                } else {
                    setRequests(newRequests);
                    setPage(1);
                }
                setHasMore(res.data.hasMore);
                setTotalCount(res.data.totalCount);
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
            hour: '2-digit', minute: '2-digit', hour12: true
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
            case 'ACCEPTED': return (
                <img src="/approved.webp" alt="Approved" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            );
            case 'REJECTED': return (
                <img src="/rejected.webp" alt="Rejected" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            );
            case 'ARRIVED': return (
                <img src="/completed.webp" alt="Completed" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            );
            case 'SUBMITTED': return (
                <img src="/pending.webp" alt="Pending" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            );
            default: return <FileText size={20} />;
        }
    };


    return (
        <div className="history-container" style={{
            width: '100%',
            display: 'flex', justifyContent: 'center',
            padding: '16px 16px 100px 16px'
        }}>
            <div style={{
                width: '100%', maxWidth: '800px',
                display: 'flex', flexDirection: 'column', gap: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: 'white' }}>History</h1>
                        <p className="page-subtitle" style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>Your past leave and permission requests</p>
                    </div>
                </div>

                {loading ? (
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
                ) : requests.length === 0 ? (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No history found</p>
                    </div>
                ) : (
                    <div className="glass-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {requests.map((req, index) => (
                            <div key={req._id || index} className="history-item" style={{
                                padding: '20px',
                                borderBottom: index === requests.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', flexDirection: 'column', gap: '8px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>

                                    {/* Left: Type, Date, Time */}
                                    <div style={{ minWidth: '0', flex: 1 }}> {/* MinWidth 0 allows text truncation if needed */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                color: req.type === 'LEAVE' ? '#3b82f6' : '#60a5fa',
                                                fontWeight: 'bold', fontSize: '0.85rem',
                                                background: req.type === 'LEAVE' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)',
                                                padding: '2px 8px', borderRadius: '4px'
                                            }}>
                                                {req.type}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                {formatDate(req.createdAt || req.submitted?.time)}
                                            </span>
                                        </div>

                                        <div className="req-details" style={{ color: 'white', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                            {req.type === 'LEAVE' ? (
                                                <span>{formatDate(req.fromDate)} - {formatDate(req.toDate)}</span>
                                            ) : (
                                                <span>{formatDate(req.date)} • {formatTime(req.fromTime)} - {formatTime(req.toTime)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Status */}
                                    <div className="status-badge" style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        color: getStatusColor(req.status),
                                        fontWeight: '600', fontSize: '0.8rem',
                                        background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '8px',
                                        alignSelf: 'flex-start',
                                        whiteSpace: 'nowrap'
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
                        
                        {hasMore && (
                            <div style={{ padding: '24px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <button 
                                    onClick={() => fetchHistory(true)}
                                    style={{
                                        background: 'rgba(37, 99, 235, 0.1)',
                                        color: 'var(--primary)',
                                        border: '1px solid rgba(37, 99, 235, 0.2)',
                                        padding: '12px 32px',
                                        borderRadius: '14px',
                                        fontSize: '0.95rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        width: '100%',
                                        maxWidth: '300px'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'rgba(37, 99, 235, 0.15)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    SHOW MORE HISTORY
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <style>{`
                @media (max-width: 768px) {
                    .history-container {
                        padding: 12px 12px 80px 12px !important;
                    }
                    .page-title {
                        font-size: 1.5rem !important;
                    }
                    .page-subtitle {
                        font-size: 0.8rem !important;
                    }
                    .refresh-btn {
                        width: 36px !important;
                        height: 36px !important;
                    }
                    .history-item {
                        padding: 12px !important;
                    }
                    .status-badge {
                        font-size: 0.75rem !important;
                        padding: 2px 6px !important;
                    }
                    .req-details {
                        font-size: 0.85rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default StudentHistory;
