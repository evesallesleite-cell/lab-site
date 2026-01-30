import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const Header = dynamic(() => import("../../components/header"), { ssr: false });

export default function WhoopSimple() {
  const router = useRouter();
  const [whoopData, setWhoopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWhoopData();
  }, []);

  const fetchWhoopData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whoop-data');
      if (!response.ok) {
        if (response.status === 500) {
          const errorData = await response.json();
          if (errorData.error.includes('access token not configured')) {
            router.push('/whoop-login');
            return;
          }
        }
        throw new Error('Failed to fetch Whoop data');
      }
      const data = await response.json();
      setWhoopData(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get last 7 days of sleep data
  const getLast7Days = () => {
    if (!whoopData?.sleep?.records) return []
    
    return whoopData.sleep.records
      .slice(0, 7)
      .map(record => ({
        date: new Date(record.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sleepScore: record.score?.sleep_performance_percentage || 0,
        efficiency: record.score?.sleep_efficiency_percentage || 0,
        totalSleep: record.score?.stage_summary?.total_in_bed_time_milli ? 
          Math.round(record.score.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60 * 100)) / 100 : 0,
        deepSleep: record.score?.stage_summary?.total_slow_wave_sleep_time_milli ?
          Math.round(record.score.stage_summary.total_slow_wave_sleep_time_milli / (1000 * 60)) : 0,
        remSleep: record.score?.stage_summary?.total_rem_sleep_time_milli ?
          Math.round(record.score.stage_summary.total_rem_sleep_time_milli / (1000 * 60)) : 0,
        lightSleep: record.score?.stage_summary?.total_light_sleep_time_milli ?
          Math.round(record.score.stage_summary.total_light_sleep_time_milli / (1000 * 60)) : 0
      }))
      .reverse()
  }

  // Download CSV functionality
  const downloadCSV = () => {
    if (!whoopData?.sleep?.records) return

    const csvData = whoopData.sleep.records.map(record => ({
      date: new Date(record.start).toISOString().split('T')[0],
      sleepScore: record.score?.sleep_performance_percentage || 'N/A'
    }))

    const csvContent = [
      ['Date', 'Sleep Score'],
      ...csvData.map(row => [row.date, row.sleepScore])
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `whoop_sleep_data_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sleep data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading data: {error}</p>
          <button
            onClick={fetchWhoopData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!whoopData || !whoopData.sleep || !whoopData.sleep.records) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No sleep data available</p>
          <button
            onClick={fetchWhoopData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const last7Days = getLast7Days()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sleep Dashboard (Simple View)</h1>
          <div className="flex gap-4">
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              Download CSV
            </button>
            <button
              onClick={fetchWhoopData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {last7Days.length > 0 && (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Latest Sleep Score</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {last7Days[last7Days.length - 1]?.sleepScore?.toFixed(0) || 0}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">7-Day Average</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {last7Days.length > 0 ? 
                    (last7Days.reduce((sum, day) => sum + (day.sleepScore || 0), 0) / last7Days.length).toFixed(0) : 0}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Avg Sleep Time</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {last7Days.length > 0 ? 
                    (last7Days.reduce((sum, day) => sum + (day.totalSleep || 0), 0) / last7Days.length).toFixed(1) : 0}h
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Avg Efficiency</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {last7Days.length > 0 ? 
                    (last7Days.reduce((sum, day) => sum + (day.efficiency || 0), 0) / last7Days.length).toFixed(0) : 0}%
                </p>
              </div>
            </>
          )}
        </div>

        {/* Last 7 Days Table */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Last 7 Days Sleep Data</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sleep Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sleep</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deep Sleep</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REM Sleep</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Light Sleep</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {last7Days.map((day, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        day.sleepScore >= 85 ? 'bg-green-100 text-green-800' :
                        day.sleepScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {day.sleepScore.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.efficiency.toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.totalSleep.toFixed(1)}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.deepSleep} min</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.remSleep} min</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.lightSleep} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Raw Data Debug */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <p className="text-sm text-gray-600 mb-2">Total sleep records: {whoopData?.sleep?.records?.length || 0}</p>
          <p className="text-sm text-gray-600 mb-2">Last updated: {new Date().toLocaleString()}</p>
          <p className="text-sm text-gray-600">
            API Status: {whoopData ? 'Connected' : 'Not Connected'}
          </p>
        </div>
      </div>
    </div>
  )
}
