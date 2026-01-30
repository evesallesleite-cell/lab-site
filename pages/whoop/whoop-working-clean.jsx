import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Avoid SSR issues for the header
const Header = dynamic(() => import("../../components/header"), { ssr: false });

export default function Whoop() {
  const router = useRouter();
  const [whoopData, setWhoopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchWhoopData() {
      try {
        const response = await fetch('/api/whoop-data');
        if (!response.ok) {
          if (response.status === 500) {
            const errorData = await response.json();
            if (errorData.error.includes('access token not configured')) {
              // Redirect to login page if no token is configured
              router.push('/whoop-login');
              return;
            }
          }
          throw new Error('Failed to fetch Whoop data');
        }
        const data = await response.json();
        setWhoopData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWhoopData();
  }, [router]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Prepare chart data
  const prepareRecoveryChartData = () => {
    if (!whoopData?.recovery?.records) return [];
    return whoopData.recovery.records
      .slice(0, 7)
      .reverse()
      .map(record => ({
        date: new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        recovery: record.score ? Math.round(record.score.recovery_score * 100) : 0,
        hrv: record.score ? Math.round(record.score.hrv_rmssd_milli) : 0,
        restingHR: record.score ? record.score.resting_heart_rate : 0,
        skinTemp: record.score ? Number(record.score.skin_temp_celsius?.toFixed(1)) : 0
      }));
  };

  const prepareSleepChartData = () => {
    if (!whoopData?.sleep?.records) return [];
    return whoopData.sleep.records
      .slice(0, 7)
      .reverse()
      .map(record => ({
        date: new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sleepScore: record.score ? Math.round(record.score.sleep_performance_percentage * 100) : 0,
        totalSleep: record.score ? Number((record.score.stage_summary.total_sleep_time_milli / (1000 * 60 * 60)).toFixed(1)) : 0,
        efficiency: record.score ? Math.round(record.score.sleep_efficiency_percentage * 100) : 0,
        deepSleep: record.score ? Number((record.score.stage_summary.slow_wave_sleep_time_milli / (1000 * 60 * 60)).toFixed(1)) : 0,
        remSleep: record.score ? Number((record.score.stage_summary.rem_sleep_time_milli / (1000 * 60 * 60)).toFixed(1)) : 0,
        lightSleep: record.score ? Number((record.score.stage_summary.light_sleep_time_milli / (1000 * 60 * 60)).toFixed(1)) : 0
      }));
  };

  // Get latest stats for summary cards
  const getLatestRecovery = () => {
    if (!whoopData?.recovery?.records?.[0]?.score) return null;
    return whoopData.recovery.records[0].score;
  };

  const getLatestSleep = () => {
    if (!whoopData?.sleep?.records?.[0]?.score) return null;
    return whoopData.sleep.records[0].score;
  };

  const recoveryChartData = prepareRecoveryChartData();
  const sleepChartData = prepareSleepChartData();
  const latestRecovery = getLatestRecovery();
  const latestSleep = getLatestSleep();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🏃‍♂️ Whoop Health Dashboard</h1>
        
        {loading && (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading your Whoop data...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {whoopData && (
          <div className="space-y-6">
            
            {/* SUCCESS MESSAGE */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">🎉 SUCCESS! Your Enhanced Dashboard is Working!</h2>
              <div className="text-sm text-green-700">
                <p>✅ Whoop data loaded successfully!</p>
                <p>Profile: {whoopData.profile ? '✅ Available' : '❌ Missing'}</p>
                <p>Measurements: {whoopData.measurements ? '✅ Available' : '❌ Missing'}</p>
                <p>Recovery: {whoopData.recovery?.records ? `✅ ${whoopData.recovery.records.length} records` : '❌ Missing'}</p>
                <p>Sleep: {whoopData.sleep?.records ? `✅ ${whoopData.sleep.records.length} records` : '❌ Missing'}</p>
                <p>Page loaded at: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Data Status Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Data Availability Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Profile Status */}
                <div className="flex items-center p-3 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Profile</div>
                    <div className={`text-sm ${whoopData.profile ? 'text-green-600' : 'text-red-600'}`}>
                      {whoopData.profile ? '✅ Available' : '❌ Missing'}
                    </div>
                    {whoopData.profile && (
                      <div className="text-xs text-gray-500">
                        User: {whoopData.profile.user_id?.substring(0, 8)}...
                      </div>
                    )}
                  </div>
                </div>

                {/* Measurements Status */}
                <div className="flex items-center p-3 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Body Measurements</div>
                    <div className={`text-sm ${whoopData.measurements?.body?.length ? 'text-green-600' : 'text-red-600'}`}>
                      {whoopData.measurements?.body?.length ? '✅ Available' : '❌ Missing'}
                    </div>
                    {whoopData.measurements?.body?.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {whoopData.measurements.body.length} measurements
                      </div>
                    )}
                  </div>
                </div>

                {/* Recovery Status */}
                <div className="flex items-center p-3 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Recovery Data</div>
                    <div className={`text-sm ${whoopData.recovery?.records?.length ? 'text-green-600' : 'text-red-600'}`}>
                      {whoopData.recovery?.records?.length ? '✅ Available' : '❌ Missing'}
                    </div>
                    {whoopData.recovery?.records?.length ? (
                      <div className="text-xs text-gray-500">
                        {whoopData.recovery.records.length} records
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        No recovery data found
                      </div>
                    )}
                  </div>
                </div>

                {/* Sleep Status */}
                <div className="flex items-center p-3 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Sleep Data</div>
                    <div className={`text-sm ${whoopData.sleep?.records?.length ? 'text-green-600' : 'text-red-600'}`}>
                      {whoopData.sleep?.records?.length ? '✅ Available' : '❌ Missing'}
                    </div>
                    {whoopData.sleep?.records?.length ? (
                      <div className="text-xs text-gray-500">
                        {whoopData.sleep.records.length} records
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        No sleep data found
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Summary Cards Row - Health Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Recovery Score Card */}
              {latestRecovery ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Recovery Score</p>
                      <p className="text-3xl font-bold text-green-600">
                        {Math.round(latestRecovery.recovery_score * 100)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl">💚</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Latest measurement</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Recovery Score</p>
                      <p className="text-2xl font-bold text-gray-400">No Data</p>
                      <p className="text-xs text-red-500">Recovery data unavailable</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-xl">💚</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Check data permissions</p>
                </div>
              )}

              {/* HRV Card */}
              {latestRecovery ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">HRV (RMSSD)</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {Math.round(latestRecovery.hrv_rmssd_milli)}
                      </p>
                      <p className="text-sm text-gray-500">ms</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl">❤️</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Heart Rate Variability</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">HRV (RMSSD)</p>
                      <p className="text-2xl font-bold text-gray-400">No Data</p>
                      <p className="text-xs text-red-500">Recovery data unavailable</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-xl">❤️</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Heart Rate Variability</p>
                </div>
              )}

              {/* Sleep Score Card */}
              {latestSleep ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Sleep Score</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {Math.round(latestSleep.sleep_performance_percentage * 100)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-xl">😴</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Last night</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Sleep Score</p>
                      <p className="text-2xl font-bold text-gray-400">No Data</p>
                      <p className="text-xs text-red-500">Sleep data unavailable</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-xl">😴</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Check data permissions</p>
                </div>
              )}

              {/* Resting Heart Rate Card */}
              {latestRecovery ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Resting HR</p>
                      <p className="text-3xl font-bold text-red-600">
                        {latestRecovery.resting_heart_rate}
                      </p>
                      <p className="text-sm text-gray-500">bpm</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xl">❤️‍🔥</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Current baseline</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Resting HR</p>
                      <p className="text-2xl font-bold text-gray-400">No Data</p>
                      <p className="text-xs text-red-500">Recovery data unavailable</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-xl">❤️‍🔥</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Check data permissions</p>
                </div>
              )}

            </div>

            {/* Available Data Cards - Profile & Measurements */}
            {(whoopData.profile || whoopData.measurements?.body?.length > 0) && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Available Profile Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* User ID Card */}
                  {whoopData.profile && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">User ID</p>
                          <p className="text-lg font-bold text-gray-900">
                            {whoopData.profile.user_id?.substring(0, 8)}...
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 text-xl">👤</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Profile connected</p>
                    </div>
                  )}

                  {/* Height Card */}
                  {whoopData.measurements?.body?.[0]?.height_meter && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Height</p>
                          <p className="text-3xl font-bold text-green-600">
                            {(whoopData.measurements.body[0].height_meter * 100).toFixed(0)}
                          </p>
                          <p className="text-sm text-gray-500">cm</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-xl">📏</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Body measurements</p>
                    </div>
                  )}

                  {/* Weight Card */}
                  {whoopData.measurements?.body?.[0]?.weight_kilogram && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Weight</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {whoopData.measurements.body[0].weight_kilogram.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-500">kg</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xl">⚖️</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Body measurements</p>
                    </div>
                  )}

                  {/* BMI Card (calculated) */}
                  {whoopData.measurements?.body?.[0]?.height_meter && whoopData.measurements?.body?.[0]?.weight_kilogram && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">BMI</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {(whoopData.measurements.body[0].weight_kilogram / (whoopData.measurements.body[0].height_meter ** 2)).toFixed(1)}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 text-xl">📊</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Calculated BMI</p>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recovery Trends Chart */}
              {recoveryChartData.length > 0 ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Recovery & HRV Trends (7 Days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={recoveryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line yAxisId="left" type="monotone" dataKey="recovery" stroke="#10b981" strokeWidth={2} name="Recovery %" />
                      <Line yAxisId="right" type="monotone" dataKey="hrv" stroke="#3b82f6" strokeWidth={2} name="HRV (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Recovery & HRV Trends</h3>
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <span className="text-4xl">📊</span>
                      <p className="mt-2">No recovery data available</p>
                      <p className="text-sm">Charts will appear when data is available</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sleep Quality Chart */}
              {sleepChartData.length > 0 ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Sleep Quality Trends (7 Days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sleepChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line yAxisId="left" type="monotone" dataKey="sleepScore" stroke="#8b5cf6" strokeWidth={2} name="Sleep Score %" />
                      <Line yAxisId="right" type="monotone" dataKey="totalSleep" stroke="#06b6d4" strokeWidth={2} name="Total Sleep (h)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Sleep Quality Trends</h3>
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <span className="text-4xl">😴</span>
                      <p className="mt-2">No sleep data available</p>
                      <p className="text-sm">Charts will appear when data is available</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sleep Stages Chart */}
            {sleepChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Sleep Stages Breakdown (7 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sleepChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="deepSleep" stackId="a" fill="#1f2937" name="Deep Sleep (h)" />
                    <Bar dataKey="remSleep" stackId="a" fill="#6366f1" name="REM Sleep (h)" />
                    <Bar dataKey="lightSleep" stackId="a" fill="#94a3b8" name="Light Sleep (h)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Data Timestamp */}
            <div className="text-center text-sm text-gray-500">
              Data last updated: {formatDate(whoopData.fetchedAt)} at {formatTime(whoopData.fetchedAt)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
