import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, CheckCircle, User, Phone, Mail, Hash, BookOpen, Calendar, Users, LogOut, Camera, Edit2, Loader } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const StudentProfile = () => {
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    // Image Upload State
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [imageKey, setImageKey] = useState(0); // To force refresh image
    const fileInputRef = useRef(null);

    const token = localStorage.getItem('studentToken');
    const sid = localStorage.getItem('studentId');


    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        fetchProfile();
        fetchProfileImage();
    }, [navigate, imageKey]); // Re-fetch image when key changes

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/student/${sid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.isExist) {
                setStudent(res.data.hosteler);
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfileImage = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/upload/getImage/${sid}`);
            if (res.data && res.data.imageExist) {
                setProfileImageUrl(res.data.imagePath);
            } else {
                setProfileImageUrl(null); // Fallback to initial
            }
        } catch (err) {
            console.error("Failed to fetch profile image", err);
        }
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate type
        if (!file.type.match('image/jpeg') && !file.type.match('image/jpg')) {
            alert("Only .jpg / .jpeg images are allowed");
            return;
        }

        const formData = new FormData();
        formData.append("image", file); // Must match backend expectation 'image'

        setIsImageUploading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/upload/uploadimage/${sid}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data && res.data.imageUploaded) {
                // Log the action (as per requested snippet)
                try {
                    await axios.post(`${API_BASE_URL}/logs/add-log`, {
                        date: new Date(),
                        userId: sid,
                        username: student?.name || sid,
                        action: `Uploaded profile image`
                    });
                } catch (logErr) {
                    console.error("Logging failed", logErr);
                }

                alert("Image Uploaded Successfully");
                setImageKey(prev => prev + 1); // Refresh image
            } else {
                alert("Image Upload Failed");
            }
        } catch (err) {
            console.error("Upload error", err);
            alert("Error uploading image");
        } finally {
            setIsImageUploading(false);
        }
    };

    if (loading) return (
        <div style={{
            width: '100%', display: 'flex', justifyContent: 'center', padding: '24px 24px 100px 24px'
        }}>
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '150px', height: '32px' }}></div>
                    <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '20px' }}></div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', marginBottom: '24px' }}>
                    <div className="skeleton" style={{ width: '120px', height: '120px', borderRadius: '50%', marginBottom: '16px' }}></div>
                    <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ width: '100px', height: '20px', borderRadius: '20px' }}></div>
                </div>

                <div className="glass-card" style={{ padding: '0 16px', marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0' }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                <div className="skeleton" style={{ width: '30%', height: '16px' }}></div>
                                <div className="skeleton" style={{ width: '40%', height: '16px' }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
    if (!student) return <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>Student not found</div>;

    const ProfileItem = ({ label, value }) => (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', width: '40%' }}>{label}</div>
            <div style={{ color: 'white', fontWeight: '500', width: '60%', textAlign: 'right', wordBreak: 'break-word' }}>{value || 'N/A'}</div>
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
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: 'white' }}>My Profile</h1>

                    {/* Status Chip */}
                    <div style={{
                        padding: '6px 12px', borderRadius: '20px',
                        background: student.currentStatus === 'HOSTEL' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: student.currentStatus === 'HOSTEL' ? '#22c55e' : '#eab308',
                        fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></div>
                        {student.currentStatus || 'UNKNOWN'}
                    </div>
                </div>

                {/* Main Profile Card with Image Upload */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', position: 'relative', overflow: 'hidden', marginBottom: '24px' }}>

                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '50%',
                            background: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)',
                            border: '4px solid rgba(255,255,255,0.1)',
                            marginBottom: '16px', overflow: 'hidden'
                        }}>
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white' }}>
                                    {student.name ? student.name.charAt(0) : 'S'}
                                </span>
                            )}
                        </div>

                        {/* Edit Button */}
                        <button
                            onClick={() => fileInputRef.current.click()}
                            disabled={isImageUploading}
                            style={{
                                position: 'absolute', bottom: '16px', right: '0',
                                background: 'white', border: 'none', borderRadius: '50%',
                                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            {isImageUploading ? <Loader size={16} className="spin" color="black" /> : <Edit2 size={16} color="black" />}
                        </button>
                        <input
                            type="file"
                            accept=".jpg,.jpeg"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </div>

                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>{student.name}</h2>
                        <span style={{
                            background: 'rgba(255,255,255,0.1)', color: 'white',
                            padding: '4px 12px', borderRadius: '100px', fontSize: '0.9rem', fontWeight: '500'
                        }}>
                            {student.rollNo}
                        </span>
                    </div>
                </div>

                {/* Requested Details List - Exact Order */}
                <div className="glass-card" style={{ padding: '0 16px', marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
                    {/* The list requested: Name, RollNo, HostelID, RoomNo, College, Year, Branch, Gender, PhoneNo, Email, ParentName, ParentPhone */}
                    {/* Name/RollNo are already in header, but user listed them in the grid in their snippet. I will add them here too or skip if redundant. Snippet had them. */}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0' }}>
                        {/* Row 1 */}
                        <ProfileItem label="Name" value={student.name} />
                        <ProfileItem label="Roll Number" value={student.rollNo} />

                        {/* Row 2 */}
                        <ProfileItem label="Hostel ID" value={student.hostelId} />
                        <ProfileItem label="Room No" value={student.roomNo} />

                        {/* Row 3 */}
                        <ProfileItem label="College" value={student.college} />
                        <ProfileItem label="Year" value={student.year} />

                        {/* Row 4 */}
                        <ProfileItem label="Branch" value={student.branch} />
                        <ProfileItem label="Gender" value={student.gender} />

                        {/* Row 5 */}
                        <ProfileItem label="Phone No" value={student.phoneNo} />
                        <ProfileItem label="Email" value={student.email} />

                        {/* Row 6 */}
                        <ProfileItem label="Parent Name" value={student.parentName} />
                        <ProfileItem label="Parent Phone" value={student.parentPhoneNo} />
                    </div>
                </div>

                {/* Face Registration Status (Kept as extra utility) */}
                <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '10px', background: student.isRegistered ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 179, 8, 0.1)', borderRadius: '12px' }}>
                            {student.isRegistered ? <CheckCircle size={24} color="var(--success)" /> : <User size={24} color="#eab308" />}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Face Registration</p>
                            <p style={{ fontSize: '1.1rem', color: 'white', fontWeight: '600', margin: 0 }}>
                                {student.isRegistered ? 'Active' : 'Pending'}
                            </p>
                        </div>
                    </div>
                    {!student.isRegistered && (
                        <button
                            onClick={() => navigate('/register-face')}
                            style={{
                                background: 'var(--primary)', color: 'white', border: 'none',
                                borderRadius: '8px', padding: '8px 16px', fontSize: '0.9rem', fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Register
                        </button>
                    )}
                </div>

                <button
                    onClick={() => { localStorage.clear(); navigate('/'); }}
                    className="btn glass-card"
                    style={{ marginTop: '24px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', width: '100%', justifyContent: 'center' }}
                >
                    <LogOut size={20} />
                    Logout
                </button>

            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default StudentProfile;
