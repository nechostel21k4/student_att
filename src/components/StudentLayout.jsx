
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, PanelLeft, ArrowRight, FileText, Clock, Shield, AlertCircle, Users, Menu, X, Activity } from 'lucide-react';

const StudentLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Sidebar State
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auth Check
    useEffect(() => {
        const token = localStorage.getItem('studentToken');
        if (!token) { navigate('/'); }
    }, [navigate]);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const NavItem = ({ icon: Icon, label, path, danger, onClick }) => {
        const isActive = location.pathname === path;

        // Mobile Item Style
        if (!isDesktop) {
            return (
                <div
                    onClick={() => {
                        if (onClick) onClick();
                        if (danger) { localStorage.clear(); navigate('/'); }
                        else { navigate(path); }
                    }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        padding: '16px', borderRadius: '12px', cursor: 'pointer',
                        background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        color: danger ? 'var(--error)' : (isActive ? 'var(--primary)' : 'var(--text-muted)'),
                        transition: 'all 0.3s ease',
                        marginBottom: '8px'
                    }}
                >
                    <Icon size={24} />
                    <span style={{ fontWeight: 600 }}>{label}</span>
                </div>
            );
        }

        // Desktop Item Style
        return (
            <div
                onClick={() => {
                    if (onClick) onClick();
                    if (danger) { localStorage.clear(); navigate('/'); }
                    else { navigate(path); }
                }}
                style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', borderRadius: '10px', cursor: 'pointer',
                    background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: danger ? 'var(--error)' : (isActive ? 'var(--primary)' : 'var(--text-muted)'),
                    transition: 'all 0.3s ease',
                    justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
                    marginBottom: '4px'
                }}
            >
                <Icon size={20} />
                {isSidebarExpanded && <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>}
            </div>
        );
    };

    return (
        <div style={{
            display: 'flex', height: '100vh', width: '100%',
            overflow: 'hidden', background: 'var(--bg-gradient)'
        }}>

            {/* --- DESKTOP SIDEBAR (Visible only on Desktop) --- */}
            {isDesktop && (
                <div className="desktop-sidebar" style={{ width: isSidebarExpanded ? '220px' : '70px', padding: '16px 0', transition: 'width 0.3s ease', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: isSidebarExpanded ? 'space-between' : 'center', alignItems: 'center', padding: '0 12px' }}>
                        {isSidebarExpanded && (
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'white' }}>
                                N<span style={{ color: 'var(--primary)' }}>EC</span>
                            </h2>
                        )}
                        <button
                            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            <PanelLeft size={18} />
                        </button>
                    </div>

                    <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <NavItem icon={Home} label="Home" path="/dashboard" />
                        <NavItem icon={Users} label="Roomies" path="/roomies" />
                        <NavItem icon={FileText} label="Leave" path="/leave" />
                        <NavItem icon={Activity} label="Last Request" path="/last-request" />
                        <NavItem icon={Clock} label="History" path="/history" />
                        <NavItem icon={Shield} label="Incharge" path="/incharge" />
                        <NavItem icon={AlertCircle} label="Complaint" path="/complaint" />
                        <NavItem icon={User} label="Profile" path="/profile" />
                    </nav>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', paddingLeft: '12px', paddingRight: '12px' }}>
                        <NavItem icon={LogOut} label="Logout" danger />
                    </div>
                </div>
            )}

            {/* --- MOBILE HEADER & HAMBURGER (Visible only on Mobile) --- */}
            {!isDesktop && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                    background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
                    padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'white' }}>
                        N<span style={{ color: 'var(--primary)' }}>EC</span>
                    </h2>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        <Menu size={28} />
                    </button>
                </div>
            )}

            {/* --- MOBILE DRAWER OVERLAY --- */}
            {!isDesktop && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.5)',
                    opacity: isMobileMenuOpen ? 1 : 0,
                    pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease'
                }} onClick={() => setIsMobileMenuOpen(false)}>

                    {/* DRAWER CONTENT */}
                    <div style={{
                        position: 'absolute', top: 0, right: 0, bottom: 0, width: '280px',
                        background: '#0f172a', borderLeft: '1px solid rgba(255,255,255,0.1)',
                        transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex', flexDirection: 'column', padding: '24px'
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                            <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}>
                                <X size={28} />
                            </button>
                        </div>

                        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <NavItem icon={Home} label="Home" path="/dashboard" />
                            <NavItem icon={Users} label="Roomies" path="/roomies" />
                            <NavItem icon={FileText} label="Leave" path="/leave" />
                            <NavItem icon={Activity} label="Last Request" path="/last-request" />
                            <NavItem icon={Clock} label="History" path="/history" />
                            <NavItem icon={Shield} label="Incharge" path="/incharge" />
                            <NavItem icon={AlertCircle} label="Complaint" path="/complaint" />
                            <NavItem icon={User} label="Profile" path="/profile" />
                        </nav>

                        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                            <NavItem icon={LogOut} label="Logout" danger />
                        </div>
                    </div>
                </div>
            )}


            {/* --- MAIN CONTENT AREA --- */}
            <div style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                height: '100vh', overflow: 'hidden',
                marginLeft: isDesktop ? (isSidebarExpanded ? '220px' : '70px') : '0',
                transition: 'margin-left 0.3s ease',
                position: 'relative'
            }}>
                <div style={{ flex: 1, overflowY: 'auto', paddingTop: !isDesktop ? '70px' : '0' }}>
                    <Outlet context={{ isSidebarExpanded, isDesktop }} />
                </div>
            </div>
        </div>
    );
};

export default StudentLayout;
