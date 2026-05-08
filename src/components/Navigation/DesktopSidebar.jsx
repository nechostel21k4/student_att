import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { desktopNavItems } from './NavConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronRight, ChevronLeft } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import { useStudent } from '../../context/StudentContext';

const DesktopSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearSession } = useStudent();
    
    const [isExpanded, setIsExpanded] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogout = () => {
        setIsLogoutModalOpen(false);
        clearSession();
        navigate('/');
    };

    return (
        <>
            <motion.div 
                animate={{ width: isExpanded ? 260 : 80 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                style={{
                    height: '100dvh',
                    backgroundColor: 'rgba(10, 15, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 100,
                    overflow: 'hidden'
                }}
            >
                {/* Logo Area */}
                <div style={{
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    gap: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    height: '80px',
                    boxSizing: 'border-box'
                }}>
                    <img 
                        src="/HostelX.png" 
                        alt="HostelX Logo" 
                        style={{
                            width: '32px',
                            height: '32px',
                            objectFit: 'contain',
                            flexShrink: 0
                        }}
                    />
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: 'white',
                                    whiteSpace: 'nowrap',
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: '-0.02em'
                                }}
                            >
                                HostelX
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Toggle Button */}
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        position: 'absolute',
                        right: '-12px',
                        top: '34px',
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#1e293b',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.1)',
                        zIndex: 10,
                        color: 'white'
                    }}
                >
                    {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </div>

                {/* Navigation Links */}
                <div style={{
                    flex: 1,
                    padding: '24px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}>
                    {desktopNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        
                        return (
                            <div
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.3s ease',
                                    color: isActive ? '#fff' : '#94a3b8',
                                    justifyContent: isExpanded ? 'flex-start' : 'center'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="desktopNavIndicator"
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                            borderRadius: '12px',
                                            zIndex: -1,
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            boxShadow: 'inset 0 0 12px rgba(59, 130, 246, 0.1)'
                                        }}
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                    />
                                )}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '24px', flexShrink: 0
                                }}>
                                    <Icon 
                                        size={22} 
                                        color={isActive ? '#60a5fa' : '#64748b'} 
                                        strokeWidth={isActive ? 2.5 : 2}
                                        style={{
                                            filter: isActive ? 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.5))' : 'none'
                                        }}
                                    />
                                </div>
                                
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            style={{
                                                fontSize: '15px',
                                                fontWeight: isActive ? 600 : 500,
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {/* Logout Button */}
                <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div
                        onClick={() => setIsLogoutModalOpen(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '12px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            color: '#ef4444',
                            justifyContent: isExpanded ? 'flex-start' : 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '24px', flexShrink: 0
                        }}>
                            <LogOut size={22} strokeWidth={2} />
                        </div>
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    style={{
                                        fontSize: '15px',
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Sign Out
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Logout Modal */}
            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
                title="Sign Out"
                message="Are you sure you want to end your session? You will need to sign in again to access your dashboard."
                confirmText="Sign Out"
                type="logout"
            />
        </>
    );
};

export default DesktopSidebar;
