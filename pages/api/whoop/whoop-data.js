export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET requests allowed' });
  }

  try {
    // Your Whoop access token - you'll need to add this to your .env.local file
    const accessToken = process.env.WHOOP_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Whoop access token not configured' });
    }

    // Fetch user profile data
    const profileResponse = await fetch('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MyWhoopApp/1.0'
      }
    });

    if (!profileResponse.ok) {
      throw new Error(`Profile API error: ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();

    // Fetch user measurements (height, weight, etc.)
    const measurementsResponse = await fetch('https://api.prod.whoop.com/developer/v1/user/measurement/body', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MyWhoopApp/1.0'
      }
    });

    if (!measurementsResponse.ok) {
      throw new Error(`Measurements API error: ${measurementsResponse.status}`);
    }

    const measurementsData = await measurementsResponse.json();

    // Get recent recovery data (trying different v1 endpoints)
    console.log('🔍 Trying recovery v1 API...');
    const recoveryURL = `https://api.prod.whoop.com/developer/v1/recovery/collection`;
    console.log('🔍 Recovery URL:', recoveryURL);
    const recoveryResponse = await fetch(recoveryURL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MyWhoopApp/1.0'
      }
    });

    let recoveryData = null;
    if (recoveryResponse.ok) {
      recoveryData = await recoveryResponse.json();
      console.log('✅ Recovery data (v1) fetched successfully:', recoveryData);
    } else {
      console.log(`❌ Recovery API (v1) failed: ${recoveryResponse.status} ${recoveryResponse.statusText}`);
      const errorText = await recoveryResponse.text();
      console.log('❌ Recovery error details:', errorText);
      
      // Try alternative endpoint - cycle data often contains recovery
      console.log('🔍 Trying recovery via cycle v1 API...');
      const cycleURL = `https://api.prod.whoop.com/developer/v1/cycle`;
      console.log('🔍 Cycle URL:', cycleURL);
      const cycleResponse = await fetch(cycleURL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'MyWhoopApp/1.0'
        }
      });
      
      if (cycleResponse.ok) {
        const cycleData = await cycleResponse.json();
        console.log('✅ Cycle data (v1) fetched successfully:', cycleData);
        // Log the actual recovery score structure for debugging
        if (cycleData?.records?.[0]?.score) {
          console.log('🔍 Recovery score structure:', JSON.stringify(cycleData.records[0].score, null, 2));
        }
        // Extract recovery data from cycle data if available
        recoveryData = cycleData;
      } else {
        console.log(`❌ Cycle API (v1) also failed: ${cycleResponse.status} ${cycleResponse.statusText}`);
        const cycleErrorText = await cycleResponse.text();
        console.log('❌ Cycle error details:', cycleErrorText);
      }
    }

    // Get recent sleep data (trying v1 API)
    console.log('🔍 Trying sleep v1 API...');
    const sleepResponse = await fetch(`https://api.prod.whoop.com/developer/v1/activity/sleep`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MyWhoopApp/1.0'
      }
    });

    let sleepData = null;
    if (sleepResponse.ok) {
      sleepData = await sleepResponse.json();
      console.log('✅ Sleep data (v1) fetched successfully:', sleepData);
    } else {
      console.error('❌ Sleep API (v1) failed:', sleepResponse.status, sleepResponse.statusText);
      const errorText = await sleepResponse.text();
      console.error('❌ Sleep error details:', errorText);
    }

    // Get recent strain/workout data (trying v1 API)
    console.log('🔍 Trying strain v1 API...');
    const strainResponse = await fetch(`https://api.prod.whoop.com/developer/v1/activity/workout`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MyWhoopApp/1.0'
      }
    });

    let strainData = null;
    if (strainResponse.ok) {
      strainData = await strainResponse.json();
      console.log('✅ Strain data (v1) fetched successfully:', strainData);
    } else {
      console.log(`❌ Strain API (v1) failed: ${strainResponse.status} ${strainResponse.statusText}`);
      const errorText = await strainResponse.text();
      console.log('❌ Strain error details:', errorText);
    }

    // Return all the data
    console.log('🔍 Final data being returned:');
    console.log('Profile:', profileData ? 'AVAILABLE' : 'NULL');
    console.log('Measurements:', measurementsData ? 'AVAILABLE' : 'NULL');
    console.log('Recovery:', recoveryData ? 'AVAILABLE' : 'NULL');
    console.log('Sleep:', sleepData ? 'AVAILABLE' : 'NULL');
    console.log('Strain:', strainData ? 'AVAILABLE' : 'NULL');
    
    res.status(200).json({
      profile: profileData,
      measurements: measurementsData,
      recovery: recoveryData,
      sleep: sleepData,
      strain: strainData,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Whoop API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Whoop data',
      details: error.message 
    });
  }
}
