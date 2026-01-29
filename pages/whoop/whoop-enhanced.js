import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const Header = dynamic(() => import("../../components/header"), { ssr: false });

// Chart.js components with SSR disabled
const Bar = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Bar })), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Line })), { ssr: false });

// Register Chart.js components
const ChartJSLoader = dynamic(() => import('../../components/ChartJSLoader'), { ssr: false });

export default function WhoopEnhanced() {
  const router = useRouter();
  const [whoopData, setWhoopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    fetchWhoopData();
  }, []);

  const fetchWhoopData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching ALL historical Whoop data...');
      const response = await fetch('/api/whoop/whoop-all-data');
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
      console.log('📊 Received complete historical data:', data);
      setWhoopData(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get monthly averages for ALL TIME
  const getMonthlyAverages = () => {
    if (!whoopData?.sleep?.records) return []

    const monthlyData = {}
    
    // Group sleep data by month for ALL records
    whoopData.sleep.records.forEach(record => {
      const date = new Date(record.start)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthLabel,
          scores: [],
          efficiency: [],
          totalSleep: []
        }
      }
      
      if (record.score?.sleep_performance_percentage) {
        monthlyData[monthKey].scores.push(record.score.sleep_performance_percentage)
        if (record.score?.sleep_efficiency_percentage) {
          monthlyData[monthKey].efficiency.push(record.score.sleep_efficiency_percentage)
        }
        if (record.score?.stage_summary?.total_in_bed_time_milli) {
          monthlyData[monthKey].totalSleep.push(record.score.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60))
        }
      }
    })

    // Calculate averages and sort by date
    return Object.entries(monthlyData)
      .filter(([_, month]) => month.scores && month.scores.length > 0)
      .map(([monthKey, month]) => ({
        monthKey,
        month: month.month,
        avgSleepScore: month.scores.length > 0 ? 
          Math.round((month.scores.reduce((a, b) => a + b, 0) / month.scores.length) * 10) / 10 : 0,
        avgEfficiency: month.efficiency && month.efficiency.length > 0 ? 
          Math.round((month.efficiency.reduce((a, b) => a + b, 0) / month.efficiency.length) * 10) / 10 : 0,
        avgTotalSleep: month.totalSleep && month.totalSleep.length > 0 ?
          Math.round((month.totalSleep.reduce((a, b) => a + b, 0) / month.totalSleep.length) * 10) / 10 : 0,
        dataPoints: month.scores.length
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey)) // Sort chronologically
  }

  // Get yearly averages
  const getYearlyAverages = () => {
    if (!whoopData?.sleep?.records) return []

    const yearlyData = {}
    
    whoopData.sleep.records.forEach(record => {
      const date = new Date(record.start)
      const year = date.getFullYear()
      
      if (!yearlyData[year]) {
        yearlyData[year] = {
          year: year.toString(),
          scores: [],
          efficiency: [],
          totalSleep: []
        }
      }
      
      if (record.score?.sleep_performance_percentage) {
        yearlyData[year].scores.push(record.score.sleep_performance_percentage)
        if (record.score?.sleep_efficiency_percentage) {
          yearlyData[year].efficiency.push(record.score.sleep_efficiency_percentage)
        }
        if (record.score?.stage_summary?.total_in_bed_time_milli) {
          yearlyData[year].totalSleep.push(record.score.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60))
        }
      }
    })

    return Object.values(yearlyData)
      .filter(year => year.scores && year.scores.length > 0)
      .map(year => ({
        year: year.year,
        avgSleepScore: year.scores.length > 0 ? 
          Math.round((year.scores.reduce((a, b) => a + b, 0) / year.scores.length) * 10) / 10 : 0,
        avgEfficiency: year.efficiency && year.efficiency.length > 0 ? 
          Math.round((year.efficiency.reduce((a, b) => a + b, 0) / year.efficiency.length) * 10) / 10 : 0,
        avgTotalSleep: year.totalSleep && year.totalSleep.length > 0 ?
          Math.round((year.totalSleep.reduce((a, b) => a + b, 0) / year.totalSleep.length) * 10) / 10 : 0,
        dataPoints: year.scores.length
      }))
      .sort((a, b) => a.year.localeCompare(b.year))
  }

  // Download comprehensive CSV
  const downloadCSV = () => {
    if (!whoopData?.sleep?.records) return

    const csvData = whoopData.sleep.records.map(record => ({
      date: new Date(record.start).toISOString().split('T')[0],
      sleepScore: record.score?.sleep_performance_percentage || 'N/A',
      efficiency: record.score?.sleep_efficiency_percentage || 'N/A',
      totalSleepHours: record.score?.stage_summary?.total_in_bed_time_milli ? 
        (record.score.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60)).toFixed(2) : 'N/A',
      deepSleepMin: record.score?.stage_summary?.total_slow_wave_sleep_time_milli ?
        Math.round(record.score.stage_summary.total_slow_wave_sleep_time_milli / (1000 * 60)) : 'N/A',
      remSleepMin: record.score?.stage_summary?.total_rem_sleep_time_milli ?
        Math.round(record.score.stage_summary.total_rem_sleep_time_milli / (1000 * 60)) : 'N/A',
      lightSleepMin: record.score?.stage_summary?.total_light_sleep_time_milli ?
        Math.round(record.score.stage_summary.total_light_sleep_time_milli / (1000 * 60)) : 'N/A'
    }))

    const csvContent = [
      ['Date', 'Sleep Score %', 'Efficiency %', 'Total Sleep (hrs)', 'Deep Sleep (min)', 'REM Sleep (min)', 'Light Sleep (min)'],
      ...csvData.map(row => [row.date, row.sleepScore, row.efficiency, row.totalSleepHours, row.deepSleepMin, row.remSleepMin, row.lightSleepMin])
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `whoop_complete_sleep_history_${new Date().toISOString().split('T')[0]}.csv`)
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
          <p className="mt-4 text-gray-600">Loading ALL sleep data...</p>
          <p className="mt-2 text-sm text-gray-500">This may take a moment for 2 years of data</p>
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

  const monthlyAverages = getMonthlyAverages()
  const yearlyAverages = getYearlyAverages()

  // Chart.js configurations for historical data
  const monthlyChartData = {
    labels: monthlyAverages.map(month => month.month),
    datasets: [
      {
        label: 'Monthly Avg Sleep Score %',
        data: monthlyAverages.map(month => month.avgSleepScore),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const yearlyChartData = {
    labels: yearlyAverages.map(year => year.year),
    datasets: [
      {
        label: 'Yearly Avg Sleep Score %',
        data: yearlyAverages.map(year => year.avgSleepScore),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ChartJSLoader onReady={() => setChartsReady(true)} />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete Sleep History Dashboard</h1>
          <div className="flex gap-4 mb-4">
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              Download Complete History CSV
            </button>
            <button
              onClick={fetchWhoopData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              Refresh All Data
            </button>
          </div>
          
          {/* Data Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">📊 Your Sleep Data Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Total Records:</span> 
                <span className="ml-2 text-blue-900">{whoopData?.sleep?.total_count || 0}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Date Range:</span> 
                <span className="ml-2 text-blue-900">
                  {whoopData?.sleep?.date_range?.earliest} to {whoopData?.sleep?.date_range?.latest}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Years of Data:</span> 
                <span className="ml-2 text-blue-900">{yearlyAverages.length} years</span>
              </div>
            </div>
          </div>
        </div>

        {/* Yearly Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {yearlyAverages.map((year, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">{year.year} Average</h3>
              <p className="text-2xl font-bold text-gray-900">{year.avgSleepScore.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{year.dataPoints} nights</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        {chartsReady && (
          <>
            {/* Yearly Overview Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-4">Yearly Sleep Score Averages</h2>
              <div style={{ height: '300px' }}>
                <Bar data={yearlyChartData} options={chartOptions} />
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-4">Monthly Sleep Trend (All Time)</h2>
              <div style={{ height: '400px' }}>
                <Line data={monthlyChartData} options={chartOptions} />
              </div>
            </div>
          </>
        )}

        {/* Monthly Data Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Complete Monthly History</h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Sleep Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Efficiency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Total Sleep</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nights</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyAverages.slice().reverse().map((month, index) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{month.dataPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Total sleep records: {whoopData?.sleep?.total_count || 0}</p>
          <p>Pages fetched: {whoopData?.pagination_info?.pages_fetched || 0}</p>
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
