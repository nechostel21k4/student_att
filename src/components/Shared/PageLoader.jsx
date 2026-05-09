import React from 'react';

const PageLoader = () => (
  <div style={{
    height: '100vh', width: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#05070F', color: 'white', padding: '20px',
    overflow: 'hidden'
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      <img src="/HostelX.webp" alt="Logo" style={{ height: '80px', objectFit: 'contain' }} />
      <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: '900', 
          color: 'white', 
          letterSpacing: '-0.02em',
          fontFamily: "'Inter', sans-serif"
      }}>
          HostelX
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              style={{ 
                width: '10px', height: '10px', borderRadius: '50%', 
                background: '#2563eb',
                animation: `pulse 1.2s infinite ease-in-out both`,
                animationDelay: `${i * 0.15}s`
              }} 
            />
          ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  </div>
);

export default PageLoader;
