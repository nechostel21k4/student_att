import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navItems } from './NavConfig';
import { motion } from 'framer-motion';

const MobileNav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <div style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100%',
            padding: '12px 16px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            background: 'linear-gradient(to top, rgba(4,7,14,1) 40%, rgba(4,7,14,0.85) 80%, rgba(4,7,14,0))',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1000,
            pointerEvents: 'none' // Allow clicking through the gradient background
        }}>
            <div style={{
                pointerEvents: 'auto',
                width: '100%',
                maxWidth: '400px',
                backgroundColor: 'rgba(4, 7, 14, 0.3)',
                backdropFilter: 'blur(32px) saturate(150%)',
                WebkitBackdropFilter: 'blur(32px) saturate(150%)',
                borderRadius: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.2), inset 0 -1px 2px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.02)'
            }}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    
                    return (
                        <div 
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                                zIndex: 1,
                                flex: 1
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobileNavIndicator"
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={0.6}
                                    onDragEnd={(e, { offset, velocity }) => {
                                        const swipe = offset.x;
                                        const currentIndex = navItems.findIndex(i => i.path === location.pathname);
                                        
                                        if (swipe > 30 && currentIndex < navItems.length - 1) {
                                            navigate(navItems[currentIndex + 1].path);
                                        } else if (swipe < -30 && currentIndex > 0) {
                                            navigate(navItems[currentIndex - 1].path);
                                        }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                        backdropFilter: 'blur(16px)',
                                        WebkitBackdropFilter: 'blur(16px)',
                                        borderRadius: '24px',
                                        zIndex: -1,
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderTop: '1px solid rgba(255, 255, 255, 0.25)',
                                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -1px 1px rgba(0, 0, 0, 0.2)',
                                        cursor: 'grab'
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.85 }}
                                    whileDrag={{ cursor: 'grabbing', scale: 0.85 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15, mass: 0.8, bounce: 0.6 }}
                                />
                            )}
                            <Icon 
                                size={isActive ? 22 : 20} 
                                color={isActive ? '#60a5fa' : '#64748b'} 
                                strokeWidth={isActive ? 2.5 : 2}
                                style={{ 
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                                    marginBottom: '4px',
                                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                                    filter: isActive ? 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.5))' : 'none'
                                }}
                            />
                            <span style={{
                                fontSize: '10px',
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? '#60a5fa' : '#64748b',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                                opacity: isActive ? 1 : 0.7
                            }}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileNav;
