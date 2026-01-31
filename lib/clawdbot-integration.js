// Clawdbot Health API Integration for Lab-site
// Fetches real-time health data from Clawdbot

const CLAWDBOT_API = process.env.CLAWDBOT_API_URL || 'http://localhost:3002';

export interface HealthData {
  whoop?: {
    recovery_score: number;
    resting_heart_rate: number;
    hrv: number;
    spo2: number;
    skin_temp: number;
    strain: number;
    sleep_hours: number | null;
  };
  profile?: {
    goals: string[];
    latest_health: Array<{
      metric: string;
      date: string;
    }>;
  };
}

export async function fetchHealthData(): Promise<HealthData | null> {
  try {
    const response = await fetch(`${CLAWDBOT_API}/api/health`);
    if (!response.ok) {
      throw new Error('Failed to fetch health data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching health data:', error);
    return null;
  }
}

export async function fetchProfile(): Promise<any | null> {
  try {
    const response = await fetch(`${CLAWDBOT_API}/api/profile`);
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function searchMemories(query: string): Promise<any[]> {
  try {
    const response = await fetch(`${CLAWDBOT_API}/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search memories');
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching memories:', error);
    return [];
  }
}

export async function getDailyNote(date?: string): Promise<string | null> {
  try {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const response = await fetch(`${CLAWDBOT_API}/api/daily?date=${dateParam}`);
    if (!response.ok) {
      throw new Error('Failed to fetch daily note');
    }
    const data = await response.json();
    return data.note || null;
  } catch (error) {
    console.error('Error fetching daily note:', error);
    return null;
  }
}

// Health insights from Clawdbot
export async function getHealthInsights(): Promise<string[]> {
  const insights: string[] = [];
  
  try {
    const healthData = await fetchHealthData();
    
    if (healthData?.whoop) {
      const { recovery_score, strain, hrv } = healthData.whoop;
      
      if (recovery_score >= 70) {
        insights.push('✅ Recovery is optimal - great day for high-intensity training');
      } else if (recovery_score >= 40) {
        insights.push('⚠️ Recovery is moderate - consider active recovery or lighter workout');
      } else {
        insights.push('❌ Recovery is low - prioritize rest and sleep tonight');
      }
      
      if (strain >= 14) {
        insights.push('🔥 High strain yesterday - ensure proper nutrition and recovery');
      }
      
      if (hrv < 50) {
        insights.push('💡 HRV is below baseline - monitor stress levels and sleep quality');
      }
    }
    
    // Get goals from profile
    if (healthData?.profile?.goals) {
      insights.push(`🎯 Goal tracking: ${healthData.profile.goals.length} active goals`);
    }
    
  } catch (error) {
    console.error('Error getting health insights:', error);
  }
  
  return insights;
}

export default {
  fetchHealthData,
  fetchProfile,
  searchMemories,
  getDailyNote,
  getHealthInsights,
};
