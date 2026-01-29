export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET requests allowed' });
  }

  try {
    const accessToken = process.env.WHOOP_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(200).json({ needsAuth: true, error: 'No access token configured' });
    }

    // Make a simple API call to check if the token is valid
    // Use the user profile endpoint as it's lightweight
    const response = await fetch('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MyWhoopApp/1.0'
      }
    });

    if (!response.ok) {
      console.log('Auth check failed:', response.status, response.statusText);
      return res.status(200).json({ 
        needsAuth: true, 
        error: `Authentication failed: ${response.status}`,
        tokenExpired: response.status === 401
      });
    }

    const userData = await response.json();
    return res.status(200).json({ 
      authenticated: true, 
      user: userData,
      tokenValid: true
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(200).json({ 
      needsAuth: true, 
      error: 'Authentication check failed',
      details: error.message
    });
  }
}
