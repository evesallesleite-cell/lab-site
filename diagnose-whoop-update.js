// Diagnostic script to test WHOOP data update mechanism
// Run this to test if the data update issue is in the API or frontend

console.log('🔧 WHOOP Data Update Diagnostic');

async function testDataUpdate() {
  console.log('\n1️⃣ Testing stored data API...');
  
  try {
    const storedResponse = await fetch('/api/whoop-stored-data');
    if (storedResponse.ok) {
      const storedData = await storedResponse.json();
      console.log('✅ Stored data API working');
      console.log('📊 Current data summary:');
      console.log(`   Sleep records: ${storedData.data?.sleep?.records?.length || 0}`);
      console.log(`   Strain records: ${storedData.data?.strain?.records?.length || 0}`);
      console.log(`   Recovery records: ${storedData.data?.recovery?.records?.length || 0}`);
      
      if (storedData.data?.sleep?.lastUpdated) {
        console.log(`   Last updated: ${new Date(storedData.data.sleep.lastUpdated).toLocaleString()}`);
      }
    } else {
      console.error('❌ Stored data API failed:', storedResponse.status, storedResponse.statusText);
    }
  } catch (error) {
    console.error('❌ Error calling stored data API:', error);
  }

  console.log('\n2️⃣ Testing incremental update API...');
  
  try {
    const updateResponse = await fetch('/api/whoop-incremental');
    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('✅ Incremental update API working');
      console.log('🔄 Update results:');
      
      ['sleep', 'strain', 'recovery'].forEach(type => {
        if (updateData.data?.[type]) {
          const newRecords = updateData.data[type].newRecordsFetched || 0;
          const totalRecords = updateData.data[type].totalCount || 0;
          console.log(`   ${type}: ${newRecords} new records, ${totalRecords} total`);
        }
      });
    } else {
      if (updateResponse.status === 401) {
        console.log('❌ Authentication required - need to login to WHOOP first');
      } else {
        console.error('❌ Incremental update API failed:', updateResponse.status, updateResponse.statusText);
        const errorText = await updateResponse.text();
        console.error('   Error details:', errorText);
      }
    }
  } catch (error) {
    console.error('❌ Error calling incremental update API:', error);
  }

  console.log('\n3️⃣ Testing data store...');
  
  if (typeof window !== 'undefined') {
    const isLoggedIn = localStorage.getItem("loggedIn") === "true";
    console.log(`   Authentication status: ${isLoggedIn ? 'Logged in' : 'Not logged in'}`);
    
    const cachedData = localStorage.getItem('whoop-data-cache');
    const cachedTimestamps = localStorage.getItem('whoop-data-timestamps');
    
    if (cachedData && cachedTimestamps) {
      console.log('   Local cache exists');
      try {
        const parsedData = JSON.parse(cachedData);
        const parsedTimestamps = JSON.parse(cachedTimestamps);
        
        ['sleep', 'strain', 'recovery'].forEach(type => {
          if (parsedData[type]?.records) {
            const cacheAge = parsedTimestamps[type] ? Date.now() - parsedTimestamps[type] : 'Unknown';
            console.log(`   ${type}: ${parsedData[type].records.length} records (cache age: ${typeof cacheAge === 'number' ? Math.round(cacheAge / 60000) + ' minutes' : cacheAge})`);
          }
        });
      } catch (error) {
        console.error('   Error parsing cached data:', error);
      }
    } else {
      console.log('   No local cache found');
    }
  }

  console.log('\n🔧 Diagnostic complete!');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testDataUpdate();
}

// Export for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = { testDataUpdate };
}
