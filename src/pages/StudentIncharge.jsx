import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Phone, Mail, Shield, Contact } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useStudent } from '../context/StudentContext';

const StudentIncharge = () => {
    const { profile } = useStudent();
    const navigate = useNavigate();
    const [incharges, setIncharges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentHostelId, setStudentHostelId] = useState(null);

    const token = localStorage.getItem('studentToken');
    const sid = localStorage.getItem('studentId');

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }

        if (profile && profile.hostelId) {
            setStudentHostelId(profile.hostelId);
            fetchIncharges(profile.hostelId);
        } else if (profile && !profile.hostelId) {
            setLoading(false);
        }
    }, [navigate, profile]);

    const fetchIncharges = async (hId) => {
        try {
            const inchargeRes = await axios.get(`${API_BASE_URL}/incharge/getIncharges/${hId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (inchargeRes.data) {
                const data = Array.isArray(inchargeRes.data) ? inchargeRes.data : (inchargeRes.data.incharges || []);
                setIncharges(data);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
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
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: 'white' }}>Incharges</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                        Contact details for {studentHostelId || 'Hostel'} details
                    </p>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div className="skeleton" style={{ width: '50px', height: '50px', borderRadius: '50%' }}></div>
                                    <div>
                                        <div className="skeleton" style={{ width: '120px', height: '20px', marginBottom: '6px' }}></div>
                                        <div className="skeleton" style={{ width: '80px', height: '16px' }}></div>
                                    </div>
                                </div>
                                <div className="skeleton" style={{ height: '50px', borderRadius: '12px', width: '100%' }}></div>
                            </div>
                        ))}
                    </div>
                ) : incharges.length === 0 ? (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Contact size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No Incharges found for your hostel.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {incharges.map((inc, index) => (
                            <div key={index} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '50px', height: '50px', borderRadius: '50%',
                                        background: 'var(--primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                    }}>
                                        <Shield size={24} color="white" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: 'bold' }}>{inc.name}</h3>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{inc.designation || 'Incharge'}</span>
                                    </div>
                                </div>

                                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Phone size={20} color="var(--primary)" />
                                        <span style={{ color: 'white', fontWeight: '500' }}>{inc.phoneNo}</span>
                                    </div>
                                    <a
                                        href={`tel:${inc.phoneNo}`}
                                        style={{
                                            padding: '8px 16px', borderRadius: '8px',
                                            background: 'var(--primary)', color: 'white', textDecoration: 'none',
                                            fontWeight: 'bold', fontSize: '0.9rem'
                                        }}
                                    >
                                        Call
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentIncharge;
