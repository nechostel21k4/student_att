
import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import AnnouncementList from '../components/AnnouncementList';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStudent } from '../context/StudentContext';
import { getToken, getStudentId } from '../services/studentStorage';

const StudentAnnouncements = () => {
    const { profile } = useStudent();
    const navigate = useNavigate();
    const { isDesktop } = useOutletContext();
    const [hostelId, setHostelId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentProfile = async () => {
            try {
                const token = getToken();
                const sid = getStudentId();

                if (!token || !sid) {
                    navigate('/');
                    return;
                }

                if (profile && profile.hostelId) {
                    setHostelId(profile.hostelId);
                } else if (profile && !profile.hostelId) {
                    toast.error("Student not found");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                if (profile) setLoading(false);
            }
        };

        fetchStudentProfile();
    }, [navigate, profile]);

    return (
        <div style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: isDesktop ? '24px' : '16px',
            paddingBottom: '100px' // Space for bottom nav on mobile
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>Announcements</h1>
            </div>

            {loading ? (
                <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '24px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '24px' }}></div>
                </div>
            ) : (
                hostelId ? <AnnouncementList hostelId={hostelId} /> : <div className="text-center">Hostel ID not found</div>
            )}
        </div>
    );
};

export default StudentAnnouncements;
