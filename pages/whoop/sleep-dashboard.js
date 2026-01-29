import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function SleepDashboard() {
  const [sleepData, setSleepData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSleepData()
  }, [])

  const fetchSleepData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whoop-data')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setSleepData(data.sleep)
      setError(null)
    } catch (error) {
      console.error('Failed to fetch sleep data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Get last 7 days of sleep data
  const getLast7Days = () => {
    if (!sleepData?.records) return []
    
    return sleepData.records
      .slice(0, 7)
      .map(record => ({
        date: new Date(record.start).toLocaleDateString(),
        sleepScore: record.score?.stage_summary?.score ? (record.score.stage_summary.score / 100) : 0, // Fix percentage
        efficiency: record.score?.stage_summary?.sleep_efficiency_percentage || 0,
        totalSleep: record.score?.stage_summary?.total_in_bed_time_milli ? 
          Math.round(record.score.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60 * 100)) / 100 : 0, // Convert to hours
        deepSleep: record.score?.stage_summary?.slow_wave_sleep_time_milli ?
          Math.round(record.score.stage_summary.slow_wave_sleep_time_milli / (1000 * 60)) : 0, // Convert to minutes
        remSleep: record.score?.stage_summary?.rem_sleep_time_milli ?
          Math.round(record.score.stage_summary.rem_sleep_time_milli / (1000 * 60)) : 0, // Convert to minutes
        lightSleep: record.score?.stage_summary?.light_sleep_time_milli ?
          Math.round(record.score.stage_summary.light_sleep_time_milli / (1000 * 60)) : 0 // Convert to minutes
      }))
      .reverse() // Show oldest first
  }

  // Get monthly averages for last 12 months
  const getMonthlyAverages = () => {
    if (!sleepData?.records) return []

    const monthlyData = {}
    const now = new Date()
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        scores: [],
        totalSleep: [],
        efficiency: []
      }
    }

    // Group sleep data by month
    sleepData.records.forEach(record => {
      const date = new Date(record.start)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthlyData[monthKey] && record.score?.stage_summary?.score) {
        monthlyData[monthKey].scores.push(record.score.stage_summary.score / 100) // Fix percentage
        if (record.score.stage_summary.sleep_efficiency_percentage) {
          monthlyData[monthKey].efficiency.push(record.score.stage_summary.sleep_efficiency_percentage)
        }
        if (record.score.stage_summary.total_in_bed_time_milli) {
          monthlyData[monthKey].totalSleep.push(record.score.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60)) // Hours
        }
      }
    })

    // Calculate averages
    return Object.values(monthlyData)
      .filter(month => month.scores.length > 0)
      .map(month => ({
        month: month.month,
        avgSleepScore: Math.round((month.scores.reduce((a, b) => a + b, 0) / month.scores.length) * 10) / 10,
        avgEfficiency: month.efficiency.length > 0 ? 
          Math.round((month.efficiency.reduce((a, b) => a + b, 0) / month.efficiency.length) * 10) / 10 : 0,
        avgTotalSleep: month.totalSleep.length > 0 ?
          Math.round((month.totalSleep.reduce((a, b) => a + b, 0) / month.totalSleep.length) * 10) / 10 : 0,
        dataPoints: month.scores.length
      }))
  }

  // Download CSV functionality
  const downloadCSV = () => {
    if (!sleepData?.records) return

    const csvData = sleepData.records.map(record => ({
      date: new Date(record.start).toISOString().split('T')[0], // YYYY-MM-DD format
      sleepScore: record.score?.stage_summary?.score ? (record.score.stage_summary.score / 100) : 'N/A' // Fix percentage
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
            onClick={fetchSleepData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const last7Days = getLast7Days()
  const monthlyAverages = getMonthlyAverages()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sleep Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV
            </button>
            <button
              onClick={fetchSleepData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
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
                <p className="text-2xl font-bold text-gray-900">{last7Days[last7Days.length - 1]?.sleepScore?.toFixed(0)}%</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">7-Day Average</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {(last7Days.reduce((sum, day) => sum + day.sleepScore, 0) / last7Days.length).toFixed(0)}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Avg Sleep Time</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {(last7Days.reduce((sum, day) => sum + day.totalSleep, 0) / last7Days.length).toFixed(1)}h
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Avg Efficiency</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {(last7Days.reduce((sum, day) => sum + day.efficiency, 0) / last7Days.length).toFixed(0)}%
                </p>
              </div>
            </>
          )}
        </div>

        {/* Last 7 Days Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Last 7 Days Sleep Scores</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value.toFixed(0)}%`, 'Sleep Score']} />
              <Legend />
              <Bar dataKey="sleepScore" fill="#3B82F6" name="Sleep Score %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sleep Stages for Last 7 Days */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Sleep Stages (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} min`, '']} />
              <Legend />
              <Bar dataKey="deepSleep" stackId="a" fill="#1E40AF" name="Deep Sleep (min)" />
              <Bar dataKey="remSleep" stackId="a" fill="#3B82F6" name="REM Sleep (min)" />
              <Bar dataKey="lightSleep" stackId="a" fill="#93C5FD" name="Light Sleep (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Averages Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Monthly Sleep Score Averages (Last 12 Months)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyAverages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'avgSleepScore' ? `${value.toFixed(1)}%` : `${value.toFixed(1)}${name.includes('Sleep') ? 'h' : '%'}`,
                  name === 'avgSleepScore' ? 'Sleep Score' : 
                  name === 'avgTotalSleep' ? 'Total Sleep' : 'Efficiency'
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avgSleepScore" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Avg Sleep Score %" 
              />
              <Line 
                type="monotone" 
                dataKey="avgEfficiency" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Avg Efficiency %" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Data Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Monthly Sleep Summary</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Sleep Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Efficiency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Total Sleep</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Points</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyAverages.map((month, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        month.avgSleepScore >= 85 ? 'bg-green-100 text-green-800' :
                        month.avgSleepScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {month.avgSleepScore.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.avgEfficiency.toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.avgTotalSleep.toFixed(1)}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{month.dataPoints} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Total sleep records: {sleepData?.records?.length || 0}</p>
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
