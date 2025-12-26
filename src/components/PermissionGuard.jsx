
import React, { useState, useEffect } from 'react';
import { Camera, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';

const PermissionGuard = ({ children }) => {
    const [permissions, setPermissions] = useState({
        camera: 'prompt', // prompt, granted, denied
        location: 'prompt'
    });
    const [loading, setLoading] = useState(true);

    const checkPermissions = async () => {
        setLoading(true);
        try {
            // locations prompt check usually happens via navigator.permissions or direct request
            // Camera check
            // Note: navigator.permissions.query for 'camera' is not supported in all browsers equally (e.g. Firefox),
            // so we try to check via accessing media if not 'granted'. 
            // However, a less intrusive way is preferred first if possible.
            // But User wants MANDATORY, so we might as well attempt to get stream to force prompt if not known.

            // Actually, best practice to avoid instant prompt on load is checking status if possible.
            // But simple robust way: Try to get them.

            // Let's check status first if API is available
            let camStatus = 'prompt';
            let locStatus = 'prompt';

            try {
                const camPermission = await navigator.permissions.query({ name: 'camera' });
                camStatus = camPermission.state;

                const locPermission = await navigator.permissions.query({ name: 'geolocation' });
                locStatus = locPermission.state;

                // Listen for changes
                camPermission.onchange = () => {
                    setPermissions(prev => ({ ...prev, camera: camPermission.state }));
                };
                locPermission.onchange = () => {
                    setPermissions(prev => ({ ...prev, location: locPermission.state }));
                };

            } catch (e) {
                console.warn("Permissions API not fully supported", e);
                // Fallback will be manual request
            }

            setPermissions({ camera: camStatus, location: locStatus });

        } catch (error) {
            console.error("Permission check failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkPermissions();
    }, []);

    const requestCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Stop stream immediately, we just wanted permission
            stream.getTracks().forEach(track => track.stop());
            setPermissions(prev => ({ ...prev, camera: 'granted' }));
        } catch (err) {
            console.error(err);
            setPermissions(prev => ({ ...prev, camera: 'denied' }));
            // If denied, we essentially need to tell them to go to settings
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPermissions(prev => ({ ...prev, location: 'granted' }));
            },
            (err) => {
                console.error(err);
                setPermissions(prev => ({ ...prev, location: 'denied' }));
            }
        );
    };

    if (loading) {
        return (
            <div style={{
                height: '100vh', width: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white'
            }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <p>Checking Permissions...</p>
            </div>
        );
    }

    const allGranted = permissions.camera === 'granted' && permissions.location === 'granted';

    if (allGranted) {
        return <>{children}</>;
    }

    return (
        <div style={{
            height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-gradient)', padding: '20px'
        }}>
            <div className="glass-card" style={{
                maxWidth: '500px', width: '100%', padding: '32px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', gap: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.2)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
                    }}>
                        <ShieldCheck size={40} className="text-primary" />
                    </div>
                </div>

                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>
                        Permissions Required
                    </h1>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        To ensure security and proper attendance tracking, this application requires access to your <b>Camera</b> and <b>Location</b>.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Camera Item */}
                    <div style={{
                        padding: '16px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                                <Camera size={20} className="text-primary" />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <span style={{ display: 'block', fontWeight: 'bold' }}>Camera</span>
                                <span style={{ fontSize: '0.8rem', color: permissions.camera === 'denied' ? '#ef4444' : 'var(--text-muted)' }}>
                                    {permissions.camera === 'granted' ? 'Allowed' : permissions.camera === 'denied' ? 'Access Denied' : 'Required'}
                                </span>
                            </div>
                        </div>
                        {permissions.camera !== 'granted' && (
                            <button
                                onClick={requestCamera}
                                disabled={permissions.camera === 'denied'}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                                    background: permissions.camera === 'denied' ? 'rgba(255,255,255,0.1)' : 'var(--primary)',
                                    color: permissions.camera === 'denied' ? 'var(--text-muted)' : 'white',
                                    cursor: permissions.camera === 'denied' ? 'not-allowed' : 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {permissions.camera === 'denied' ? 'Denied' : 'Allow'}
                            </button>
                        )}
                        {permissions.camera === 'granted' && <ShieldCheck size={24} className="text-green-500" />}
                    </div>

                    {/* Location Item */}
                    <div style={{
                        padding: '16px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                                <MapPin size={20} className="text-primary" />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <span style={{ display: 'block', fontWeight: 'bold' }}>Location</span>
                                <span style={{ fontSize: '0.8rem', color: permissions.location === 'denied' ? '#ef4444' : 'var(--text-muted)' }}>
                                    {permissions.location === 'granted' ? 'Allowed' : permissions.location === 'denied' ? 'Access Denied' : 'Required'}
                                </span>
                            </div>
                        </div>
                        {permissions.location !== 'granted' && (
                            <button
                                onClick={requestLocation}
                                disabled={permissions.location === 'denied'}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                                    background: permissions.location === 'denied' ? 'rgba(255,255,255,0.1)' : 'var(--primary)',
                                    color: permissions.location === 'denied' ? 'var(--text-muted)' : 'white',
                                    cursor: permissions.location === 'denied' ? 'not-allowed' : 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {permissions.location === 'denied' ? 'Denied' : 'Allow'}
                            </button>
                        )}
                        {permissions.location === 'granted' && <ShieldCheck size={24} className="text-green-500" />}
                    </div>
                </div>

                {(permissions.camera === 'denied' || permissions.location === 'denied') && (
                    <div style={{
                        marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px',
                        display: 'flex', alignItems: 'start', gap: '12px', textAlign: 'left'
                    }}>
                        <AlertTriangle size={20} className="text-red-500 shrink-0 mt-1" />
                        <div>
                            <p style={{ fontWeight: 'bold', color: '#fca5a5', marginBottom: '4px' }}>Permissions Denied</p>
                            <p style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                                You have denied access. Please click the lock icon in your browser address bar, reset permissions, and reload the page.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PermissionGuard;
