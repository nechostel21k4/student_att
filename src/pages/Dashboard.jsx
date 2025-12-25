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
                        borderRadius: '24px', padding: '32px 24px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        minHeight: '200px', marginBottom: '24px', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.5)'
                    }}>
                        {/* Decorative Circles */}
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div style={{ position: 'absolute', bottom: -40, left: -20, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>

                        <div style={{ background: 'rgba(255,255,255,0.2)', width: 'fit-content', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={16} color="white" />
                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>GPS Enabled</span>
                        </div>

                        <div>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '2rem', marginBottom: '8px' }}>check-in</h2>
                            <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '1rem' }}>Mark your daily attendance now</p>
                        </div>

                        <div style={{ position: 'absolute', right: '24px', bottom: '24px', background: 'white', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ScanFace size={24} color="#6366f1" />
                        </div>
                    </div>
                </Link>

                {/* Quick Actions Grid */}
                <div>
                    <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '1.2rem' }}>Quick Actions</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                        gap: '16px'
                    }}>

                        {/* Roomies */}
                        <Link to="/roomies" style={{ textDecoration: 'none' }}>
                            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.2)' }}>
                                    <Users size={24} color="#38bdf8" />
                                </div>
                                <span style={{ color: 'white', fontWeight: '600' }}>Roomies</span>
                            </div>
                        </Link>

                        {/* Leave */}
                        <Link to="/leave" style={{ textDecoration: 'none' }}>
                            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.2)' }}>
                                    <FileText size={24} color="#a855f7" />
                                </div>
                                <span style={{ color: 'white', fontWeight: '600' }}>Apply Leave</span>
                            </div>
                        </Link>

                        {/* History */}
                        <Link to="/history" style={{ textDecoration: 'none' }}>
                            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.2)' }}>
                                    <Clock size={24} color="#eab308" />
                                </div>
                                <span style={{ color: 'white', fontWeight: '600' }}>History</span>
                            </div>
                        </Link>

                        {/* Incharge */}
                        <Link to="/incharge" style={{ textDecoration: 'none' }}>
                            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.2)' }}>
                                    <Shield size={24} color="#22c55e" />
                                </div>
                                <span style={{ color: 'white', fontWeight: '600' }}>Incharges</span>
                            </div>
                        </Link>

                        {/* Complaint */}
                        <Link to="/complaint" style={{ textDecoration: 'none' }}>
                            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)' }}>
                                    <AlertCircle size={24} color="#ef4444" />
                                </div>
                                <span style={{ color: 'white', fontWeight: '600' }}>Complaint Box</span>
                            </div>
                        </Link>

                        {/* Last Request */}
                        <Link to="/last-request" style={{ textDecoration: 'none' }}>
                            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.2)' }}>
                                    <Activity size={24} color="#14b8a6" />
                                </div>
                                <span style={{ color: 'white', fontWeight: '600' }}>Last Request</span>
                            </div>
                        </Link>



                    </div>
                </div>



            </div>

            {/* Spacer for mobile bottom nav */}
            <div style={{ height: '80px' }}></div>
        </div>
    );
};

export default Dashboard;
