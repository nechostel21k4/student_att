import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Send, CheckCircle, XCircle, Clock, RotateCcw, MessageSquareWarning, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config';

const StudentComplaint = () => {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [complaintText, setComplaintText] = useState('');

    const token = localStorage.getItem('studentToken');
    const sid = localStorage.getItem('studentId');
    const [mongoId, setMongoId] = useState(null);

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        fetchStudentAndComplaints();
    }, [navigate]);

    const fetchStudentAndComplaints = async () => {
        try {
            // 1. Fetch Student to get Mongo ID
            const res = await axios.get(`${API_BASE_URL}/student/${sid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.isExist) {
                const realId = res.data.hosteler._id;
                setMongoId(realId);

                // 2. Fetch Complaints
                const compRes = await axios.get(`${API_BASE_URL}/complaint/room?studentId=${realId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (compRes.data && compRes.data.success) {
                    setComplaints(compRes.data.data.reverse()); // Newest first
                }
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
            alert("Please describe your issue.");
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
                alert("Complaint Submitted Successfully");
                setComplaintText('');
                // If it was a room complaint, refresh list
                if (!payload.isPersonal) {
                    try {
                        const compRes = await axios.get(`${API_BASE_URL}/complaint/room?studentId=${mongoId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (compRes.data && compRes.data.success) {
                            setComplaints(compRes.data.data.reverse());
                        }
                    } catch (refreshErr) {
                        console.error("Failed to refresh complaints after submission", refreshErr);
                    }
                }
            } else {
                alert(res.data?.message || "Failed to submit complaint");
            }

        } catch (err) {
            console.error("Submit error", err);
            alert("Error submitting complaint");
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

    if (loading) return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '24px 24px 100px 24px' }}>
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <div className="skeleton" style={{ width: '250px', height: '32px', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ width: '350px', height: '16px' }}></div>
                </div>

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
            </div>
        </div>
    );

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
                                <div key={index} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                        </div>
                    )}
                </div>

                <style>{`
    .spin { animation: spin 1s linear infinite; }
@keyframes spin { 100 % { transform: rotate(360deg); } }
`}</style>

            </div>
        </div>
    );
};

export default StudentComplaint;
