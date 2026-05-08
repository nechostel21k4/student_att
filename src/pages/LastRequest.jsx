import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { ArrowLeft, Send, CheckCheck, MapPin, XCircle, Info, Copy, FileText, Calendar, Clock, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useStudent } from '../context/StudentContext';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Functions ---

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

const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("ID Copied!");
};

const getStatusHeader = (status, isDesktop) => {
    if (status === 'ACCEPTED') {
        return {
            title: 'APPROVED',
            color: '#22c55e',
            bg: 'rgba(34, 197, 94, 0.1)',
            image: '/approved.webp',
            icon: <CheckCheck color="white" size={isDesktop ? 32 : 24} />,
            msg: 'Your request has been approved.'
        };
    }
    if (status === 'REJECTED') {
        return {
            title: 'REJECTED',
            color: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.1)',
            image: '/rejected.webp',
            icon: <XCircle color="white" size={isDesktop ? 32 : 24} />,
            msg: 'Your request has been rejected.'
        };
    }
    if (status === 'ARRIVED') {
        return {
            title: 'COMPLETED',
            color: '#3b82f6',
            bg: 'rgba(59, 130, 246, 0.1)',
            image: '/completed.webp',
            icon: <MapPin color="white" size={isDesktop ? 32 : 24} />,
            msg: 'You have returned to hostel.'
        };
    }
    return {
        title: 'PENDING',
        color: '#eab308',
        bg: 'rgba(234, 179, 8, 0.1)',
        image: '/pending.webp',
        icon: <Send color="white" size={isDesktop ? 32 : 24} />,
        msg: 'Your request is awaiting approval.'
    };
};

const LastRequest = () => {
    const { profile } = useStudent();
    const navigate = useNavigate();
    const { isDesktop } = useOutletContext();
    const [lastRequest, setLastRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQR, setShowQR] = useState(false);

    // Lock body scroll when QR modal is open
    useEffect(() => {
        if (showQR) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showQR]);

    const token = localStorage.getItem('studentToken');
    const sid = localStorage.getItem('studentId');

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        if (profile) {
            if (profile.lastRequest) {
                setLastRequest(profile.lastRequest);
            }
            setLoading(false);
        }
    }, [navigate, profile]);


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
                        background: '#2563eb',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        border: 'none', padding: '12px', borderRadius: '12px',
                        color: 'white', fontWeight: '600', cursor: 'pointer'
                    }}
                >
                    Apply New Request
                </button>
            </div>
        </div>
    );

    const steps = [];
    if (lastRequest.submitted) {
        steps.push({
            title: 'Submitted',
            date: lastRequest.submitted.time,
            actor: 'You',
            actorRole: 'You',
            icon: Send,
            color: '#3b82f6', 
            status: 'done',
            message: 'Your request has been submitted'
        });
    }

    if (lastRequest.status !== 'SUBMITTED' && lastRequest.status !== 'CANCELLED01') {
        if (lastRequest.status === 'ACCEPTED' && lastRequest.accepted) {
            steps.push({
                title: 'Approved',
                date: lastRequest.accepted.time,
                actor: lastRequest.accepted.name || 'Admin',
                actorRole: 'System Admin',
                icon: CheckCheck,
                color: '#22c55e',
                status: 'done',
                message: 'Your request has been approved'
            });
        } else if (lastRequest.status === 'REJECTED' && lastRequest.rejected) {
            steps.push({
                title: 'Rejected',
                date: lastRequest.rejected.time,
                actor: lastRequest.rejected.name || 'Admin',
                actorRole: 'System Admin',
                icon: XCircle,
                color: '#ef4444',
                status: 'error',
                message: 'Your request has been rejected'
            });
        }
    }

    if (lastRequest.status === 'ARRIVED' && lastRequest.arrived) {
        steps.push({
            title: 'Reported Back',
            date: lastRequest.arrived.time,
            actor: lastRequest.arrived.name || 'Security',
            actorRole: 'Security Info',
            icon: MapPin,
            color: '#3b82f6',
            status: 'done',
            message: 'You have reported back to campus'
        });
    }

    const header = getStatusHeader(lastRequest.status, isDesktop);
    const refId = lastRequest._id ? lastRequest._id.slice(-6).toUpperCase() : 'UNKNOWN';

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: isDesktop ? '24px 16px 100px 16px' : '16px 16px 100px 16px' }}>
            <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: isDesktop ? '24px' : '16px' }}>
                
                {/* 1. Status Banner */}
                {loading ? (
                    <div className="skeleton" style={{ width: '100%', height: '140px', borderRadius: '28px' }}></div>
                ) : (
                    <div className="glass-card" style={{ 
                        padding: isDesktop ? '30px' : '24px', 
                        background: 'rgba(15, 23, 42, 0.6)', 
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderRadius: '28px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: header.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                CURRENT STATUS
                            </p>
                            <h1 style={{ margin: '4px 0', fontSize: isDesktop ? '2.4rem' : '1.8rem', color: 'white', fontWeight: '800', letterSpacing: '1px' }}>
                                {header.title}
                            </h1>
                            <p style={{ margin: 0, fontSize: isDesktop ? '0.9rem' : '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
                                {header.msg}
                            </p>
                        </div>
                        <div style={{
                            width: isDesktop ? '120px' : '90px', 
                            height: isDesktop ? '120px' : '90px', 
                            borderRadius: '24px',
                            background: header.image ? 'transparent' : header.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: header.image ? 'none' : `0 0 30px ${header.color}44`,
                            border: header.image ? 'none' : '3px solid rgba(255,255,255,0.1)',
                            flexShrink: 0,
                            marginLeft: '12px',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease'
                        }}>
                            {header.image ? (
                                <img 
                                    src={header.image} 
                                    alt={header.title} 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))'
                                    }} 
                                />
                            ) : (
                                header.icon
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Details Card & 3. Timeline */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="skeleton" style={{ width: '100%', height: '180px', borderRadius: '28px' }}></div>
                        <div className="skeleton" style={{ width: '100%', height: '250px', borderRadius: '28px' }}></div>
                    </div>
                ) : (
                    <>
                        <div className="glass-card" style={{ 
                            padding: isDesktop ? '24px' : '20px', 
                            background: 'rgba(15, 23, 42, 0.4)', 
                            borderRadius: '28px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: isDesktop ? '24px' : '20px'
                        }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', flexShrink: 0 }}>
                                        <FileText size={18} color="#a855f7" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: '2px' }}>Type</label>
                                        <span style={{ color: 'white', fontWeight: '700', fontSize: isDesktop ? '1.1rem' : '1rem' }}>{lastRequest.type}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: '2px' }}>Reference ID</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                        <span style={{ color: 'white', fontWeight: '700', fontSize: isDesktop ? '1.1rem' : '1rem' }}>#{refId}</span>
                                        <Copy 
                                            size={14} 
                                            color="#2563eb" 
                                            style={{ cursor: 'pointer' }} 
                                            onClick={() => copyToClipboard(refId)} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                            <div style={{ 
                                display: 'flex', 
                                flexDirection: isDesktop ? 'row' : 'column',
                                gap: isDesktop ? '0' : '16px',
                                justifyContent: 'space-between' 
                            }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                        <Calendar size={18} color="#a855f7" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: '2px' }}>From</label>
                                        <span style={{ color: 'white', fontWeight: '700' }}>
                                            {lastRequest.type === 'LEAVE' ? formatDate(lastRequest.fromDate) : formatTime(lastRequest.fromTime)}
                                        </span>
                                    </div>
                                </div>
                                {isDesktop && <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 8px' }} />}
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                        <Calendar size={18} color="#a855f7" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: '2px' }}>To</label>
                                        <span style={{ color: 'white', fontWeight: '700' }}>
                                            {lastRequest.type === 'LEAVE' ? formatDate(lastRequest.toDate) : formatTime(lastRequest.toTime)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card" style={{ 
                            padding: isDesktop ? '24px' : '20px', 
                            background: 'rgba(15, 23, 42, 0.4)', 
                            borderRadius: '28px'
                        }}>
                            <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', color: 'white', fontWeight: '700' }}>Timeline</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                {steps.map((step, index) => (
                                    <div key={index} style={{ 
                                        display: 'flex', 
                                        position: 'relative', 
                                        paddingBottom: index === steps.length - 1 ? 0 : isDesktop ? '40px' : '32px' 
                                    }}>
                                        {/* Line */}
                                        {index !== steps.length - 1 && (
                                            <div style={{
                                                position: 'absolute', left: isDesktop ? '26px' : '22.5px', top: isDesktop ? '56px' : '48px', bottom: '0', width: '2px',
                                                background: 'rgba(255,255,255,0.05)'
                                            }} />
                                        )}

                                        {/* Icon */}
                                        <div style={{
                                            width: isDesktop ? '54px' : '45px', 
                                            height: isDesktop ? '54px' : '45px', 
                                            borderRadius: '50%',
                                            background: 'rgba(15,23,42,0.8)',
                                            border: `2px solid ${step.color}44`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, marginRight: isDesktop ? '16px' : '12px', zIndex: 2,
                                            position: 'relative'
                                        }}>
                                            <div style={{
                                                position: 'absolute', inset: 0, borderRadius: '50%',
                                                background: step.color, opacity: 0.1, zIndex: -1
                                            }} />
                                            <step.icon size={isDesktop ? 22 : 18} color={step.color} />
                                        </div>

                                        {/* Content Section */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: !isDesktop ? '4px' : '0' }}>
                                            
                                            <div style={{ flex: 1, paddingTop: '2px' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <h4 style={{ margin: 0, color: 'white', fontSize: isDesktop ? '1.1rem' : '1rem', fontWeight: '600' }}>{step.title}</h4>
                                                    <span style={{ 
                                                        padding: '2px 8px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.1)', 
                                                        color: '#2563eb', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase'
                                                    }}>
                                                        by {step.actorRole}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: isDesktop ? '0.85rem' : '0.8rem', lineHeight: '1.4' }}>{step.message}</p>
                                                
                                                {!isDesktop && (
                                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                                                            <Calendar size={12} />
                                                            <span>{formatDate(step.date)}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                                                            <Clock size={12} />
                                                            <span>{formatTime(step.date)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {isDesktop && (
                                                <div style={{ textAlign: 'right', paddingTop: '4px', flexShrink: 0, marginLeft: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                                                        <Calendar size={12} />
                                                        <span>{formatDate(step.date)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '2px' }}>
                                                        <Clock size={12} />
                                                        <span>{formatTime(step.date)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 4. QR Verification Button */}
                            {lastRequest.status !== 'ARRIVED' && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowQR(true)}
                                    style={{
                                        width: '100%', padding: '20px', borderRadius: '24px',
                                        background: 'rgba(37, 99, 235, 0.1)',
                                        border: '1px solid rgba(37, 99, 235, 0.2)',
                                        color: '#2563eb', fontWeight: '800', fontSize: '1rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                        cursor: 'pointer', marginTop: '24px', marginBottom: '40px'
                                    }}
                                >
                                    <Copy size={20} />
                                    VERIFY WITH QR CODE
                                </motion.button>
                            )}
                        </div>
                    </>
                )}

            </div>

            <AnimatePresence>
                {showQR && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowQR(false)}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(8px)', zIndex: 9999,
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                        }}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
                                width: '100%', maxWidth: '500px',
                                borderTopLeftRadius: '40px', borderTopRightRadius: '40px', 
                                padding: '12px 24px 40px 24px', textAlign: 'center',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 -20px 50px rgba(0,0,0,0.5)',
                                maxHeight: '92vh', overflowY: 'auto',
                                position: 'relative',
                                margin: 0,
                                display: 'flex', flexDirection: 'column'
                            }}
                        >
                            {/* Handle */}
                            <div style={{ 
                                width: '45px', height: '5px', background: 'rgba(255,255,255,0.2)', 
                                borderRadius: '10px', margin: '0 auto 30px auto' 
                            }}></div>

                            {/* Header with Icon */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
                                <div style={{ width: '32px', height: '32px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShieldCheck size={18} color="#2563eb" />
                                </div>
                                <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '800', margin: 0, letterSpacing: '0.5px' }}>Identity Verification</h3>
                            </div>

                            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '32px' }}>
                                {/* Glow behind QR */}
                                <div style={{
                                    position: 'absolute', inset: '-20px', 
                                    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
                                    zIndex: 0
                                }}></div>
                                
                                <div style={{
                                    position: 'relative', zIndex: 1,
                                    padding: '20px', background: 'white', borderRadius: '32px',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                                    border: '4px solid #fff'
                                }}>
                                    <QRCodeCanvas
                                        value={`${window.location.origin}/verify-request/${lastRequest._id}`}
                                        size={220}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                            </div>
                            
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', marginBottom: '32px', lineHeight: '1.6', maxWidth: '300px', margin: '0 auto 32px auto' }}>
                                Security personnel scan this code to instantly verify your outpass status.
                            </p>

                            <div style={{ 
                                padding: '20px', background: 'rgba(255,255,255,0.03)', 
                                borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)',
                                marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: '600' }}>Reference</span>
                                    <span style={{ color: 'white', fontWeight: '800', fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '1px' }}>#{refId}</span>
                                </div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: '600' }}>Status</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', background: header.color, borderRadius: '50%', boxShadow: `0 0 10px ${header.color}` }}></div>
                                        <span style={{ color: header.color, fontWeight: '900', fontSize: '1rem', letterSpacing: '0.5px' }}>{header.title}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowQR(false)}
                                style={{
                                    width: '100%', padding: '18px', borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '1.1rem',
                                    transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}
                            >
                                Done
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LastRequest;
