'use client';

import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';

export default function IntroLoader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeExit, setFadeExit] = useState(false);
  const [statusText, setStatusText] = useState('Syncing secure ledgers...');

  useEffect(() => {
    // 1. Run fluid progress bar (10ms steps for 100fps liquid motion)
    const duration = 2800; 
    const intervalTime = 10;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    // 2. Sequential status changes
    const t1 = setTimeout(() => setStatusText('Analyzing cashflow insights...'), 850);
    const t2 = setTimeout(() => setStatusText('Optimizing dashboards...'), 1700);
    const t3 = setTimeout(() => setStatusText('Welcome to SpendWise.'), 2400);

    // 3. Smooth Exit transition
    const exitTimer = setTimeout(() => {
      setFadeExit(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    }, duration + 100);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 35%, #fae8ff 70%, #e0f2fe 100%)',
        backgroundSize: '400% 400%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: fadeExit ? 0 : 1,
        transform: fadeExit ? 'scale(0.96) translateY(-15px)' : 'scale(1) translateY(0)',
        padding: '2rem'
      }}
    >
      {/* Inline styles for keyframe animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes aurora {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        @keyframes breath {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 20px -5px rgba(79, 70, 229, 0.15); }
          50% { transform: scale(1.05); box-shadow: 0 16px 35px -5px rgba(79, 70, 229, 0.3); }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.7); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes textSlideUp {
          from { opacity: 0; transform: translateY(8px); filter: blur(2px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }
        .pulse-logo {
          animation: breath 2.5s infinite ease-in-out;
        }
        .slide-text {
          animation: textSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .ring1 {
          animation: pulseRing 3s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
        }
        .ring2 {
          animation: pulseRing 3s infinite cubic-bezier(0.215, 0.61, 0.355, 1) 1.5s;
        }
      `}} />

      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2.5rem',
          maxWidth: '380px',
          width: '100%'
        }}
      >
        {/* Glowing Rings and Wallet logo container */}
        <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ring1" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid rgba(79, 70, 229, 0.25)' }} />
          <div className="ring2" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid rgba(124, 58, 237, 0.2)' }} />
          
          <div 
            className="pulse-logo"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4f46e5',
              zIndex: 3,
              boxShadow: '0 8px 32px rgba(79, 70, 229, 0.15)'
            }}
          >
            <Wallet size={38} />
          </div>
        </div>

        {/* Brand */}
        <div style={{ textAlign: 'center' }}>
          <h1 
            style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '2rem', 
              letterSpacing: '-0.75px',
              fontWeight: 850,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.25rem'
            }}
          >
            SpendWise
          </h1>
          <span 
            style={{ 
              fontSize: '0.75rem', 
              letterSpacing: '2px', 
              color: '#4f46e5',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}
          >
            Premium Ledger
          </span>
        </div>

        {/* Animated status text */}
        <div 
          key={statusText}
          className="slide-text"
          style={{
            height: '24px',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#334155',
            textAlign: 'center',
            fontFamily: 'var(--font-display)'
          }}
        >
          {statusText}
        </div>

        {/* Hairline progress bar with glowing liquid effect */}
        <div style={{ width: '100%', marginTop: '0.5rem' }}>
          <div 
            style={{ 
              height: '4px', 
              width: '100%', 
              backgroundColor: 'rgba(0, 0, 0, 0.04)', 
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
                borderRadius: '2px',
                transition: 'width 0.08s linear',
                boxShadow: '0 0 8px #4f46e5, 0 0 15px rgba(79, 70, 229, 0.4)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
