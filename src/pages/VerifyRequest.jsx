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
    const isRejected = request.status === 'REJECTED';
    const isArrived = request.status === 'ARRIVED';
    
    // Check if the current time is beyond the allowed time
    const now = new Date();
    const toDate = new Date(request.toTime || request.toDate);
    const isExpired = isApproved && now > toDate;

    let statusTitle = request.status;
    let statusColor = '#eab308'; // Default Pending
    let statusBg = 'rgba(234, 179, 8, 0.1)';

    if (isApproved) {
        if (isExpired) {
            statusTitle = 'EXPIRED';
            statusColor = '#f97316'; // Orange
            statusBg = 'rgba(249, 115, 22, 0.1)';
        } else {
            statusTitle = 'APPROVED';
            statusColor = '#22c55e'; // Green
            statusBg = 'rgba(34, 197, 94, 0.1)';
        }
    } else if (isRejected) {
        statusTitle = 'REJECTED';
        statusColor = '#ef4444'; // Red
        statusBg = 'rgba(239, 68, 68, 0.1)';
    } else if (isArrived) {
        statusTitle = 'RETURNED';
        statusColor = '#3b82f6'; // Blue
        statusBg = 'rgba(59, 130, 246, 0.1)';
    }

    return (
        <div style={{ minHeight: '100vh', width: '100%', background: '#020617', display: 'flex', justifyContent: 'center', padding: '16px' }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ width: '100%', maxWidth: '450px' }}
            >
                {/* 🚨 CRITICAL STATUS HEADER 🚨 */}
                <div style={{ 
                    background: statusBg,
                    border: `2px solid ${statusColor}44`,
                    borderRadius: '32px', padding: '32px 20px', textAlign: 'center', marginBottom: '20px',
                    boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 100px ${statusColor}11`
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        <div style={{ 
                            width: '90px', height: '90px', borderRadius: '50%', background: statusColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 40px ${statusColor}66`
                        }}>
                            {isApproved && !isExpired ? <CheckCircle size={50} color="white" /> : 
                             isExpired ? <Clock size={50} color="white" /> :
                             isRejected ? <XCircle size={50} color="white" /> :
                             <ShieldCheck size={50} color="white" />}
                        </div>
                    </div>
                    <h1 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '2.8rem', fontWeight: '900', letterSpacing: '2px' }}>
                        {statusTitle}
                    </h1>
                    <p style={{ color: statusColor, margin: 0, fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {isExpired ? 'PERMISSION WINDOW CLOSED' : `STATUS: ${request.status}`}
                    </p>
                </div>

                {/* 👤 STUDENT IDENTITY */}
                <div className="glass-card" style={{ 
                    padding: '24px', background: 'rgba(15, 23, 42, 0.8)', 
                    borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)',
                    marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                }}>
                    <div style={{
                        width: '160px', height: '160px', borderRadius: '24px', overflow: 'hidden',
                        border: '4px solid rgba(255,255,255,0.1)', background: '#1e293b',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}>
                        {student.profileImage ? (
                            <img src={student.profileImage} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={60} color="rgba(255,255,255,0.1)" />
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.8rem', fontWeight: '800' }}>{student.name}</h2>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: '600' }}>{student.rollNo}</span>
                            <span style={{ width: '4px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}></span>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: '600' }}>{student.branch}</span>
                        </div>
                    </div>
                </div>

                {/* 📅 PERMISSION TIMELINE */}
                <div className="glass-card" style={{ 
                    padding: '24px', background: 'rgba(15, 23, 42, 0.4)', 
                    borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '20px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 12px 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Validity Period</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ color: 'white', fontWeight: '800', fontSize: '1.3rem' }}>
                                {new Date(request.fromTime || request.fromDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '900', fontSize: '1rem' }}>▼</div>
                            <div style={{ color: isExpired ? '#ef4444' : 'white', fontWeight: '800', fontSize: '1.3rem' }}>
                                {new Date(request.toTime || request.toDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 📋 DETAILS SECTION */}
                <div className="glass-card" style={{ 
                    padding: '24px', background: 'rgba(15, 23, 42, 0.3)', 
                    borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700' }}>
                                <User size={14} /> Student Ph
                            </label>
                            <a href={`tel:${request.phoneNo}`} style={{ color: '#818cf8', fontWeight: '800', textDecoration: 'none', fontSize: '1.1rem' }}>
                                {request.phoneNo || 'N/A'}
                            </a>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700', justifyContent: 'flex-end' }}>
                                <Users size={14} /> Parent Ph
                            </label>
                            <a href={`tel:${request.parentPhoneNo}`} style={{ color: '#818cf8', fontWeight: '800', textDecoration: 'none', fontSize: '1.1rem' }}>
                                {request.parentPhoneNo || 'N/A'}
                            </a>
                        </div>
                    </div>
                    
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '24px' }} />
                    
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>
                            <MessageSquare size={14} /> Purpose of Visit
                        </label>
                        <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '1rem', lineHeight: '1.6', fontWeight: '600' }}>
                            {request.reason || 'No reason provided.'}
                        </p>
                    </div>
                </div>

                {/* Footer branding */}
                <div style={{ marginTop: '30px', textAlign: 'center', opacity: 0.3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <ShieldCheck size={16} color="white" />
                        <span style={{ color: 'white', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '2px' }}>HOSTELX SECURE VERIFY</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
export default VerifyRequest;
