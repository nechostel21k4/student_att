import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Send, CheckCircle, XCircle, Clock, RotateCcw, MessageSquareWarning, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';
import { useStudent } from '../context/StudentContext';
import { getStudentId, getToken } from '../services/studentStorage';

const StudentComplaint = () => {
    const { profile } = useStudent();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [complaintText, setComplaintText] = useState('');

    const token = getToken();
    const sid = getStudentId();
    const [mongoId, setMongoId] = useState(null);

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        if (profile && profile._id) {
            setMongoId(profile._id);
            fetchComplaints(profile._id);
        } else if (profile && !profile._id) {
            setLoading(false);
        }
    }, [navigate, profile]);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const LIMIT = 10;

    const fetchComplaints = async (realId, isLoadMore = false) => {
        const currentPage = isLoadMore ? page + 1 : 1;
        try {
            const compRes = await axios.get(`${API_BASE_URL}/complaint/room?studentId=${realId}&page=${currentPage}&limit=${LIMIT}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (compRes.data && compRes.data.success) {
                const newComplaints = compRes.data.data || [];
                if (isLoadMore) {
                    setComplaints(prev => [...prev, ...newComplaints]);
                    setPage(currentPage);
                } else {
                    setComplaints(newComplaints);
                    setPage(1);
                }
                setHasMore(compRes.data.hasMore);
                setTotalCount(compRes.data.totalCount);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!mongoId) return;

        if (!complaintText.trim()) {
            toast.error("Please describe your issue.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                studentId: mongoId,
                complaintText: complaintText
            };

            const res = await axios.post(`${API_BASE_URL}/complaint/create`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data && res.data.success) {
                toast.success("Complaint Submitted Successfully");
                setComplaintText('');
                // If it was a room complaint, refresh list
                if (!payload.isPersonal) {
                    fetchComplaints(mongoId);
                }
            } else {
                toast.error(res.data?.message || "Failed to submit complaint");
            }

        } catch (err) {
            console.error("Submit error", err);
            toast.error("Error submitting complaint");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Issue Solved': return 'var(--success)';
            case 'Issue Recognized': return '#facc15'; // Warning/Yellow
            case 'Issue Canceled': return 'var(--error)';
            default: return 'var(--text-muted)';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };


    return (
        <div style={{
            width: '100%',
            display: 'flex', justifyContent: 'center',
            padding: '24px 24px 100px 24px'
        }}>
            <div style={{
                width: '100%', maxWidth: '800px',
                display: 'flex', flexDirection: 'column', gap: '24px'
            }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: 'white' }}>Complaint Box</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Raise an issue regarding your room or hostel</p>
                </div>

                {loading ? (
                    <>
                        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="skeleton" style={{ width: '120px', height: '16px' }}></div>
                            <div className="skeleton" style={{ width: '100%', height: '100px', borderRadius: '12px' }}></div>
                            <div className="skeleton" style={{ width: '100px', height: '40px', alignSelf: 'flex-end', borderRadius: '8px' }}></div>
                        </div>

                        <div>
                            <div className="skeleton" style={{ width: '100px', height: '20px', marginBottom: '16px' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div style={{ flex: 1 }}>
                                                <div className="skeleton" style={{ width: '120px', height: '14px', marginBottom: '8px' }}></div>
                                                <div className="skeleton" style={{ width: '80%', height: '16px' }}></div>
                                            </div>
                                            <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '12px' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Complaint Form */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <label style={{ color: 'white', fontWeight: '500' }}>Describe Issue</label>
                                <textarea
                                    value={complaintText}
                                    onChange={(e) => setComplaintText(e.target.value)}
                                    rows={4}
                                    placeholder="e.g. Fan not working, Water leakage..."
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                                        padding: '12px', color: 'white', resize: 'none', outline: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        alignSelf: 'flex-end',
                                        padding: '12px 24px', borderRadius: '8px', border: 'none',
                                        background: 'var(--primary)', color: 'white', fontWeight: 'bold',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                        opacity: submitting ? 0.7 : 1
                                    }}
                                >
                                    {submitting ? <Loader size={18} className="spin" /> : <Send size={18} />}
                                    Submit
                                </button>
                            </form>
                        </div>

                        {/* History */}
                        <div>
                            <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '16px' }}>History</h2>

                            {complaints.length === 0 ? (
                                <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <MessageSquareWarning size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                    <p>No complaints raised yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {complaints.map((comp, index) => (
                                        <div key={comp._id || index} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(comp.createdAt)}</span>
                                                    <p style={{ margin: '8px 0 0 0', color: 'white', fontSize: '1rem', lineHeight: '1.4' }}>{comp.complaintText}</p>
                                                </div>
                                                <div style={{
                                                    padding: '4px 10px', borderRadius: '12px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${getStatusColor(comp.status)} 40`,
                                                    color: getStatusColor(comp.status),
                                                    fontSize: '0.8rem', fontWeight: 'bold', whitespace: 'nowrap',
                                                    marginLeft: '16px'
                                                }}>
                                                    {comp.status}
                                                </div>
                                            </div>
                                            {comp.resolvedBy && (
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resolved by: {comp.resolvedBy}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {hasMore && (
                                        <div style={{ textAlign: 'center', marginTop: '8px' }}>
                                            <button 
                                                onClick={() => fetchComplaints(mongoId, true)}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    color: 'white',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    padding: '8px 24px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <RotateCcw size={16} />
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                <style>{`
    .spin { animation: spin 1s linear infinite; }
@keyframes spin { 100 % { transform: rotate(360deg); } }
`}</style>

            </div>
        </div>
    );
};

export default StudentComplaint;
