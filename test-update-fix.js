// Test script to verify WHOOP data update fix
// Open browser console and run this to test the update mechanism

console.log('🧪 Testing WHOOP Data Update Fix...');

async function testUpdateFix() {
  // Import the data store
  const { getWhoopDataStore } = await import('/lib/whoop-data-store-v2.js');
  const dataStore = getWhoopDataStore();
  
  if (!dataStore) {
    console.error('❌ Could not get data store');
    return;
  }

  console.log('\n1️⃣ Initial data check...');
  const initialSleepData = dataStore.getData('sleep');
  console.log(`Initial sleep records: ${initialSleepData?.records?.length || 0}`);
  
  if (initialSleepData?.lastUpdated) {
    console.log(`Last updated: ${new Date(initialSleepData.lastUpdated).toLocaleString()}`);
  }

  console.log('\n2️⃣ Testing force reload from files...');
  await dataStore.forceReloadFromFiles();
  
  const reloadedSleepData = dataStore.getData('sleep');
  console.log(`After reload sleep records: ${reloadedSleepData?.records?.length || 0}`);

  console.log('\n3️⃣ Testing incremental update...');
  try {
    await dataStore.fetchIncrementalUpdates(false);
    
    const updatedSleepData = dataStore.getData('sleep');
    console.log(`After update sleep records: ${updatedSleepData?.records?.length || 0}`);
    
    if (updatedSleepData?.lastUpdated) {
      console.log(`New last updated: ${new Date(updatedSleepData.lastUpdated).toLocaleString()}`);
    }
    
    console.log('✅ Update test completed successfully!');
  } catch (error) {
    console.error('❌ Update test failed:', error.message);
    
    if (error.message.includes('401') || error.message.includes('authentication')) {
      console.log('💡 Authentication required - try logging in to WHOOP first');
    }
  }
}

// Run the test
testUpdateFix().catch(console.error);
