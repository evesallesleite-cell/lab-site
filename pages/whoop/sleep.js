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
const ChartJSLoader = dynamic(() => import('../../components/ChartJSLoader'), { ssr: false });

export default function Sleep() {
  const router = useRouter();
  const [whoopData, setWhoopData] = useState(null);
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
        console.log('📡 Data store subscription update:', {
          hasSleepData: !!data.sleep,
          lastUpdate: data.sleep?.lastUpdate,
          recordCount: data.sleep?.records?.length || 0
        });
        
        if (data.sleep) {
          setWhoopData({ sleep: data.sleep, profile: data.profile });
        }
        setLoading(loadingStates.sleep || false);
        setError(errors.sleep || "");
      });

      // Check if we need to automatically update data after returning from authentication
      if (typeof window !== 'undefined') {
        const needsDataUpdate = localStorage.getItem('needsDataUpdate');
        if (needsDataUpdate === 'true') {
          console.log('🔄 Auto-updating data after authentication...');
          localStorage.removeItem('needsDataUpdate'); // Clear the flag
          
          // Wait a moment for data store to be ready, then trigger update
          setTimeout(async () => {
            try {
              await dataStore?.fetchIncrementalUpdates(false);
              const updatedSleepData = dataStore?.getData('sleep');
              const profileData = dataStore?.getData('profile');
              
              if (updatedSleepData) {
                setWhoopData({ sleep: updatedSleepData, profile: profileData });
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
        const sleepData = dataStore.getData('sleep');
        if (sleepData) {
          setWhoopData({ sleep: sleepData, profile: dataStore.getData('profile') });
          setLoading(false);
        } else {
          // Load from stored files only once
          try {
            await dataStore.fetchAllData();
            const loadedSleepData = dataStore.getData('sleep');
            if (loadedSleepData) {
              setWhoopData({ sleep: loadedSleepData, profile: dataStore.getData('profile') });
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

  const fetchWhoopData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Updating sleep data...');
      
      const dataStore = getWhoopDataStore();
      if (dataStore) {
        // Check if we need to refresh the token based on last update time
        const sleepData = dataStore.getData('sleep');
        const lastUpdateTime = sleepData?.lastUpdate;
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
        
        // Force update local state with the very latest data
        const updatedSleepData = dataStore.getData('sleep');
        const profileData = dataStore.getData('profile');
        
        console.log('📊 Latest sleep data after update:', {
          recordCount: updatedSleepData?.records?.length || 0,
          lastUpdate: updatedSleepData?.lastUpdate,
          totalCount: updatedSleepData?.totalCount
        });
        
        if (updatedSleepData) {
          // Force a complete state refresh to ensure UI updates
          setWhoopData({ sleep: updatedSleepData, profile: profileData });
          console.log('✅ Sleep data update completed successfully');
        }
      }
      
      setError("");
    } catch (err) {
      console.error('Sleep data update error:', err);
      if (!handleApiError(err, router, '/sleep')) {
        setError(err.message);
      }
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
          Math.round(record.score.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60) * 100) / 100 : 0,
        deepSleep: record.score?.stage_summary?.total_slow_wave_sleep_time_milli ?
          Math.round(record.score.stage_summary.total_slow_wave_sleep_time_milli / (1000 * 60)) : 0,
        remSleep: record.score?.stage_summary?.total_rem_sleep_time_milli ?
          Math.round(record.score.stage_summary.total_rem_sleep_time_milli / (1000 * 60)) : 0,
        lightSleep: record.score?.stage_summary?.total_light_sleep_time_milli ?
          Math.round(record.score.stage_summary.total_light_sleep_time_milli / (1000 * 60)) : 0
      }))
      .reverse()
  }

  // Get monthly averages for ALL TIME
  const getMonthlyAverages = () => {
    if (!whoopData?.sleep?.records) return []

    const monthlyData = {}
    
    // Group ALL sleep data by month (not just last 12 months)
    whoopData.sleep.records.forEach(record => {
      const date = new Date(record.start)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthLabel,
          scores: [],
          totalSleep: [],
          efficiency: [],
          actualSleepTime: [] // Deep + Light + REM
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
        
        // Calculate actual sleep time (Deep + Light + REM)
        const deepSleep = record.score?.stage_summary?.total_slow_wave_sleep_time_milli || 0
        const lightSleep = record.score?.stage_summary?.total_light_sleep_time_milli || 0
        const remSleep = record.score?.stage_summary?.total_rem_sleep_time_milli || 0
        const actualSleepHours = (deepSleep + lightSleep + remSleep) / (1000 * 60 * 60)
        
        if (actualSleepHours > 0) {
          monthlyData[monthKey].actualSleepTime.push(actualSleepHours)
        }
      }
    })

    // Calculate averages and sort chronologically
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
        avgActualSleep: month.actualSleepTime && month.actualSleepTime.length > 0 ?
          Math.round((month.actualSleepTime.reduce((a, b) => a + b, 0) / month.actualSleepTime.length) * 10) / 10 : 0,
        dataPoints: month.scores.length
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey)) // Sort chronologically
  }

  // Calculate overall averages across all data
  const getOverallAverages = () => {
    if (!whoopData?.sleep?.records) return null

    const allScores = []
    const allEfficiency = []
    const allActualSleep = []

    whoopData.sleep.records.forEach(record => {
      if (record.score?.sleep_performance_percentage) {
        allScores.push(record.score.sleep_performance_percentage)
      }
      if (record.score?.sleep_efficiency_percentage) {
        allEfficiency.push(record.score.sleep_efficiency_percentage)
      }

      // Calculate actual sleep time (Deep + Light + REM)
      const deepSleep = record.score?.stage_summary?.total_slow_wave_sleep_time_milli || 0
      const lightSleep = record.score?.stage_summary?.total_light_sleep_time_milli || 0
      const remSleep = record.score?.stage_summary?.total_rem_sleep_time_milli || 0
      const actualSleepHours = (deepSleep + lightSleep + remSleep) / (1000 * 60 * 60)
      
      if (actualSleepHours > 0) {
        allActualSleep.push(actualSleepHours)
      }
    })

    return {
      avgSleepScore: allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0,
      avgEfficiency: allEfficiency.length > 0 ? Math.round((allEfficiency.reduce((a, b) => a + b, 0) / allEfficiency.length) * 10) / 10 : 0,
      avgActualSleep: allActualSleep.length > 0 ? Math.round((allActualSleep.reduce((a, b) => a + b, 0) / allActualSleep.length) * 10) / 10 : 0,
      totalNights: allScores.length
    }
  }

  // Get current month's averages
  const getCurrentMonthAverages = () => {
    if (!whoopData?.sleep?.records) return null

    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    const currentMonthData = {
      scores: [],
      efficiency: [],
      actualSleep: []
    }

    whoopData.sleep.records.forEach(record => {
      const date = new Date(record.start)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthKey === currentMonthKey && record.score?.sleep_performance_percentage) {
        currentMonthData.scores.push(record.score.sleep_performance_percentage)
        if (record.score?.sleep_efficiency_percentage) {
          currentMonthData.efficiency.push(record.score.sleep_efficiency_percentage)
        }

        // Calculate actual sleep time (Deep + Light + REM)
        const deepSleep = record.score?.stage_summary?.total_slow_wave_sleep_time_milli || 0
        const lightSleep = record.score?.stage_summary?.total_light_sleep_time_milli || 0
        const remSleep = record.score?.stage_summary?.total_rem_sleep_time_milli || 0
        const actualSleepHours = (deepSleep + lightSleep + remSleep) / (1000 * 60 * 60)
        
        if (actualSleepHours > 0) {
          currentMonthData.actualSleep.push(actualSleepHours)
        }
      }
    })

    return {
      avgSleepScore: currentMonthData.scores.length > 0 ? Math.round((currentMonthData.scores.reduce((a, b) => a + b, 0) / currentMonthData.scores.length) * 10) / 10 : 0,
      avgEfficiency: currentMonthData.efficiency.length > 0 ? Math.round((currentMonthData.efficiency.reduce((a, b) => a + b, 0) / currentMonthData.efficiency.length) * 10) / 10 : 0,
      avgActualSleep: currentMonthData.actualSleep.length > 0 ? Math.round((currentMonthData.actualSleep.reduce((a, b) => a + b, 0) / currentMonthData.actualSleep.length) * 10) / 10 : 0,
      nightsThisMonth: currentMonthData.scores.length
    }
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
          color: #3b82f6 !important;
        }
        .bg-gradient-to-r {
          background: #eff6ff !important;
          border: 1px solid #3b82f6 !important;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ALL sleep data...</p>
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
  const monthlyAverages = getMonthlyAverages()
  const overallAverages = getOverallAverages()
  const currentMonthAverages = getCurrentMonthAverages()

  // Chart.js data configurations
  const sleepScoreChartData = {
    labels: last7Days.map(day => day.date),
    datasets: [
      {
        label: 'Sleep Score %',
        data: last7Days.map(day => day.sleepScore),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  }

  const sleepStagesChartData = {
    labels: last7Days.map(day => day.date),
    datasets: [
      {
        label: 'Deep Sleep (min)',
        data: last7Days.map(day => day.deepSleep),
        backgroundColor: 'rgba(30, 64, 175, 0.8)',
        borderColor: 'rgba(30, 64, 175, 1)',
        borderWidth: 1,
      },
      {
        label: 'REM Sleep (min)',
        data: last7Days.map(day => day.remSleep),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Light Sleep (min)',
        data: last7Days.map(day => day.lightSleep),
        backgroundColor: 'rgba(147, 197, 253, 0.8)',
        borderColor: 'rgba(147, 197, 253, 1)',
        borderWidth: 1,
      },
    ],
  }

  const monthlyChartData = {
    labels: monthlyAverages.map(month => month.month),
    datasets: [
      {
        label: 'Avg Sleep Score %',
        data: monthlyAverages.map(month => month.avgSleepScore),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: false,
        yAxisID: 'y',
      },
      {
        label: 'Avg Efficiency %',
        data: monthlyAverages.map(month => month.avgEfficiency),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: false,
        yAxisID: 'y',
      },
      {
        label: 'Avg Total Sleep Time (hrs)',
        data: monthlyAverages.map(month => month.avgActualSleep),
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
          text: 'Percentage (%)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: 12,
        title: {
          display: true,
          text: 'Hours'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  const stackedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
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
              📊 Download CSV Data
            </button>
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            >
              📋 Download PDF Report
            </button>
            <button
              onClick={fetchWhoopData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              🔄 Update Data
            </button>
          </div>
          
          {/* Data Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">📊 Complete Sleep Data Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Total Records:</span> 
                <span className="ml-2 text-blue-900">{whoopData?.sleep?.total_count || whoopData?.sleep?.records?.length || 0}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Date Range:</span> 
                <span className="ml-2 text-blue-900">
                  {whoopData?.sleep?.date_range?.earliest ? `${formatDate(whoopData.sleep.date_range.earliest)} - ${formatDate(whoopData.sleep.date_range.latest)}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Last Updated:</span> 
                <span className="ml-2 text-blue-900">
                  {formatDateTime(whoopData?.sleep?.lastUpdate)}
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

        {/* Overall and Current Month Averages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Overall Averages */}
          {overallAverages && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📈 Overall Averages ({overallAverages.totalNights} nights)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">Sleep Score</p>
                  <p className="text-xl font-bold text-blue-900">{overallAverages.avgSleepScore}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">Efficiency</p>
                  <p className="text-xl font-bold text-blue-900">{overallAverages.avgEfficiency}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">Total Sleep</p>
                  <p className="text-xl font-bold text-blue-900">{overallAverages.avgActualSleep}h</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Month Averages */}
          {currentMonthAverages && currentMonthAverages.nightsThisMonth > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">🗓️ This Month ({currentMonthAverages.nightsThisMonth} nights)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Sleep Score</p>
                  <p className="text-xl font-bold text-green-900">{currentMonthAverages.avgSleepScore}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Efficiency</p>
                  <p className="text-xl font-bold text-green-900">{currentMonthAverages.avgEfficiency}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Total Sleep</p>
                  <p className="text-xl font-bold text-green-900">{currentMonthAverages.avgActualSleep}h</p>
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
              <h2 className="text-xl font-semibold mb-4">Last 7 Days Sleep Scores</h2>
              <div style={{ height: '300px' }}>
                <Bar data={sleepScoreChartData} options={chartOptions} />
              </div>
            </div>

            {/* Sleep Stages Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-4">Sleep Stages (Last 7 Days)</h2>
              <div style={{ height: '300px' }}>
                <Bar data={sleepStagesChartData} options={stackedChartOptions} />
              </div>
            </div>

            {/* Monthly Averages Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-4">Complete Monthly Sleep History (All Time)</h2>
              <div style={{ height: '400px' }}>
                <Line data={monthlyChartData} options={chartOptions} />
              </div>
            </div>
          </>
        )}

        {!chartsReady && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading charts...</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
