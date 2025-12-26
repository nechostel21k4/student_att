import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { User, MapPin, Camera, LogOut, Activity, CheckCircle, Home, Clock, Settings, ScanFace, PanelLeft, ArrowRight, FileText, Users, Shield, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');
    const [studentName, setStudentName] = useState('');
    const [activeTab, setActiveTab] = useState('home'); // home, history, profile

    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('studentToken');
        const sid = localStorage.getItem('studentId');

        if (!token) { navigate('/'); return; }

        // Always sync profile to get latest face registration status
        import('axios').then(axios => {
            axios.default.get(`${API_BASE_URL}/student/${sid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
                if (res.data.isExist) {
                    const sname = res.data.hosteler.name;
                    const regStatus = res.data.hosteler.isRegistered || false; // Backend should return this inside hosteler or we need to check registration-status endpoint

                    localStorage.setItem('studentName', sname);
                    localStorage.setItem('isRegistered', String(regStatus)); // Store as string 'true'/'false'

                    setStudentName(sname);
                    setIsRegistered(regStatus);
                } else {
                    // Fallback to local storage if API fails (though API fail usually goes to catch)
                    setStudentName(localStorage.getItem('studentName'));
                    setIsRegistered(localStorage.getItem('isRegistered') === 'true');
                }
            }).catch(err => {
                console.error("Profile sync failed", err);
                if (err.response && err.response.status === 401) {
                    // Token expired or invalid
                    localStorage.clear();
                    navigate('/');
                } else {
                    // Other errors, fallback to local storage
                    setStudentName(localStorage.getItem('studentName'));
                    setIsRegistered(localStorage.getItem('isRegistered') === 'true');
                }
            });
        });

        setStudentId(sid);
    }, [navigate]);

    const { isDesktop } = useOutletContext();



    // Sidebar Items
    const NavItem = ({ icon: Icon, label, active, onClick, danger }) => (
        <div
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px', borderRadius: '12px', cursor: 'pointer',
                background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: danger ? 'var(--error)' : (active ? 'var(--primary)' : 'var(--text-muted)'),
                transition: 'all 0.3s ease',
                justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
                marginBottom: '8px'
            }}
        >
            <Icon size={24} />
            {isSidebarExpanded && <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>}
        </div>
    );

    return (
        <div style={{
            flex: 1, overflowY: 'auto',
            width: '100%',
            maxWidth: '1200px', // Allow more width for grid
            margin: '0 auto',
            padding: '24px'
        }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Welcome,</p>
                    <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: '700', lineHeight: 1.2 }}>
                        {studentName ? studentName.split(' ')[0] : 'Student'}
                    </h1>
                </div>

            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                {/* Main Action Card */}
                <Link to="/attendance" style={{ textDecoration: 'none' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        borderRadius: '24px', padding: '24px',
                        display: 'flex', flexDirection: 'column',
                        minHeight: '180px', marginBottom: '24px', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.5)'
                    }}>
                        {/* Decorative Circles */}
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div style={{ position: 'absolute', bottom: -40, left: -20, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>

                        <div style={{ marginBottom: 'auto', position: 'relative', zIndex: 1 }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', width: 'fit-content', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={16} color="white" />
                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>GPS Enabled</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1, marginTop: '20px' }}>
                            <div>
                                <h2 style={{ color: 'white', margin: 0, fontSize: '2rem', marginBottom: '8px', fontWeight: '800' }}>check-in</h2>
                                <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '1rem', maxWidth: '80%' }}>Mark your daily attendance now</p>
                            </div>

                            <div style={{ background: 'white', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <ScanFace size={24} color="#6366f1" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Quick Actions Grid */}
                <div>
                    <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '1.2rem' }}>Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { to: '/roomies', icon: Users, label: 'Roomies', color: '#38bdf8' },
                            { to: '/leave', icon: FileText, label: 'Apply Leave', color: '#a855f7' },
                            { to: '/history', icon: Clock, label: 'History', color: '#eab308' },
                            { to: '/incharge', icon: Shield, label: 'Incharges', color: '#22c55e' },
                            { to: '/complaint', icon: AlertCircle, label: 'Complaint Box', color: '#ef4444' },
                            { to: '/last-request', icon: Activity, label: 'Last Request', color: '#14b8a6' }
                        ].map((action, index) => (
                            <Link key={index} to={action.to} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    padding: '16px', borderRadius: '16px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        borderRadius: '10px',
                                        background: `${action.color}20`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <action.icon size={20} color={action.color} />
                                    </div>
                                    <span style={{ color: 'white', fontWeight: '500', fontSize: '1rem', flex: 1 }}>
                                        {action.label}
                                    </span>
                                    <ArrowRight size={18} color="rgba(255,255,255,0.3)" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>



            </div>

            {/* Spacer for mobile bottom nav */}
            <div style={{ height: '80px' }}></div>
        </div>
    );
};

export default Dashboard;
