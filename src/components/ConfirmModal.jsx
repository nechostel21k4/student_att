
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, LogOut, Info, ShieldAlert } from 'lucide-react';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info'
}) => {
    
    // Lock scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const getIcon = () => {
        switch (type) {
            case 'danger': return <ShieldAlert size={28} />;
            case 'warning': return <AlertTriangle size={28} />;
            case 'logout': return <LogOut size={28} />;
            default: return <Info size={28} />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'danger': return 'rgba(239, 68, 68, 0.2)';
            case 'warning': return 'rgba(245, 158, 11, 0.2)';
            case 'logout': return 'rgba(37, 99, 235, 0.2)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'danger': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'logout': return '#3b82f6';
            default: return '#fff';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 3000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)'
                        }}
                    />

                    {/* Modal Content */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        style={{
                            position: 'relative', width: '100%', maxWidth: '400px',
                            background: 'rgba(15, 23, 42, 0.95)', /* Obsidian */
                            borderRadius: '32px',
                            padding: '40px 30px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                            textAlign: 'center',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Background Glow */}
                        <div style={{
                            position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)',
                            width: '200px', height: '200px', background: getColors(),
                            filter: 'blur(60px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none'
                        }} />

                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Icon */}
                            <div style={{ 
                                margin: '0 auto', width: '70px', height: '70px', 
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: getIconColor(),
                                boxShadow: `0 15px 30px -5px ${getColors()}`
                            }}>
                                {getIcon()}
                            </div>

                            {/* Text */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                                    {title}
                                </h3>
                                <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.4)', lineHeight: 1.5, margin: 0 }}>
                                    {message}
                                </p>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button
                                    onClick={onClose}
                                    style={{
                                        flex: 1, padding: '16px', borderRadius: '18px',
                                        background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)',
                                        color: '#fff', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    style={{
                                        flex: 1, padding: '16px', borderRadius: '18px',
                                        background: type === 'danger' || type === 'logout' ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: type === 'danger' || type === 'logout' ? '#ef4444' : '#fff',
                                        fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: type === 'danger' || type === 'logout' ? 'none' : '0 10px 20px -5px rgba(37, 99, 235, 0.3)'
                                    }}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>

                        {/* Close button */}
                        <button 
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: '24px', right: '24px',
                                background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.2)',
                                cursor: 'pointer', padding: '4px'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
