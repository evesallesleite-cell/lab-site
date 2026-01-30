import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { checkAuthAndRedirect, handleApiError } from "../../lib/auth-utils";
import { getWhoopDataStore } from "../../lib/whoop-data-store-v2";

const Header = dynamic(() => import("../../components/header"), { ssr: false });

// Chart.js components with SSR disabled
const Bar = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Bar })), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Line })), { ssr: false });

// Register Chart.js components
const ChartJSLoader = dynamic(() => import('../../components/ChartJSLoader.jsx'), { ssr: false });

export default function Recovery() {
  const router = useRouter();
  const [recoveryData, setRecoveryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartsReady, setChartsReady] = useState(false);
  const dataStore = getWhoopDataStore();

  // Format date to dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
  };

  // Format date and time to dd/mm/yyyy hh:mm
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    // Initialize data loading without authentication check
    const initializeData = async () => {
      // Subscribe to data store updates
      const unsubscribe = dataStore?.subscribe((data, loadingStates, errors) => {
        if (data.recovery) {
          setRecoveryData({ recovery: data.recovery, profile: data.profile });
        }
        setLoading(loadingStates.recovery || false);
        setError(errors.recovery || "");
      });

      // Check if we need to automatically update data after returning from authentication
      if (typeof window !== 'undefined') {
        const needsDataUpdate = localStorage.getItem('needsDataUpdate');
        if (needsDataUpdate === 'true') {
          console.log('🔄 Auto-updating recovery data after authentication...');
          localStorage.removeItem('needsDataUpdate'); // Clear the flag
          
          // Wait a moment for data store to be ready, then trigger update
          setTimeout(async () => {
            try {
              await dataStore?.fetchIncrementalUpdates(false);
              const updatedRecoveryData = dataStore?.getData('recovery');
              
              if (updatedRecoveryData) {
                setRecoveryData({ recovery: updatedRecoveryData });
                console.log('✅ Auto-update completed after authentication');
              }
            } catch (error) {
              console.error('❌ Auto-update failed:', error);
              setError(error.message);
            }
          }, 1000);
        }
      }

      // Check if we already have data
      if (dataStore) {
        const cachedRecoveryData = dataStore.getData('recovery');
        if (cachedRecoveryData) {
          setRecoveryData({ recovery: cachedRecoveryData, profile: dataStore.getData('profile') });
          setLoading(false);
        } else {
          // Load from stored files only once
          try {
            await dataStore.fetchAllData();
            const loadedRecoveryData = dataStore.getData('recovery');
            if (loadedRecoveryData) {
              setRecoveryData({ recovery: loadedRecoveryData, profile: dataStore.getData('profile') });
            }
            setLoading(false);
          } catch (err) {
            console.warn('Failed to load stored data:', err);
            setError(err.message);
            setLoading(false);
          }
        }
      }

      return unsubscribe;
    };
    
    initializeData();
  }, []);

  const fetchRecoveryData = async () => {
    if (dataStore) {
      dataStore.clearCache();
      await dataStore.fetchAllData().catch(err => {
        if (!handleApiError(err, router, '/recovery')) {
          setError(err.message);
        }
      });
    }
  };

  // Update function for manual update button
  const refreshRecoveryData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Updating recovery data...');
      
      const dataStore = getWhoopDataStore();
      if (dataStore) {
        // Check if we need to refresh the token based on last update time
        const recoveryData = dataStore.getData('recovery');
        const lastUpdateTime = recoveryData?.lastUpdate;
        const now = new Date();
        const currentTime = now.toISOString();
        
        // Check if last update was more than 5 minutes ago (token might be stale)
        let needsTokenRefresh = false;
        if (lastUpdateTime) {
          const lastUpdate = new Date(lastUpdateTime);
          const timeDiff = now.getTime() - lastUpdate.getTime();
          const minutesDiff = timeDiff / (1000 * 60);
          needsTokenRefresh = minutesDiff > 5; // If last update was more than 5 minutes ago
          
          console.log(`⏰ Last update: ${lastUpdateTime}, Current: ${currentTime}, Minutes ago: ${minutesDiff.toFixed(1)}`);
        } else {
          needsTokenRefresh = true; // No previous update, definitely need to authenticate
          console.log('⏰ No previous update found, authentication required');
        }
        
        if (needsTokenRefresh) {
          console.log('🔐 Token refresh needed, redirecting to login...');
          // Save the current page for return after authentication
          if (typeof window !== 'undefined') {
            localStorage.setItem('returnUrl', window.location.pathname);
            localStorage.setItem('needsDataUpdate', 'true'); // Flag to trigger update after return
            window.location.href = '/whoop/whoop-login';
          }
          return;
        }
        
        // Token is fresh, proceed with update
        await dataStore.fetchIncrementalUpdates(false);
        
        // Update local state with refreshed data
        const updatedRecoveryData = dataStore.getData('recovery');
        
        if (updatedRecoveryData) {
          setRecoveryData({ recovery: updatedRecoveryData });
          console.log('✅ Recovery data update completed successfully');
        }
      }
      
      setError("");
    } catch (err) {
      console.error('Recovery data update error:', err);
      if (!handleApiError(err, router, '/recovery')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get last 7 days of recovery data
  const getLast7Days = () => {
    if (!recoveryData?.recovery?.records) return []
    
    return recoveryData.recovery.records
      .slice(0, 7)
      .map(record => ({
        date: new Date(record.start || record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        recoveryScore: record.score?.recovery_score || 0,
        restingHeartRate: record.score?.resting_heart_rate || 0,
        hrvRmssd: record.score?.hrv_rmssd_milli || 0,
        skinTemp: record.score?.skin_temp_celsius || 0
      }))
      .reverse()
  }

  // Get monthly averages for ALL TIME
  const getMonthlyAverages = () => {
    if (!recoveryData?.recovery?.records) return []

    const monthlyData = {}
    
    // Group ALL recovery data by month
    recoveryData.recovery.records.forEach(record => {
      const date = new Date(record.start || record.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthLabel,
          recoveryScores: [],
          restingHeartRates: [],
          hrvScores: [],
          skinTemps: []
        }
      }
      
      if (record.score?.recovery_score) {
        monthlyData[monthKey].recoveryScores.push(record.score.recovery_score)
        if (record.score?.resting_heart_rate) {
          monthlyData[monthKey].restingHeartRates.push(record.score.resting_heart_rate)
        }
        if (record.score?.hrv_rmssd_milli) {
          monthlyData[monthKey].hrvScores.push(record.score.hrv_rmssd_milli)
        }
        if (record.score?.skin_temp_celsius) {
          monthlyData[monthKey].skinTemps.push(record.score.skin_temp_celsius)
        }
      }
    })

    // Calculate averages and sort chronologically
    return Object.entries(monthlyData)
      .filter(([_, month]) => month.recoveryScores && month.recoveryScores.length > 0)
      .map(([monthKey, month]) => ({
        monthKey,
        month: month.month,
        avgRecoveryScore: month.recoveryScores.length > 0 ? 
          Math.round((month.recoveryScores.reduce((a, b) => a + b, 0) / month.recoveryScores.length) * 10) / 10 : 0,
        avgRestingHeartRate: month.restingHeartRates && month.restingHeartRates.length > 0 ? 
          Math.round((month.restingHeartRates.reduce((a, b) => a + b, 0) / month.restingHeartRates.length) * 10) / 10 : 0,
        avgHrv: month.hrvScores && month.hrvScores.length > 0 ?
          Math.round((month.hrvScores.reduce((a, b) => a + b, 0) / month.hrvScores.length) * 10) / 10 : 0,
        avgSkinTemp: month.skinTemps && month.skinTemps.length > 0 ?
          Math.round((month.skinTemps.reduce((a, b) => a + b, 0) / month.skinTemps.length) * 100) / 100 : 0,
        dataPoints: month.recoveryScores.length
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  }

  // Calculate overall averages across all data
  const getOverallAverages = () => {
    if (!recoveryData?.recovery?.records) return null

    const allRecoveryScores = []
    const allRestingHeartRates = []
    const allHrvScores = []
    const allSkinTemps = []

    recoveryData.recovery.records.forEach(record => {
      if (record.score?.recovery_score) {
        allRecoveryScores.push(record.score.recovery_score)
      }
      if (record.score?.resting_heart_rate) {
        allRestingHeartRates.push(record.score.resting_heart_rate)
      }
      if (record.score?.hrv_rmssd_milli) {
        allHrvScores.push(record.score.hrv_rmssd_milli)
      }
      if (record.score?.skin_temp_celsius) {
        allSkinTemps.push(record.score.skin_temp_celsius)
      }
    })

    return {
      avgRecoveryScore: allRecoveryScores.length > 0 ? Math.round((allRecoveryScores.reduce((a, b) => a + b, 0) / allRecoveryScores.length) * 10) / 10 : 0,
      avgRestingHeartRate: allRestingHeartRates.length > 0 ? Math.round((allRestingHeartRates.reduce((a, b) => a + b, 0) / allRestingHeartRates.length) * 10) / 10 : 0,
      avgHrv: allHrvScores.length > 0 ? Math.round((allHrvScores.reduce((a, b) => a + b, 0) / allHrvScores.length) * 10) / 10 : 0,
      avgSkinTemp: allSkinTemps.length > 0 ? Math.round((allSkinTemps.reduce((a, b) => a + b, 0) / allSkinTemps.length) * 100) / 100 : 0,
      totalDays: allRecoveryScores.length
    }
  }

  // Get current month's averages
  const getCurrentMonthAverages = () => {
    if (!recoveryData?.recovery?.records) return null

    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    const currentMonthData = {
      recoveryScores: [],
      restingHeartRates: [],
      hrvScores: [],
      skinTemps: []
    }

    recoveryData.recovery.records.forEach(record => {
      const date = new Date(record.start || record.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthKey === currentMonthKey && record.score?.recovery_score) {
        currentMonthData.recoveryScores.push(record.score.recovery_score)
        if (record.score?.resting_heart_rate) {
          currentMonthData.restingHeartRates.push(record.score.resting_heart_rate)
        }
        if (record.score?.hrv_rmssd_milli) {
          currentMonthData.hrvScores.push(record.score.hrv_rmssd_milli)
        }
        if (record.score?.skin_temp_celsius) {
          currentMonthData.skinTemps.push(record.score.skin_temp_celsius)
        }
      }
    })

    return {
      avgRecoveryScore: currentMonthData.recoveryScores.length > 0 ? Math.round((currentMonthData.recoveryScores.reduce((a, b) => a + b, 0) / currentMonthData.recoveryScores.length) * 10) / 10 : 0,
      avgRestingHeartRate: currentMonthData.restingHeartRates.length > 0 ? Math.round((currentMonthData.restingHeartRates.reduce((a, b) => a + b, 0) / currentMonthData.restingHeartRates.length) * 10) / 10 : 0,
      avgHrv: currentMonthData.hrvScores.length > 0 ? Math.round((currentMonthData.hrvScores.reduce((a, b) => a + b, 0) / currentMonthData.hrvScores.length) * 10) / 10 : 0,
      avgSkinTemp: currentMonthData.skinTemps.length > 0 ? Math.round((currentMonthData.skinTemps.reduce((a, b) => a + b, 0) / currentMonthData.skinTemps.length) * 100) / 100 : 0,
      daysThisMonth: currentMonthData.recoveryScores.length
    }
  }

  // Download CSV functionality
  const downloadCSV = () => {
    if (!recoveryData?.recovery?.records) return

    const csvData = recoveryData.recovery.records.map(record => ({
      date: new Date(record.start || record.created_at).toISOString().split('T')[0],
      recoveryScore: record.score?.recovery_score || 'N/A',
      restingHeartRate: record.score?.resting_heart_rate || 'N/A',
      hrvRmssd: record.score?.hrv_rmssd_milli || 'N/A',
      skinTemp: record.score?.skin_temp_celsius || 'N/A'
    }))

    const csvContent = [
      ['Date', 'Recovery Score %', 'Resting Heart Rate', 'HRV RMSSD (ms)', 'Skin Temp (°C)'],
      ...csvData.map(row => [row.date, row.recoveryScore, row.restingHeartRate, row.hrvRmssd, row.skinTemp])
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `whoop_recovery_data_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Download PDF functionality
  const downloadPDF = () => {
    // Add print styles to current page
    const printStyles = document.createElement('style');
    printStyles.textContent = `
      @media print {
        body * { visibility: hidden; }
        .print-area, .print-area * { visibility: visible; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
        button { display: none !important; }
        .flex.gap-4.mb-4 { display: none !important; }
        canvas { 
          max-width: 100% !important; 
          height: auto !important;
          page-break-inside: avoid;
        }
        .chart-container {
          page-break-inside: avoid;
          margin: 20px 0;
        }
        h1, h2, h3 { 
          page-break-after: avoid;
          color: #059669 !important;
        }
        .bg-gradient-to-r {
          background: #f0fdf4 !important;
          border: 1px solid #059669 !important;
        }
      }
    `;
    document.head.appendChild(printStyles);

    // Add print-area class to main content
    const contentElement = document.querySelector('.max-w-7xl');
    if (!contentElement) {
      alert('Unable to generate PDF. Content not found.');
      return;
    }

    const originalClass = contentElement.className;
    contentElement.classList.add('print-area');

    // Trigger print dialog
    setTimeout(() => {
      window.print();
      
      // Cleanup after print
      setTimeout(() => {
        contentElement.className = originalClass;
        document.head.removeChild(printStyles);
      }, 100);
    }, 500);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ALL recovery data...</p>
          <p className="mt-2 text-sm text-gray-500">Fetching complete historical data...</p>
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
            onClick={refreshRecoveryData}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!recoveryData || !recoveryData.recovery || !recoveryData.recovery.records) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No recovery data available</p>
          <button
            onClick={refreshRecoveryData}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const last7Days = getLast7Days()
  const monthlyAverages = getMonthlyAverages()
  const overallAverages = getOverallAverages()
  const currentMonthAverages = getCurrentMonthAverages()

  // Chart.js data configurations
  const recoveryScoreChartData = {
    labels: last7Days.map(day => day.date),
    datasets: [
      {
        label: 'Recovery Score %',
        data: last7Days.map(day => day.recoveryScore),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  }

  const monthlyChartData = {
    labels: monthlyAverages.map(month => month.month),
    datasets: [
      {
        label: 'Avg Recovery Score %',
        data: monthlyAverages.map(month => month.avgRecoveryScore),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: false,
        yAxisID: 'y',
      },
      {
        label: 'Avg Resting HR (bpm)',
        data: monthlyAverages.map(month => month.avgRestingHeartRate),
        borderColor: 'rgba(168, 85, 247, 1)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        fill: false,
        yAxisID: 'y1',
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
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Recovery Score (%)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Heart Rate (bpm)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  const simpleChartOptions = {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete Recovery History Dashboard</h1>
          <div className="flex gap-4 mb-4">
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              📊 Download CSV Data
            </button>
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            >
              📋 Download PDF Report
            </button>
            <button
              onClick={refreshRecoveryData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              🔄 Update Data
            </button>
          </div>
          
          {/* Data Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-900 mb-2">💚 Complete Recovery Data Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-800">Total Records:</span> 
                <span className="ml-2 text-green-900">{recoveryData?.recovery?.total_count || recoveryData?.recovery?.records?.length || 0}</span>
              </div>
              <div>
                <span className="font-medium text-green-800">Date Range:</span> 
                <span className="ml-2 text-green-900">
                  {recoveryData?.recovery?.date_range?.earliest ? `${formatDate(recoveryData.recovery.date_range.earliest)} - ${formatDate(recoveryData.recovery.date_range.latest)}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-green-800">Last Updated:</span> 
                <span className="ml-2 text-green-900">
                  {formatDateTime(recoveryData?.recovery?.lastUpdate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {last7Days.length > 0 && (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Latest Recovery Score</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {last7Days[last7Days.length - 1]?.recoveryScore?.toFixed(0) || 0}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">7-Day Average</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {last7Days.length > 0 ? 
                    (last7Days.reduce((sum, day) => sum + (day.recoveryScore || 0), 0) / last7Days.length).toFixed(0) : 0}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Avg Resting HR</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {last7Days.length > 0 ? 
                    (last7Days.reduce((sum, day) => sum + (day.restingHeartRate || 0), 0) / last7Days.length).toFixed(0) : 0} bpm
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Avg HRV</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {last7Days.length > 0 ? 
                    (last7Days.reduce((sum, day) => sum + (day.hrvRmssd || 0), 0) / last7Days.length).toFixed(0) : 0} ms
                </p>
              </div>
            </>
          )}
        </div>

        {/* Overall and Current Month Averages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Overall Averages */}
          {overallAverages && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">📈 Overall Averages ({overallAverages.totalDays} days)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Recovery Score</p>
                  <p className="text-xl font-bold text-green-900">{overallAverages.avgRecoveryScore}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Resting HR</p>
                  <p className="text-xl font-bold text-green-900">{overallAverages.avgRestingHeartRate} bpm</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">HRV</p>
                  <p className="text-xl font-bold text-green-900">{overallAverages.avgHrv} ms</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Month Averages */}
          {currentMonthAverages && currentMonthAverages.daysThisMonth > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-emerald-900 mb-4">🗓️ This Month ({currentMonthAverages.daysThisMonth} days)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-emerald-600 font-medium">Recovery Score</p>
                  <p className="text-xl font-bold text-emerald-900">{currentMonthAverages.avgRecoveryScore}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-emerald-600 font-medium">Resting HR</p>
                  <p className="text-xl font-bold text-emerald-900">{currentMonthAverages.avgRestingHeartRate} bpm</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-emerald-600 font-medium">HRV</p>
                  <p className="text-xl font-bold text-emerald-900">{currentMonthAverages.avgHrv} ms</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts */}
        {chartsReady && (
          <>
            {/* Last 7 Days Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-4">Last 7 Days Recovery Scores</h2>
              <div style={{ height: '300px' }}>
                <Bar data={recoveryScoreChartData} options={simpleChartOptions} />
              </div>
            </div>

            {/* Monthly Averages Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-4">Complete Monthly Recovery History (All Time)</h2>
              <div style={{ height: '400px' }}>
                <Line data={monthlyChartData} options={chartOptions} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
