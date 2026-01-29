// Authentication utilities for Whoop API
export const checkAuthAndRedirect = async (router, targetPath) => {
  try {
    // Try to make a simple API call to check if token is valid
    const response = await fetch('/api/auth-check');
    const data = await response.json();
    
    if (!response.ok || data.error || data.needsAuth) {
      // Store the intended destination in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('whoopRedirectAfterAuth', targetPath);
      }
      
      // Redirect to login
      router.push('/whoop/whoop-login');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    // On error, redirect to login as well
    if (typeof window !== 'undefined') {
      localStorage.setItem('whoopRedirectAfterAuth', targetPath);
    }
    router.push('/whoop/whoop-login');
    return false;
  }
};

export const getRedirectAfterAuth = () => {
  if (typeof window !== 'undefined') {
    const redirect = localStorage.getItem('whoopRedirectAfterAuth');
    localStorage.removeItem('whoopRedirectAfterAuth');
    return redirect || '/whoop/sleep'; // Default to sleep page
  }
  return '/whoop/sleep';
};

export const handleApiError = (error, router, currentPath) => {
  // Check if it's an authentication error
  if (error.status === 401 || error.message?.includes('auth') || error.message?.includes('token')) {
    // Store current path for redirect after login
    if (typeof window !== 'undefined') {
      localStorage.setItem('whoopRedirectAfterAuth', currentPath);
    }
    router.push('/whoop/whoop-login');
    return true;
  }
  return false;
};
