import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const VERSION = '1.0.0';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('lab-logged-in');
      if (loggedIn === 'true') {
        router.replace('/home');
      }
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Set localStorage for client-side auth
        localStorage.setItem('lab-logged-in', 'true');
        localStorage.setItem('lab-password', password);
        
        // Small delay to ensure localStorage is set
        setTimeout(() => {
          router.push('/home');
        }, 100);
      } else {
        setError('Invalid access code');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection error. Try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        padding: '3rem',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h1 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center', fontSize: '1.8rem' }}>
          🔬 Lab Site Access
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.95rem' }}>
          Enter your access code to continue
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <input
            id="password-input"
            name="password"
            type="password"
            placeholder="Access code"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              border: '2px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '1.1rem',
              outline: 'none',
              textAlign: 'center',
              opacity: loading ? 0.8 : 1
            }}
          />
          
          {error && (
            <div style={{ 
              color: '#fef2f2', 
              textAlign: 'center', 
              background: 'rgba(220, 38, 38, 0.4)', 
              padding: '10px', 
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
          
          <button 
            id="submit-button"
            name="submit"
            type="submit" 
            disabled={loading || !password}
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'white',
              color: '#4b5563',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Verifying...' : 'Enter 🔐'}
          </button>
        </form>
        
        <div style={{ 
          marginTop: '1.5rem', 
          textAlign: 'center', 
          color: 'rgba(255,255,255,0.6)', 
          fontSize: '0.8rem' 
        }}>
          Version {VERSION}
        </div>
      </div>
    </div>
  );
}
