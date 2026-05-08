
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Megaphone, Calendar, User, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

const AnnouncementList = ({ hostelId }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const context = useOutletContext();
    const isDesktop = context?.isDesktop ?? true;

    useEffect(() => {
        if (!hostelId) return;

        const fetchAnnouncements = async () => {
            try {
                const token = localStorage.getItem('studentToken');
                const response = await axios.get(`${API_BASE_URL}/announcement/get?hostelId=${hostelId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setAnnouncements(response.data);
            } catch (error) {
                console.error("Error fetching announcements:", error);
                toast.error("Failed to load announcements");
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, [hostelId]);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '14px' }}></div>
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '8px' }}></div>
                            <div className="skeleton" style={{ width: '40%', height: '14px' }}></div>
                        </div>
                    </div>
                    <div className="skeleton" style={{ width: '100%', height: '60px', borderRadius: '8px' }}></div>
                </div>
            ))}
        </div>
    );

    if (announcements.length === 0) {
        return (
            <div className="glass-card text-center" style={{ padding: '40px' }}>
                <Megaphone size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <h3>No Recent Announcements</h3>
                <p style={{ color: 'var(--text-muted)' }}>Stay tuned for updates!</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {announcements.map((item) => (
                <div key={item._id} className="glass-card" style={{
                    position: 'relative',
                    padding: isDesktop ? '24px' : '16px',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                    {/* Header */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        marginBottom: '20px',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: isDesktop ? '48px' : '40px',
                            height: isDesktop ? '48px' : '40px',
                            borderRadius: '12px',
                            background: '#4f46e5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: isDesktop ? '20px' : '16px',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>
                            {item.author ? item.author.charAt(0).toUpperCase() : 'A'}
                        </div>
                        
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: isDesktop ? '1.1rem' : '1rem', fontWeight: '600', color: '#fff' }}>
                                    {item.title}
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                        {item.author || 'Administrator'}
                                    </span>
                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginTop: '4px' }}>
                                {item.type === 'ADMIN' && (
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.6rem',
                                        fontWeight: '700',
                                        background: '#ef4444',
                                        color: 'white',
                                        letterSpacing: '0.5px'
                                    }}>
                                        ADMIN
                                    </span>
                                )}
                                {item.hostelId && (
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.6rem',
                                        fontWeight: '700',
                                        background: '#f59e0b',
                                        color: 'white',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {item.hostelId}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <p style={{
                        color: 'rgba(255,255,255,0.85)',
                        lineHeight: '1.6',
                        fontSize: isDesktop ? '1rem' : '14px',
                        marginBottom: item.imageUrl ? '16px' : '0',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {item.description}
                    </p>

                    {/* Image */}
                    {item.imageUrl && (
                        <div
                            onClick={() => setSelectedImage(item.imageUrl)}
                            style={{
                                width: '100%',
                                minHeight: '180px',
                                maxHeight: isDesktop ? '400px' : '300px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                position: 'relative',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <img
                                src={item.imageUrl}
                                alt="Attachment"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    transition: 'transform 0.3s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            />
                        </div>
                    )}
                </div>
            ))}

            {selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        zIndex: 1000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '20px',
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'absolute',
                                top: '-40px',
                                right: '-10px',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '8px'
                            }}
                        >
                            <span style={{ fontSize: '24px' }}>✕</span>
                        </button>
                        <img
                            src={selectedImage}
                            alt="Preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '85vh',
                                borderRadius: '8px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementList;
