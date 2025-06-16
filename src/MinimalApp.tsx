import React from 'react';

export default function MinimalApp() {
  console.log('🔥 Minimal App component loaded');
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        🎉 MittSchema Works!
      </h1>
      <p style={{ fontSize: '1.2rem', textAlign: 'center', maxWidth: '600px' }}>
        Detta är en minimal version av appen för att testa att React fungerar korrekt.
      </p>
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: 'rgba(255,255,255,0.1)', 
        borderRadius: '8px',
        fontFamily: 'monospace'
      }}>
        <div>Environment: {import.meta.env.MODE}</div>
        <div>Timestamp: {new Date().toISOString()}</div>
        <div>Location: {typeof window !== 'undefined' ? window.location.href : 'server-side'}</div>
      </div>
    </div>
  );
}
