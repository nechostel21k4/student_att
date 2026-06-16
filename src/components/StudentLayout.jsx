import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import DesktopSidebar from './Navigation/DesktopSidebar';
import MobileNav from './Navigation/MobileNav';

import { getToken } from '../services/studentStorage';

const StudentLayout = () => {
    const navigate = useNavigate();
    const { clearSession } = useStudent();

    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const token = getToken();
    useEffect(() => {
        if (!token) { navigate('/', { replace: true }); }
    }, [token, navigate]);

    useEffect(() => {
        const handleSessionExpired = () => {
            clearSession();
            navigate('/', { replace: true });
        };
        window.addEventListener('app:session-expired', handleSessionExpired);
        return () => window.removeEventListener('app:session-expired', handleSessionExpired);
    }, [clearSession, navigate]);

    if (!token) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, width: '100%', height: '100dvh',
            display: 'flex', overflow: 'hidden', background: '#04070e',
            fontFamily: "'Inter', 'Poppins', sans-serif"
        }}>
            {/* Background Glow */}
            <div style={{
                position: 'absolute', bottom: '-15vh', left: '50%',
                transform: 'translateX(-50%)', width: '100vw', height: '40vh',
                background: 'rgba(59, 130, 246, 0.4)', filter: 'blur(120px)',
                borderRadius: '50% 50% 0 0', zIndex: 0, pointerEvents: 'none'
            }} />

            {/* Desktop Navigation */}
            {isDesktop && <DesktopSidebar />}

            {/* --- MAIN PAGE CONTENT --- */}
            <div
                className="main-page-container"
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100dvh',
                    overflow: 'hidden',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {/* Mobile Header */}
                {!isDesktop && (
                    <div style={{
                        height: 'calc(60px + env(safe-area-inset-top))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'env(safe-area-inset-top) 16px 0 16px',
                        backgroundColor: 'rgba(4, 7, 14, 0.8)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        zIndex: 10,
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img 
                                src="/HostelX.png" 
                                alt="HostelX Logo" 
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    objectFit: 'contain'
                                }}
                            />
                            <span style={{
                                fontSize: '20px',
                                fontWeight: '700',
                                color: 'white',
                                letterSpacing: '-0.02em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                HostelX
                                <span style={{ color: '#3b82f6', fontWeight: '500', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Student</span>
                            </span>
                        </div>
                    </div>
                )}
                <div 
                    className="content-viewport" 
                    style={{ 
                        flex: 1, 
                        overflowY: 'auto',
                        paddingBottom: !isDesktop ? '80px' : '0' // Extra padding on mobile so content isn't hidden by MobileNav
                    }}
                >
                    <Outlet context={{ isDesktop }} />
                </div>

                {/* Mobile Navigation */}
                {!isDesktop && <MobileNav />}
            </div>
        </div>
    );
};

export default StudentLayout;
