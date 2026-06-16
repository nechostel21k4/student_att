import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, BookOpen, Clock, AlertCircle, X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';
import { useStudent } from '../context/StudentContext';
import { getToken, getStudentId } from '../services/studentStorage';

const StudentRoomies = () => {
    const { profile } = useStudent();
    const navigate = useNavigate();
    const [roomies, setRoomies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myRoomNo, setMyRoomNo] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const token = getToken();
    const sid = getStudentId();

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        if (profile && profile.hostelId && profile.roomNo) {
            fetchRoomies();
        } else if (profile && (!profile.hostelId || !profile.roomNo)) {
            setLoading(false);
        }
    }, [navigate, profile]);

    const fetchRoomies = async () => {
        try {
            const { hostelId, roomNo } = profile;
            setMyRoomNo(roomNo);

            if (hostelId && roomNo) {
                    const roomiesRes = await axios.post(`${API_BASE_URL}/student/getRoomies`, {
                        hostelId, roomNo
                    }, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (roomiesRes.data) {
                        const { hostlers, images } = roomiesRes.data;
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
        } catch (err) {
            console.error("Failed to fetch roomies", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (index) => {
        setSelectedIndex(index);
        setShowModal(true);
    };

    const handleNext = () => {
        setSelectedIndex((prev) => (prev + 1) % roomies.length);
    };

    const handlePrev = () => {
        setSelectedIndex((prev) => (prev - 1 + roomies.length) % roomies.length);
    };


    const selectedRoomie = selectedIndex !== null ? roomies[selectedIndex] : null;

    return (
        <div style={{ padding: '24px 16px 100px 16px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '4px', letterSpacing: '-0.5px' }}>My Roomies</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: '500' }}>
                    <span style={{ color: '#3b82f6' }}>Room {myRoomNo || 'N/A'}</span>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span>{roomies.length} Roommates</span>
                </p>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ aspectRatio: '1/1.3', borderRadius: '24px' }}></div>
                    ))}
                </div>
            ) : roomies.length === 0 ? (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '24px',
                    padding: '60px 40px',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    <Users size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '20px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>No roommates found in this room.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {roomies.map((roomie, index) => (
                        <motion.div
                            key={index}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleOpenModal(index)}
                            style={{
                                position: 'relative',
                                aspectRatio: '1/1.3',
                                background: '#1e293b',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                                cursor: 'pointer'
                            }}
                        >
                            {roomie.imageURL ? (
                                <img
                                    src={roomie.imageURL}
                                    alt={roomie.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + roomie.name + '&background=random'; }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: '#2563eb', color: 'rgba(255,255,255,0.8)'
                                }}>
                                    <User size={48} />
                                </div>
                            )}
                            
                            {/* Overlay Gradient */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.4) 30%, transparent 60%)'
                            }} />

                            {/* Name Overlay */}
                            <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
                                <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: '700', lineHeight: '1.2' }}>
                                    {roomie.name?.split(' ')[0]}<br/>
                                    {roomie.name?.split(' ').slice(1).join(' ')}
                                </h3>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Bottom Drawer Modal */}
            <AnimatePresence>
                {showModal && selectedRoomie && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            style={{
                                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000
                            }}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                position: 'fixed', bottom: 0, left: 0, right: 0,
                                background: '#0f172a',
                                borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
                                padding: '32px 24px 48px 24px',
                                zIndex: 1001,
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 -20px 40px rgba(0,0,0,0.4)',
                                maxHeight: '90vh', overflowY: 'auto'
                            }}
                        >
                            {/* Close Button */}
                            <button 
                                onClick={() => setShowModal(false)}
                                style={{
                                    position: 'absolute', top: '20px', right: '20px',
                                    background: 'rgba(255,255,255,0.05)', border: 'none',
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', cursor: 'pointer'
                                }}
                            >
                                <X size={20} />
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
                                {/* Big Image */}
                                <div style={{
                                    width: '180px', height: '180px', borderRadius: '32px', overflow: 'hidden',
                                    boxShadow: '0 12px 30px rgba(0,0,0,0.5)', border: '4px solid rgba(255,255,255,0.03)'
                                }}>
                                    {selectedRoomie.imageURL ? (
                                        <img
                                            src={selectedRoomie.imageURL}
                                            alt={selectedRoomie.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: '#1e3a8a', color: 'white'
                                        }}>
                                            <User size={64} />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div style={{ textAlign: 'center' }}>
                                    <h2 style={{ margin: '0 0 4px 0', fontSize: '1.8rem', color: 'white', fontWeight: '800' }}>{selectedRoomie.name}</h2>
                                    <p style={{ margin: '0 0 16px 0', color: '#2563eb', fontSize: '1.1rem', fontWeight: '600' }}>{selectedRoomie.rollNo}</p>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Year</p>
                                            <p style={{ margin: 0, color: 'white', fontWeight: '600' }}>{selectedRoomie.year}</p>
                                        </div>
                                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Branch</p>
                                            <p style={{ margin: 0, color: 'white', fontWeight: '600' }}>{selectedRoomie.branch}</p>
                                        </div>
                                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Status</p>
                                            <p style={{ margin: 0, color: '#22c55e', fontWeight: '600' }}>HOSTEL</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Arrows - Absolute Positioned on Sides */}
                                <button 
                                    onClick={handlePrev}
                                    style={{
                                        position: 'absolute', top: '50%', left: '8px', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        width: '44px', height: '44px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', zIndex: 10, color: 'white'
                                    }}
                                >
                                    <ChevronLeft size={28} color="white" strokeWidth={3} />
                                </button>
                                <button 
                                    onClick={handleNext}
                                    style={{
                                        position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        width: '44px', height: '44px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', zIndex: 10, color: 'white'
                                    }}
                                >
                                    <ChevronRight size={28} color="white" strokeWidth={3} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentRoomies;

