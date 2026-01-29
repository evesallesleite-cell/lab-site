// Eve's Proactive Health Insights
// Automatic analysis and recommendations based on João's health data

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function EveInsights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    loadDataAndGenerateInsights();
  }, []);

  const loadDataAndGenerateInsights = async () => {
    try {
      const response = await fetch('/api/personal/unified-data');
      const data = await response.json();
      
      if (data.success) {
        setHealthData(data.data);
        generateInsights(data.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      generateFallbackInsights();
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (data) => {
    const newInsights = [];
    const whoop = data.whoop || {};
    const supplements = data.supplements || {};
    const bloodTests = data.bloodTests || {};

    // Sleep insights
    if (whoop.sleep && whoop.sleep.length > 0) {
      const recentSleep = whoop.sleep.slice(0, 7);
      const avgPerformance = recentSleep.reduce((a, s) => a + (s.score?.sleep_performance_percentage || 0), 0) / recentSleep.length;
      const avgEfficiency = recentSleep.reduce((a, s) => a + (s.score?.sleep_efficiency_percentage || 0), 0) / recentSleep.length;
      
      newInsights.push({
        id: 'sleep-performance',
        category: '💤 Sleep',
        type: avgPerformance >= 90 ? 'positive' : avgPerformance >= 75 ? 'neutral' : 'concern',
        title: avgPerformance >= 90 ? 'Excellent Sleep Performance' : avgPerformance >= 75 ? 'Good Sleep Performance' : 'Sleep Performance Needs Attention',
        description: `Your average sleep performance is ${avgPerformance.toFixed(0)}% over the last 7 nights. ${avgPerformance >= 90 ? 'Keep up the great work!' : avgPerformance >= 75 ? 'Room for improvement with consistent bedtime.' : 'Consider reviewing your evening routine and sleep environment.'}`,
        metric: `${avgPerformance.toFixed(0)}%`,
        recommendation: avgPerformance < 85 ? 'Try consistent sleep/wake times and reduce screen time 1hr before bed.' : null
      });

      if (avgEfficiency < 90) {
        newInsights.push({
          id: 'sleep-efficiency',
          category: '💤 Sleep',
          type: 'concern',
          title: 'Sleep Efficiency Below Optimal',
          description: `You're averaging ${avgEfficiency.toFixed(1)}% sleep efficiency. Aim for 95%+ for optimal recovery.`,
          metric: `${avgEfficiency.toFixed(1)}%`,
          recommendation: 'Consider reducing fluid intake before bed and ensuring your room is completely dark.'
        });
      }
    }

    // Strain/Workout insights
    if (whoop.strain && whoop.strain.length > 0) {
      const recentStrain = whoop.strain.slice(0, 30);
      const avgStrain = recentStrain.reduce((a, s) => a + (s.score?.strain || 0), 0) / recentStrain.length;
      const gymSessions = recentStrain.filter(s => s.sport_id === 45);
      const avgGymStrain = gymSessions.length > 0 
        ? gymSessions.reduce((a, s) => a + (s.score?.strain || 0), 0) / gymSessions.length 
        : 0;

      newInsights.push({
        id: 'strain-pattern',
        category: '🏋️ Training',
        type: avgStrain > 12 ? 'positive' : avgStrain > 8 ? 'neutral' : 'low',
        title: 'Training Strain Analysis',
        description: `Average daily strain of ${avgStrain.toFixed(1)}/21. ${avgStrain > 12 ? 'Great activity level!' : avgStrain > 8 ? 'Moderate activity — consider increasing intensity.' : 'Low activity — try to move more during the day.'}`,
        metric: `${avgStrain.toFixed(1)}/21`,
        recommendation: avgStrain < 10 ? 'Add 15-20 min of walking or light activity on rest days.' : null
      });

      if (gymSessions.length > 0) {
        newInsights.push({
          id: 'gym-performance',
          category: '🏋️ Training',
          type: avgGymStrain > 14 ? 'positive' : avgGymStrain > 10 ? 'neutral' : 'low',
          title: 'Gym Performance',
          description: `${gymSessions.length} gym sessions this month with avg strain ${avgGymStrain.toFixed(1)}. ${avgGymStrain > 14 ? 'Strong effort!' : 'Consider progressive overload.'}`,
          metric: `${avgGymStrain.toFixed(1)} avg`,
          recommendation: avgGymStrain < 12 ? 'Focus on intensity over duration for better results.' : null
        });
      }
    }

    // Supplement timing insights
    if (supplements.stack && supplements.stack.length > 0) {
      const morningSupps = supplements.stack.filter(s => s.timing === 'Pre-breakfast' || s.timing === 'Breakfast');
      const preWorkout = supplements.stack.filter(s => s.timing?.includes('Workout'));
      const bedTime = supplements.stack.filter(s => s.timing === 'Before Bed');

      newInsights.push({
        id: 'supplement-timing',
        category: '💊 Supplements',
        type: 'positive',
        title: 'Well-Structured Supplement Stack',
        description: `Your ${supplements.totalSupplements} supplements are well-distributed: ${morningSupps.length} morning, ${preWorkout.length} pre-workout, ${bedTime.length} before bed.`,
        metric: `${supplements.totalSupplements} supplements`,
        recommendation: 'This timing optimizes absorption and minimizes interactions.'
      });

      // Check for potential interactions
      const hasCaffeine = supplements.stack.some(s => s.name.toLowerCase().includes('pre-workout') || s.name.toLowerCase().includes('caffeine'));
      const hasSleepSupps = bedTime.length > 0;
      
      if (hasCaffeine && hasSleepSupps) {
        newInsights.push({
          id: 'stimulant-timing',
          category: '💊 Supplements',
          type: 'neutral',
          title: 'Stimulant Timing Check',
          description: 'You have pre-workout stimulants AND sleep supplements. Ensure you take stimulants at least 6-8 hours before bed.',
          recommendation: 'Consider taking sleep supplements 30-60 min before bedtime for optimal effect.'
        });
      }
    }

    // Blood test follow-up
    if (bloodTests.lastCollectedDate) {
      const daysSince = Math.floor((Date.now() - new Date(bloodTests.lastCollectedDate)) / (1000 * 60 * 60 * 24));
      
      newInsights.push({
        id: 'blood-test-freshness',
        category: '🩸 Blood Tests',
        type: daysSince > 90 ? 'concern' : 'neutral',
        title: 'Blood Test Recency',
        description: `Your last blood work was ${daysSince} days ago. ${daysSince > 90 ? 'Consider scheduling new tests for up-to-date insights.' : 'Data is fresh and actionable.'}`,
        metric: `${daysSince} days ago`,
        recommendation: daysSince > 90 ? 'Schedule routine bloodwork to track progress on supplements and lifestyle changes.' : null
      });
    }

    // Proactive recommendations based on all data
    if (whoop.sleep && whoop.strain && supplements.stack) {
      const lowRecoveryDays = whoop.recovery?.filter(r => (r.score?.recovery || 0) < 33).length || 0;
      
      if (lowRecoveryDays > 2) {
        newInsights.push({
          id: 'recovery-focus',
          category: '⚡ Recovery',
          type: 'concern',
          title: 'Recovery Protocol Suggestion',
          description: `${lowRecoveryDays} days with recovery below 33% recently. This may indicate accumulated fatigue or stress.`,
          recommendation: 'Consider deload week, prioritize sleep, and ensure nutrition supports recovery (glycine, tart cherry, magnesium).`
        });
      }
    }

    setInsights(newInsights);
  };

  const generateFallbackInsights = () => {
    setInsights([
      {
        id: 'no-data',
        category: '📊 Getting Started',
        type: 'neutral',
        title: 'Connect Your Data',
        description: 'Import your WHOOP data and blood tests to get personalized insights from Eve.',
        recommendation: 'Visit the Data Management section to upload your health data.'
      }
    ]);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'positive': return '#4ade80';
      case 'concern': return '#f87171';
      case 'low': return '#fbbf24';
      default: return '#60a5fa';
    }
  };

  return (
    <>
      <Head>
        <title>Eve's Insights - Proactive Health Analysis</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#fff',
        padding: '30px'
      }}>
        {/* Header */}
        <div style={{ maxWidth: '1200px', margin: '0 auto 30px' }}>
          <Link href="/home" style={{ color: '#667eea', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ fontSize: '32px', margin: '10px 0' }}>
            🤖 Eve's Proactive Insights
          </h1>
          <p style={{ opacity: 0.7 }}>
            AI-powered analysis of your health data with actionable recommendations
          </p>
        </div>

        {/* Stats Overview */}
        {healthData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            maxWidth: '1200px',
            margin: '0 auto 40px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.6 }}>Sleep Records</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                {healthData.whoop?.sleep?.length || 0}
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.6 }}>Workouts</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                {healthData.whoop?.strain?.length || 0}
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.6 }}>Blood Markers</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                {healthData.bloodTests?.totalAnalytes || 0}
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.6 }}>Supplements</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                {healthData.supplements?.totalSupplements || 0}
              </div>
            </div>
          </div>
        )}

        {/* Insights Grid */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>
            📋 Analysis Results ({insights.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(102, 126, 234, 0.3)',
                borderTop: '3px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }} />
              <p>Analyzing your health data...</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '20px'
            }}>
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: `1px solid ${getTypeColor(insight.type)}40`,
                    borderLeft: `4px solid ${getTypeColor(insight.type)}`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '14px', opacity: 0.6 }}>
                      {insight.category}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      background: `${getTypeColor(insight.type)}20`,
                      color: getTypeColor(insight.type)
                    }}>
                      {insight.type}
                    </span>
                  </div>
                  
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>
                    {insight.title}
                  </h3>
                  
                  <p style={{ margin: '0 0 16px 0', opacity: 0.8, lineHeight: 1.6 }}>
                    {insight.description}
                  </p>

                  {insight.metric && (
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      background: 'rgba(102, 126, 234, 0.2)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: insight.recommendation ? '16px' : 0
                    }}>
                      {insight.metric}
                    </div>
                  )}

                  {insight.recommendation && (
                    <div style={{
                      padding: '16px',
                      background: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '12px',
                      marginTop: '16px'
                    }}>
                      <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>
                        💡 RECOMMENDATION
                      </div>
                      <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
                        {insight.recommendation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Eve Chat CTA */}
        <div style={{
          maxWidth: '1200px',
          margin: '60px auto 0',
          padding: '40px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
          borderRadius: '20px',
          textAlign: 'center',
          border: '1px solid rgba(102, 126, 234, 0.3)'
        }}>
          <h2 style={{ margin: '0 0 16px 0' }}>Want to dive deeper?</h2>
          <p style={{ margin: '0 0 24px 0', opacity: 0.8 }}>
            Chat with Eve AI for personalized analysis and answers to your specific questions.
          </p>
          <Link href="/eve" style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '30px',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '16px'
          }}>
            Chat with Eve →
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
