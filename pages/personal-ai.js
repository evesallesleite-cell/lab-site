import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PersonalAI() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/data-downloads');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to data downloads...</p>
      </div>
    </div>
  );
}