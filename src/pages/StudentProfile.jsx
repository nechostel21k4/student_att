import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Building, CheckCircle, User, Phone, Mail, Hash, BookOpen,
    Calendar, Users, LogOut, Camera, Edit2,
    GraduationCap, Home, ShieldCheck, Activity
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import { useStudent } from '../context/StudentContext';
import Cropper from 'react-easy-crop';
import ConfirmModal from '../components/ConfirmModal';

// Helper function to extract cropped image blob
const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 1:1 crop
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // Compress to 0.8 quality jpeg to make it lightweight
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg', 0.8);
    });
};

const ProfileItem = ({ label, value }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
        <div style={{ color: '#FFFFFF', fontSize: '0.85rem', fontWeight: '600', opacity: 0.9 }}>{label}</div>
        <div style={{ color: value ? '#FFFFFF' : '#f87171', fontWeight: '700', fontSize: '0.9rem', textAlign: 'right' }}>{value || 'NOT SET'}</div>
    </div>
);

const ProfileSection = ({ title, icon: Icon, color, children }) => (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
                padding: '8px', borderRadius: '10px',
                background: `${color}15`, color: color
            }}>
                <Icon size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: '700', letterSpacing: '-0.3px' }}>{title}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {children}
        </div>
    </div>
);

const StudentProfile = () => {
    const navigate = useNavigate();
    const { profile: contextProfile, loading: contextLoading, loadProfile, clearSession } = useStudent();
    
    // Prioritize contextProfile but fallback to local state for internal updates
    const [localStudent, setLocalStudent] = useState(null);
    const student = localStudent || contextProfile;
    const [loading, setLoading] = useState(contextLoading || !contextProfile);
    const [showImagePreview, setShowImagePreview] = useState(false);

    // Image Upload State
    const [profileImageUrl, setProfileImageUrl] = useState(() => {
        return localStorage.getItem('studentProfilePicCache') || null;
    });
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [imageKey, setImageKey] = useState(0);
    const fileInputRef = useRef(null);

    // Cropper State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const token = localStorage.getItem('studentToken');
    const sid = localStorage.getItem('studentId');

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        
        // Only set loading false if we already have context data
        // but still allow fetchProfile to refresh it
        if (contextProfile) {
            setLoading(false);
        }
        
        fetchProfile();
        fetchProfileImage();
    }, [navigate, imageKey]); // Removed contextProfile and contextLoading to prevent infinite loops

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/student/${sid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.isExist) {
                setLocalStudent(res.data.hosteler);
                loadProfile(); // Also update context
            }
        } catch (err) {
            console.error("Failed to fetch profile", err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfileImage = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/upload/getImage/${sid}`);
            if (res.data && res.data.imageExist) {
                setProfileImageUrl(res.data.imagePath);
                localStorage.setItem('studentProfilePicCache', res.data.imagePath);
            } else {
                setProfileImageUrl(null);
                localStorage.removeItem('studentProfilePicCache');
            }
        } catch (err) {
            console.error("Failed to fetch profile image", err.message);
        }
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.match('image/jpeg') && !file.type.match('image/jpg') && !file.type.match('image/png')) {
            toast.error("Only .jpg, .jpeg, or .png images are allowed");
            return;
        }

        // Read file and open cropper
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result);
        };
        reader.readAsDataURL(file);
        // Reset file input so same file can be selected again if cancelled
        e.target.value = null;
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsImageUploading(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            const formData = new FormData();
            formData.append("image", croppedBlob, "profile.jpg");

            const res = await axios.post(`${API_BASE_URL}/upload/uploadimage/${sid}`, formData, {
                headers: { 
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.data && res.data.imageUploaded) {
                try {
                    await axios.post(`${API_BASE_URL}/logs/add-log`, {
                        date: new Date(),
                        userId: sid,
                        username: student?.name || sid,
                        action: `Uploaded profile image`
                    }, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch (logErr) {
                    console.error("Logging failed", logErr);
                }

                toast.success("Image Uploaded Successfully");
                setImageKey(prev => prev + 1);
                setImageSrc(null); // Close cropper
            } else {
                toast.error("Image Upload Failed");
            }
        } catch (err) {
            console.error("Upload error", err.message);
            toast.error("Error uploading image");
        } finally {
            setIsImageUploading(false);
        }
    };


    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    if (!student && !loading) return <div style={{ height: '100vh', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', background: '#04070e' }}>Student not found</div>;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '16px 16px calc(100px + env(safe-area-inset-bottom)) 16px' }}>
            <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>

                {/* Status Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', margin: 0 }}>Profile</h1>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '30px',
                        background: loading ? 'rgba(255,255,255,0.05)' : (student?.currentStatus === 'HOSTEL' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(249, 115, 22, 0.15)'),
                        color: loading ? 'transparent' : (student?.currentStatus === 'HOSTEL' ? '#22c55e' : '#f97316'),
                        fontWeight: '800', fontSize: '0.75rem', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: loading ? 'none' : (student?.currentStatus === 'HOSTEL' ? '0 4px 12px rgba(34, 197, 94, 0.1)' : '0 4px 12px rgba(249, 115, 22, 0.1)'),
                        backdropFilter: 'blur(10px)',
                        letterSpacing: '0.05em',
                        transition: 'all 0.3s ease'
                    }}>
                        {!loading && (student?.currentStatus === 'HOSTEL' ? <ShieldCheck size={14} strokeWidth={2.5} /> : <Home size={14} strokeWidth={2.5} />)}
                        <span style={{ textTransform: 'uppercase' }}>
                            {loading ? 'Loading...' : (student?.currentStatus || 'UNKNOWN')}
                        </span>
                    </div>
                </div>

                <div className="glass-card" style={{
                    padding: '48px 32px', marginBottom: '24px', textAlign: 'center', position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '32px',
                    background: `linear-gradient(rgba(4, 7, 14, 0.4), rgba(4, 7, 14, 0.9)), url("/banner.webp") center/cover no-repeat`,
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="skeleton" style={{ width: '130px', height: '130px', borderRadius: '38px', marginBottom: '24px' }}></div>
                                <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px' }}></div>
                                <div className="skeleton" style={{ width: '150px', height: '20px', borderRadius: '8px' }}></div>
                            </div>
                        ) : (
                            <>
                                <div style={{ position: 'relative', width: '130px', margin: '0 auto 24px auto' }}>
                                    {/* Profile Image Container with Premium Glow */}
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => profileImageUrl && setShowImagePreview(true)}
                                        style={{
                                            width: '130px', height: '130px', borderRadius: '38px',
                                            padding: '3px', // For the gradient border
                                            background: 'var(--primary)',
                                            boxShadow: '0 15px 35px rgba(0,0,0,0.5), 0 0 20px rgba(37, 99, 235, 0.2)',
                                            cursor: profileImageUrl ? 'pointer' : 'default',
                                            position: 'relative',
                                            overflow: 'visible'
                                        }}
                                    >
                                        <div style={{ 
                                            width: '100%', height: '100%', borderRadius: '35px', 
                                            background: '#0f172a', overflow: 'hidden',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {profileImageUrl ? (
                                                <img src={profileImageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={60} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Enhanced Camera Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 10 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => fileInputRef.current.click()}
                                        style={{
                                            position: 'absolute', bottom: '-8px', right: '-8px',
                                            width: '42px', height: '42px', borderRadius: '14px',
                                            background: '#2563eb', color: 'white', border: '2px solid #0f172a',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 8px 16px rgba(99,102,241,0.4)', cursor: 'pointer',
                                            zIndex: 10
                                        }}
                                    >
                                        <Camera size={20} />
                                    </motion.button>
                                    <input type="file" accept=".jpg,.jpeg,.png" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                                </div>

                                {/* Name with improved typography */}
                                <h2 style={{
                                    fontSize: '1.85rem',
                                    fontWeight: '800',
                                    color: '#FFFFFF',
                                    margin: '0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                }}>{student?.name}</h2>
                                <div style={{ 
                                    marginTop: '6px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', 
                                    fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' 
                                }}>
                                    {student?.branch} • {student?.year} YEAR
                                </div>
                                {student?.email && (
                                    <div style={{ 
                                        marginTop: '12px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', 
                                        fontWeight: '500', background: 'rgba(255,255,255,0.05)',
                                        padding: '6px 16px', borderRadius: '20px', display: 'inline-block'
                                    }}>
                                        {student.email}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="skeleton" style={{ width: '100%', height: '150px', borderRadius: '24px' }}></div>
                        <div className="skeleton" style={{ width: '100%', height: '100px', borderRadius: '24px' }}></div>
                        <div className="skeleton" style={{ width: '100%', height: '150px', borderRadius: '24px' }}></div>
                    </div>
                ) : (
                    <>
                        {/* Categories */}
                        <ProfileSection title="Academic Details" icon={GraduationCap} color="#3b82f6">
                            <ProfileItem label="College" value={student?.college} />
                            <ProfileItem label="Year" value={student?.year} />
                            <ProfileItem label="Branch" value={student?.branch} />
                        </ProfileSection>

                        <ProfileSection title="Residency" icon={Home} color="#34d399">
                            <ProfileItem label="Hostel ID" value={student?.hostelId} />
                            <ProfileItem label="Room No" value={student?.roomNo} />
                        </ProfileSection>

                        <ProfileSection title="Contact Information" icon={Mail} color="#f472b6">
                            <ProfileItem label="Gender" value={student?.gender} />
                            <ProfileItem label="Phone No" value={student?.phoneNo} />
                            <ProfileItem label="Email" value={student?.email} />
                        </ProfileSection>

                        <ProfileSection title="Parents Contact" icon={ShieldCheck} color="#fbbf24">
                            <ProfileItem label="Parent Name" value={student?.parentName} />
                            <ProfileItem label="Parent Phone" value={student?.parentPhoneNo} />
                        </ProfileSection>

                        {/* Registration Status */}
                        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}>
                                    <CheckCircle size={20} color="#10b981" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Face Registration</p>
                                    <p style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: '700' }}>{student?.isRegistered ? 'Verified' : 'Required'}</p>
                                </div>
                            </div>
                            {!student?.isRegistered && (
                                <button onClick={() => navigate('/register-face')} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem' }}>Update</button>
                            )}
                        </div>
                    </>
                )}

                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    style={{
                        width: '100%', height: '56px', borderRadius: '16px',
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171', fontSize: '1rem', fontWeight: '700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer'
                    }}
                >
                    <LogOut size={20} />
                    Sign Out
                </button>

            </div>

            {/* Logout Confirmation */}
            <ConfirmModal 
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={() => { clearSession(); navigate('/'); }}
                title="Sign Out"
                message="Are you sure you want to sign out of your account?"
                confirmText="Sign Out"
                type="logout"
            />

            {/* Image Preview */}
            {showImagePreview && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowImagePreview(false)}>
                    <img src={profileImageUrl} alt="Full size" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
                </div>
            )}

            {/* Cropper Modal */}
            {imageSrc && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 3000,
                    display: 'flex', flexDirection: 'column', padding: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', color: 'white' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>Crop Image</h3>
                        <button onClick={() => setImageSrc(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' }}>Cancel</button>
                    </div>

                    <div style={{ position: 'relative', flex: 1, width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#111827' }}>
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1} // 1:1 Aspect Ratio
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            showGrid={false}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', padding: '24px 0', alignItems: 'center' }}>
                        <span style={{ color: 'white', fontSize: '0.9rem' }}>Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            style={{ flex: 1, accentColor: '#2563eb' }}
                        />
                    </div>

                    <button
                        onClick={handleCropUpload}
                        disabled={isImageUploading}
                        style={{
                            width: '100%', height: '56px', borderRadius: '16px',
                            background: '#2563eb', color: 'white', border: 'none',
                            fontSize: '1.1rem', fontWeight: '700',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            cursor: isImageUploading ? 'not-allowed' : 'pointer',
                            opacity: isImageUploading ? 0.7 : 1
                        }}
                    >
                        {isImageUploading ? (
                            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}>
                                <Activity size={24} />
                            </motion.div>
                        ) : (
                            <CheckCircle size={24} />
                        )}
                        {isImageUploading ? 'UPLOADING...' : 'APPLY & UPLOAD'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudentProfile;
