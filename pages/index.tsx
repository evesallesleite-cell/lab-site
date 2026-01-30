import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.replace('/login');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        color: 'white',
        textAlign: 'center'
      }}>
        <p>Redirecting to login...</p>
      </div>
    </div>
  );
}
