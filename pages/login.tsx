import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Redirect to /home if already logged in
    if (typeof window !== "undefined") {
      const hasLocalStorage = localStorage.getItem("loggedIn") === "true";
      const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('lab-access='));
      if (hasLocalStorage || hasCookie) {
        router.push("/home");
      }
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      // Set cookie and localStorage, then redirect
      if (typeof window !== "undefined") {
        localStorage.setItem("loggedIn", "true");
        document.cookie = 'lab-access=lab2024; path=/; max-age=31536000';
      }
      router.push('/home');
    } else {
      setError('Invalid password');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '3rem',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h1 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>
          🔬 Lab Site Access
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', textAlign: 'center' }}>
          Enter the access code to view your health data
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <input
            type="password"
            placeholder="Enter access code"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          {error && (
            <div style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</div>
          )}
          <button 
            type="submit" 
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Access Lab Site 🔐
          </button>
        </form>
      </div>
    </div>
  );
}