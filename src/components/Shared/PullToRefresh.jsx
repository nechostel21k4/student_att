import { useState, useEffect, useRef, useCallback } from 'react';

const THRESHOLD = 72;   // px drag to trigger reload
const MAX_PULL  = 100;  // max visual size of indicator
const MIN_PULL  = 10;   // dead zone

/**
 * Walk up from the touch target and find if any scrollable ancestor
 * has scrolled away from the top. Returns true only if every scrollable
 * parent is at scrollTop === 0 (i.e. the page is truly at the top).
 */
function isTouchTargetAtTop(touchTarget) {
  let el = touchTarget;
  while (el && el !== document.documentElement) {
    const style    = window.getComputedStyle(el);
    const overflow = style.overflowY;
    const isScrollable = overflow === 'scroll' || overflow === 'auto';
    if (isScrollable && el.scrollTop > 0) return false;
    el = el.parentElement;
  }
  return true;
}

const PullToRefresh = ({ children }) => {
  const containerRef  = useRef(null);
  const startY        = useRef(null);
  const lockedAtTop   = useRef(false);
  const isRefreshing  = useRef(false);
  const pullDistRef   = useRef(0);

  const [pullDist, setPullDist] = useState(0);
  const [phase,    setPhase]    = useState('idle');

  const triggerReload = useCallback(() => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;
    setPhase('reloading');
    setTimeout(() => window.location.reload(), 950);
  }, []);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (isRefreshing.current) return;
      startY.current      = e.touches[0].clientY;
      // Check the ACTUAL touched element's scroll chain
      lockedAtTop.current = isTouchTargetAtTop(e.touches[0].target);
    };

    const onTouchMove = (e) => {
      if (isRefreshing.current || startY.current === null) return;
      if (!lockedAtTop.current) return;

      const dy = e.touches[0].clientY - startY.current;

      if (dy < 0) {
        // User scrolled up — cancel pull gesture permanently for this touch
        if (pullDistRef.current > 0) {
          pullDistRef.current = 0;
          setPullDist(0);
          setPhase('idle');
        }
        lockedAtTop.current = false;
        return;
      }

      if (dy < MIN_PULL) return; // dead zone — wait for clear intent

      // Active pull — block browser's native pull-to-refresh
      if (e.cancelable) e.preventDefault();

      // Rubber-band easing
      const eased = Math.min(MAX_PULL, dy * (MAX_PULL / (MAX_PULL + dy * 0.8)));
      pullDistRef.current = eased;
      setPullDist(eased);
      setPhase('pulling');
    };

    const onTouchEnd = () => {
      if (isRefreshing.current) return;
      const wasActive = lockedAtTop.current && pullDistRef.current >= MIN_PULL;
      startY.current      = null;
      lockedAtTop.current = false;

      if (!wasActive) return;

      const dist          = pullDistRef.current;
      pullDistRef.current = 0;

      if (dist >= THRESHOLD) {
        triggerReload();
      } else {
        setPhase('releasing');
        setPullDist(0);
        setTimeout(() => setPhase('idle'), 350);
      }
    };

    // Attach to window so we catch touches on any child scroll container
    window.addEventListener('touchstart',  onTouchStart, { passive: true });
    window.addEventListener('touchmove',   onTouchMove,  { passive: false });
    window.addEventListener('touchend',    onTouchEnd,   { passive: true });
    window.addEventListener('touchcancel', onTouchEnd,   { passive: true });

    return () => {
      window.removeEventListener('touchstart',  onTouchStart);
      window.removeEventListener('touchmove',   onTouchMove);
      window.removeEventListener('touchend',    onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [triggerReload]);

  const progress    = Math.min(1, pullDist / THRESHOLD);
  const isReady     = pullDist >= THRESHOLD;
  const isReloading = phase === 'reloading';
  const indicatorH  = isReloading ? 66 : Math.round(pullDist * 0.68);

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        overscrollBehavior: 'none',
      }}
    >
      {/* Floating overlay indicator — never shifts content */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 9999,
          height: `${indicatorH}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          overflow: 'hidden',
          transition: phase === 'pulling' ? 'none' : 'height 0.38s cubic-bezier(0.34,1.56,0.64,1)',
          background: (pullDist > 6 || isReloading)
            ? 'linear-gradient(to bottom, rgba(5,10,20,0.95) 0%, transparent 100%)'
            : 'transparent',
        }}
      >
        {(pullDist > 6 || isReloading) && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
            opacity: isReloading ? 1 : Math.min(1, progress * 1.6),
            transform: `scale(${isReloading ? 1 : 0.55 + progress * 0.45})`,
            transition: 'opacity 0.15s, transform 0.15s',
          }}>
            {/* Ring + logo */}
            <div style={{ position: 'relative', width: 42, height: 42 }}>
              <svg viewBox="0 0 42 42" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                transform: isReloading ? undefined : `rotate(${progress * 260}deg)`,
                animation: isReloading ? 'ptr-spin 0.75s linear infinite' : 'none',
                transition: 'transform 0.08s linear',
              }}>
                <circle cx="21" cy="21" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2"/>
                <circle
                  cx="21" cy="21" r="18" fill="none"
                  stroke={isReady || isReloading ? '#3b82f6' : 'rgba(255,255,255,0.4)'}
                  strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - (isReloading ? 0.78 : progress * 0.88))}`}
                  style={{ transition: 'stroke 0.18s' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 4, borderRadius: '50%',
                background: 'rgba(10,15,30,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <img
                  src="/HostelX.png" alt="HostelX"
                  style={{
                    width: 20, height: 20, objectFit: 'contain',
                    animation: isReloading ? 'ptr-bounce 0.55s ease-in-out infinite alternate' : 'none',
                  }}
                />
              </div>
            </div>

            <span style={{
              fontSize: '8px', fontWeight: 800,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: isReady || isReloading ? '#3b82f6' : 'rgba(255,255,255,0.4)',
              transition: 'color 0.18s',
              fontFamily: "'Outfit', sans-serif",
            }}>
              {isReloading ? 'Syncing...' : isReady ? 'Release' : 'Pull to Refresh'}
            </span>
          </div>
        )}
      </div>

      {children}

      <style>{`
        @keyframes ptr-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ptr-bounce {
          from { transform: scale(0.82); opacity: 0.65; }
          to   { transform: scale(1.12); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PullToRefresh;
