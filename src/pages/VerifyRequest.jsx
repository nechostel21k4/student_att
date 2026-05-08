import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { CheckCircle, XCircle, Clock, User, Users, MessageSquare, FileText, Calendar, ShieldCheck, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyRequest = () => {
    const { requestId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVerificationData = async () => {
            try {
                // Assuming a public or specialized endpoint for verification
                // If not available, we try to fetch via the requestId
                const res = await axios.get(`${API_BASE_URL}/requests/verify/${requestId}`);
                setData(res.data);
            } catch (err) {
                console.error("Verification error:", err);
                setError("Invalid QR Code or Request not found.");
            } finally {
                setLoading(false);
            }
        };

        if (requestId) {
            fetchVerificationData();
        }
    }, [requestId]);

    if (loading) {
        return (
            <div style={{ height: '100vh', width: '100%', background: '#05070F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="skeleton" style={{ width: '100%', maxWidth: '400px', height: '600px', borderRadius: '32px' }}></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ height: '100vh', width: '100%', background: '#05070F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
                    <XCircle size={64} color="#ef4444" style={{ marginBottom: '20px' }} />
                    <h2 style={{ color: 'white', marginBottom: '10px' }}>Verification Failed</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>{error || "Could not verify this outpass."}</p>
                </div>
            </div>
        );
    }

    const { student, request } = data;
    const isApproved = request.status === 'ACCEPTED';
    const statusColor = isApproved ? '#22c55e' : request.status === 'REJECTED' ? '#ef4444' : '#eab308';

    return (
        <div style={{ minHeight: '100vh', width: '100%', background: '#05070F', display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '450px', position: 'relative' }}
            >
                {/* Status Header */}
                <div style={{ 
                    background: isApproved ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isApproved ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '28px', padding: '24px', textAlign: 'center', marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <div style={{ 
                            width: '80px', height: '80px', borderRadius: '50%', background: statusColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 30px ${statusColor}44`
                        }}>
                            {isApproved ? <CheckCircle size={40} color="white" /> : <ShieldCheck size={40} color="white" />}
                        </div>
                    </div>
                    <h1 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.8rem', fontWeight: '800' }}>
                        {isApproved ? 'APPROVED' : request.status}
                    </h1>

                </div>

                {/* Student Identity Card */}
                <div className="glass-card" style={{ 
                    padding: '24px', background: 'rgba(15, 23, 42, 0.6)', 
                    borderRadius: '28px', border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center'
                }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '20px', overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0, background: '#1e293b'
                    }}>
                        {student.profileImage ? (
                            <img src={student.profileImage} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={40} color="rgba(255,255,255,0.1)" />
                            </div>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.3rem' }}>{student.name}</h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0 0 4px 0', fontSize: '0.85rem' }}>{student.rollNo}</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '0.85rem' }}>{student.branch} - {student.year} Year</p>
                    </div>
                </div>

                {/* Request Status & Times */}
                <div className="glass-card" style={{ 
                    padding: '24px', background: 'rgba(15, 23, 42, 0.4)', 
                    borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
                        {(request.fromTime || request.fromDate) && (
                            <div style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>
                                {new Date(request.fromTime || request.fromDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                                <span style={{ margin: '0 10px', opacity: 0.3 }}>→</span>
                                {new Date(request.toTime || request.toDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact & Reason */}
                <div className="glass-card" style={{ 
                    padding: '24px', background: 'rgba(15, 23, 42, 0.3)', 
                    borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <User size={12} /> Student Ph
                            </label>
                            <a href={`tel:${request.phoneNo}`} style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem' }}>
                                {request.phoneNo || 'N/A'}
                            </a>
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <Users size={12} /> Parent Ph
                            </label>
                            <a href={`tel:${request.parentPhoneNo}`} style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem' }}>
                                {request.parentPhoneNo || 'N/A'}
                            </a>
                        </div>
                    </div>
                    
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '20px' }} />
                    
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <MessageSquare size={12} /> Reason for {request.type || 'Request'}
                        </label>
                        <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem', lineHeight: '1.6', fontWeight: '500' }}>
                            {request.reason || 'No reason provided.'}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyRequest;
