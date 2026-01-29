export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET requests allowed' });
  }

  try {
    const accessToken = process.env.WHOOP_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ error: 'No access token found' });
    }

    // Test the token with a simple API call
    const response = await fetch('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MyWhoopApp/1.0'
      }
    });

    const responseText = await response.text();
    
    let parsedResponse = null;
    try {
      parsedResponse = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      // Response is not JSON, probably an error message
      parsedResponse = { rawText: responseText };
    }
    
    return res.status(200).json({
      status: response.status,
      statusText: response.statusText,
      tokenExists: !!accessToken,
      tokenLength: accessToken.length,
      tokenPreview: accessToken.substring(0, 10) + '...',
      response: parsedResponse,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}
