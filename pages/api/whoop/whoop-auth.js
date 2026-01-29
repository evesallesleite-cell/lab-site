export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const clientId = process.env.WHOOP_CLIENT_ID;
    const clientSecret = process.env.WHOOP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Whoop client credentials not configured' });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: `${req.headers.origin}/redirect`
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    // Save the access token to .env.local file
    const fs = require('fs');
    const path = require('path');
    
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update or add the WHOOP_ACCESS_TOKEN line
      if (envContent.includes('WHOOP_ACCESS_TOKEN=')) {
        envContent = envContent.replace(
          /WHOOP_ACCESS_TOKEN=.*/,
          `WHOOP_ACCESS_TOKEN=${tokenData.access_token}`
        );
      } else {
        envContent += `\nWHOOP_ACCESS_TOKEN=${tokenData.access_token}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('Whoop access token saved to .env.local');
    } catch (fileError) {
      console.error('Failed to save token to .env.local:', fileError);
    }

    console.log('Whoop access token obtained:', tokenData.access_token.substring(0, 20) + '...');

    res.status(200).json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });

  } catch (error) {
    console.error('Whoop auth error:', error);
    res.status(500).json({ 
      error: 'Failed to exchange authorization code for access token',
      details: error.message 
    });
  }
}
