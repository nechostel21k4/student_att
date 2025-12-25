import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

const StudentRoomies = () => {
    const navigate = useNavigate();
    const [roomies, setRoomies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myRoomNo, setMyRoomNo] = useState(null);

    const token = localStorage.getItem('studentToken');
    const sid = localStorage.getItem('studentId');

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        fetchRoomies();
    }, [navigate]);

    const fetchRoomies = async () => {
        try {
            // 1. Fetch My Profile to get RoomNo & HostelId
            const profileRes = await axios.get(`${API_BASE_URL}/student/${sid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (profileRes.data.isExist) {
                const { hostelId, roomNo } = profileRes.data.hosteler;
                setMyRoomNo(roomNo);

                if (hostelId && roomNo) {
                    // 2. Fetch Roomies
                    const roomiesRes = await axios.post(`${API_BASE_URL}/student/getRoomies`, {
                        hostelId, roomNo
                    }, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (roomiesRes.data) {
                        const { hostlers, images } = roomiesRes.data;

                        // Merge images
                        const merged = hostlers.map(student => {
                            const imgObj = images.find(img => img.username === student.rollNo);
                            return {
                                ...student,
                                imageURL: imgObj ? imgObj.imagePath : null
                            };
                        });
                        setRoomies(merged);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch roomies", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '24px 24px 100px 24px' }}>
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ width: '150px', height: '16px' }}></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%' }}></div>
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '8px' }}></div>
                                <div className="skeleton" style={{ width: '40%', height: '16px', marginBottom: '8px' }}></div>
                                <div className="skeleton" style={{ width: '80%', height: '14px' }}></div>
                            </div>
                        </div>
                    ))}
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
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: 'white' }}>My Roomies</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                        Room {myRoomNo || 'N/A'} • {roomies.length} Roommates
                    </p>
                </div>

                {roomies.length === 0 ? (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No roommates found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {roomies.map((roomie, index) => (
                            <div key={index} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                {/* Avatar */}
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '50%',
                                    overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)',
                                    background: '#1e293b'
                                }}>
                                    {roomie.imageURL ? (
                                        <img src={roomie.imageURL} alt={roomie.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                            <Users size={24} />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'white', fontWeight: 'bold' }}>{roomie.name}</h3>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{roomie.rollNo}</p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                                            <BookOpen size={14} />
                                            <span>{roomie.year} Year, {roomie.branch}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                                            <Clock size={14} />
                                            <span>{roomie.currentStatus || 'Unknown Status'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentRoomies;
