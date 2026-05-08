
import React, { useState, useEffect } from 'react';
import { Camera, MapPin, AlertTriangle, ShieldCheck, RefreshCw, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PermissionGuard = ({ children }) => {
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState({
        camera: 'prompt',
        location: 'prompt'
    });
    const [loading, setLoading] = useState(true);

    // ✅ SECURITY: Redirect to login if no valid session token exists
    const token = localStorage.getItem('studentToken');
    useEffect(() => {
        if (!token) {
            navigate('/', { replace: true });
        }
    }, [token, navigate]);

    if (!token) return null;

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
                // Feature detection for permissions API
                if (navigator.permissions && navigator.permissions.query) {
                    try {
                        const camPermission = await navigator.permissions.query({ name: 'camera' });
                        camStatus = camPermission.state;
                        camPermission.onchange = () => {
                            setPermissions(prev => ({ ...prev, camera: camPermission.state }));
                        };
                    } catch (e) { console.warn("Camera permission query not supported"); }

                    try {
                        const locPermission = await navigator.permissions.query({ name: 'geolocation' });
                        locStatus = locPermission.state;
                        locPermission.onchange = () => {
                            setPermissions(prev => ({ ...prev, location: locPermission.state }));
                        };
                    } catch (e) { console.warn("Geolocation permission query not supported"); }
                }
            } catch (e) {
                console.warn("Permissions API not supported", e);
            }

            setPermissions({ camera: camStatus, location: locStatus });

        } catch (error) {
            console.error("Permission check failed", error);
        } finally {
            // Ensure loading is always disabled, even if everything fails
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
                alignItems: 'center', justifyContent: 'center', background: '#05070F', color: 'white',
                padding: '40px'
            }}>
                <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '24px' }}></div>
                <div className="skeleton" style={{ width: '200px', height: '32px', borderRadius: '8px', marginBottom: '16px' }}></div>
                <div className="skeleton" style={{ width: '100%', maxWidth: '300px', height: '16px', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div className="skeleton" style={{ width: '80%', maxWidth: '240px', height: '16px', borderRadius: '4px', marginBottom: '40px' }}></div>
                
                <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '600px' }}>
                    <div className="skeleton" style={{ flex: 1, height: '200px', borderRadius: '24px' }}></div>
                    <div className="skeleton" style={{ flex: 1, height: '200px', borderRadius: '24px' }}></div>
                </div>
            </div>
        );
    }

    const allGranted = permissions.camera === 'granted' && permissions.location === 'granted';

    if (allGranted) {
        return <>{children}</>;
    }

    return (
        <div style={{
            minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-gradient)', padding: '20px'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: 'rgba(37, 99, 235, 0.15)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(37, 99, 235, 0.2)'
                    }}>
                        <ShieldCheck size={36} className="text-primary" />
                    </div>
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px', color: 'white', letterSpacing: '-0.5px' }}>
                    Permissions Required
                </h1>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '420px', margin: '0 auto', fontSize: '0.95rem' }}>
                    To ensure security and proper attendance tracking, this application requires access to your Camera and Location.
                </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', maxWidth: '800px', width: '100%' }}>
                
                {/* Location Card Step */}
                {permissions.location !== 'granted' && (
                <div style={{
                    position: 'relative',
                    flex: '1 1 300px', maxWidth: '350px', height: '300px',
                    borderRadius: '20px', overflow: 'hidden',
                    border: permissions.location === 'granted' ? '2px solid rgba(34, 197, 94, 0.6)' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}>
                    {/* Background Image */}
                    <img src="/geotag.webp" alt="Location Required" style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0
                    }} />
                    
                    {/* Dark gradient overlay for text readability */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'linear-gradient(to top, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.6) 50%, transparent 100%)',
                        zIndex: 1
                    }}></div>

                    {/* Content overlaid on image */}
                    <div style={{
                        position: 'relative', zIndex: 2, padding: '24px', height: '100%',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                        textAlign: 'left'
                    }}>
                        <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Location Access</h3>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            Required to verify your physical presence at the hostel premises during check-in.
                        </p>
                        
                        {permissions.location === 'granted' ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#22c55e', fontWeight: 'bold', padding: '12px', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '12px', backdropFilter: 'blur(8px)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                <CheckCircle size={20} /> Allowed
                            </div>
                        ) : (
                            <button
                                onClick={requestLocation}
                                disabled={permissions.location === 'denied'}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '12px',
                                    background: permissions.location === 'denied' ? 'rgba(255,255,255,0.1)' : 'var(--primary)',
                                    color: permissions.location === 'denied' ? 'rgba(255,255,255,0.5)' : 'white',
                                    cursor: permissions.location === 'denied' ? 'not-allowed' : 'pointer',
                                    fontWeight: '700', fontSize: '1rem',
                                    backdropFilter: permissions.location === 'denied' ? 'blur(8px)' : 'none',
                                    border: permissions.location === 'denied' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                    boxShadow: permissions.location === 'denied' ? 'none' : '0 8px 20px rgba(37, 99, 235, 0.4)'
                                }}
                            >
                                {permissions.location === 'denied' ? 'Denied' : 'Allow Location'}
                            </button>
                        )}
                    </div>
                </div>
                )}

                {/* Camera Card Step */}
                {(permissions.location === 'granted' && permissions.camera !== 'granted') && (
                <div style={{
                    position: 'relative',
                    flex: '1 1 300px', maxWidth: '350px', height: '300px',
                    borderRadius: '20px', overflow: 'hidden',
                    border: permissions.camera === 'granted' ? '2px solid rgba(34, 197, 94, 0.6)' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}>
                    {/* Background Image */}
                    <img src="/facereq.webp" alt="Camera Required" style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0
                    }} />
                    
                    {/* Dark gradient overlay for text readability */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'linear-gradient(to top, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.6) 50%, transparent 100%)',
                        zIndex: 1
                    }}></div>

                    {/* Content overlaid on image */}
                    <div style={{
                        position: 'relative', zIndex: 2, padding: '24px', height: '100%',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                        textAlign: 'left'
                    }}>
                        <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Camera Access</h3>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            Required for live facial recognition to authenticate your identity securely.
                        </p>
                        
                        {permissions.camera === 'granted' ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#22c55e', fontWeight: 'bold', padding: '12px', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '12px', backdropFilter: 'blur(8px)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                <CheckCircle size={20} /> Allowed
                            </div>
                        ) : (
                            <button
                                onClick={requestCamera}
                                disabled={permissions.camera === 'denied'}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '12px',
                                    background: permissions.camera === 'denied' ? 'rgba(255,255,255,0.1)' : 'var(--primary)',
                                    color: permissions.camera === 'denied' ? 'rgba(255,255,255,0.5)' : 'white',
                                    cursor: permissions.camera === 'denied' ? 'not-allowed' : 'pointer',
                                    fontWeight: '700', fontSize: '1rem',
                                    backdropFilter: permissions.camera === 'denied' ? 'blur(8px)' : 'none',
                                    border: permissions.camera === 'denied' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                    boxShadow: permissions.camera === 'denied' ? 'none' : '0 8px 20px rgba(37, 99, 235, 0.4)'
                                }}
                            >
                                {permissions.camera === 'denied' ? 'Denied' : 'Allow Camera'}
                            </button>
                        )}
                    </div>
                </div>
                )}

            </div>

            {/* Show instructions only if the currently visible step is denied */}
            {((permissions.location !== 'granted' && permissions.location === 'denied') || 
              (permissions.location === 'granted' && permissions.camera === 'denied')) && (
                <div style={{
                    marginTop: '32px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px',
                    display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', width: '100%'
                }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <AlertTriangle size={24} className="text-red-500 shrink-0" style={{ marginTop: '2px' }} />
                        <div style={{ textAlign: 'left' }}>
                            <p style={{ fontWeight: 'bold', color: '#fca5a5', marginBottom: '4px', fontSize: '1rem' }}>Permission Denied</p>
                            <p style={{ fontSize: '0.9rem', color: 'rgba(252, 165, 165, 0.9)', lineHeight: '1.5' }}>
                                Access to this feature was denied. Please click the lock icon in your browser's URL bar, reset the permissions, and then click the button below to try again.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#ef4444',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'background 0.2s',
                            fontSize: '1rem'
                        }}
                    >
                        <RefreshCw size={18} />
                        Reactivate Permissions
                    </button>
                </div>
            )}
        </div>
    );
};

export default PermissionGuard;
