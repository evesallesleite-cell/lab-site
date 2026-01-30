import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { checkAuthAndRedirect, handleApiError } from "../../lib/auth-utils";
import { getWhoopDataStore } from "../../lib/whoop-data-store-v2";
import { getSportName, getSportIcon, WHOOP_SPORTS } from "../../lib/whoop-sport-mapping";

const Header = dynamic(() => import("../../components/header"), { ssr: false });

// Chart.js components with SSR disabled
const Bar = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Bar })), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Line })), { ssr: false });

// Register Chart.js components
const ChartJSLoader = dynamic(() => import('../../components/ChartJSLoader.jsx'), { ssr: false });

export default function Strain() {
  const router = useRouter();
  const [strainData, setStrainData] = useState(null);
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

  // Helper function to format numbers with commas
  const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0';
    return Math.round(num).toLocaleString();
  };

  // Helper function to format decimal numbers with commas
  const formatDecimal = (num, decimals = 1) => {
    if (num == null || isNaN(num)) return '0';
    return parseFloat(num).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  useEffect(() => {
    // Initialize data loading without authentication check
    const initializeData = async () => {
      // Subscribe to data store updates
      const unsubscribe = dataStore?.subscribe((data, loadingStates, errors) => {
        if (data.strain) {
          setStrainData({ strain: data.strain, profile: data.profile });
        }
        setLoading(loadingStates.strain || false);
        setError(errors.strain || "");
      });

      // Check if we need to automatically update data after returning from authentication
      if (typeof window !== 'undefined') {
        const needsDataUpdate = localStorage.getItem('needsDataUpdate');
        if (needsDataUpdate === 'true') {
          console.log('🔄 Auto-updating strain data after authentication...');
          localStorage.removeItem('needsDataUpdate'); // Clear the flag
          
          // Wait a moment for data store to be ready, then trigger update
          setTimeout(async () => {
            try {
              await dataStore?.fetchIncrementalUpdates(false);
              const updatedStrainData = dataStore?.getData('strain');
              
              if (updatedStrainData) {
                setStrainData({ strain: updatedStrainData });
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
        const cachedStrainData = dataStore.getData('strain');
        if (cachedStrainData) {
          setStrainData({ strain: cachedStrainData, profile: dataStore.getData('profile') });
          setLoading(false);
        } else {
          // Load from stored files only once
          try {
            await dataStore.fetchAllData();
            const loadedStrainData = dataStore.getData('strain');
            if (loadedStrainData) {
              setStrainData({ strain: loadedStrainData, profile: dataStore.getData('profile') });
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

  const fetchStrainData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching ALL historical strain data...');
      const response = await fetch('/api/strain-all-data');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check for authentication errors
        if (response.status === 401 || 
            response.status === 500 && errorData.error?.includes('access token') ||
            errorData.error?.includes('auth')) {
          // Handle authentication error
          if (handleApiError({ status: response.status, message: errorData.error }, router, '/strain')) {
            return;
          }
        }
        
        throw new Error(errorData.error || 'Failed to fetch strain data');
      }
      const data = await response.json();
      
      // Check if we got empty data (could indicate token issues)
      if (!data.strain || !data.strain.records || data.strain.records.length === 0) {
        console.log('� No strain data returned - checking authentication...');
        const authValid = await checkAuthAndRedirect(router, '/strain');
        if (!authValid) {
          return;
        }
      }
      
      console.log('�📊 Complete historical strain data loaded:', data);
      setStrainData(data);
      setError("");
    } catch (err) {
      console.error('Strain data fetch error:', err);
      // Try to handle as auth error
      if (!handleApiError(err, router, '/strain')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh function for manual refresh button
  const refreshStrainData = async () => {
    try {
      setLoading(true);
      setError("");
      console.log('🔄 Updating strain data...');
      
      const dataStore = getWhoopDataStore();
      if (dataStore) {
        // Check if we need to refresh the token based on last update time
        const strainData = dataStore.getData('strain');
        const lastUpdateTime = strainData?.lastUpdate;
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
        const updatedStrainData = dataStore.getData('strain');
        
        if (updatedStrainData) {
          setStrainData({ strain: updatedStrainData });
          console.log('✅ Strain data update completed successfully');
        }
      }
    } catch (err) {
      console.error('Strain data update error:', err);
      
      // Check if it's an authentication error
      if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('auth')) {
        setError("Authentication expired. Please log in to WHOOP again to update data.");
        // Redirect to login
        router.push('/whoop/whoop-login');
      } else if (!handleApiError(err, router, '/strain')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get last month's strain data
  const getLastMonth = () => {
    if (!strainData?.strain?.records) return []
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return strainData.strain.records
      .filter(record => {
        const recordDate = new Date(record.start || record.created_at);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      })
      .map(record => ({
        date: new Date(record.start || record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        strainScore: record.score?.strain || 0,
        averageHeartRate: record.score?.average_heart_rate || 0,
        maxHeartRate: record.score?.max_heart_rate || 0,
        calories: record.score?.kilojoule || 0 // Using kilojoule value directly as calories
      }))
      .sort((a, b) => new Date(a.date + ', 2025') - new Date(b.date + ', 2025')) // Sort by date ascending
  }

  // Get monthly averages for ALL TIME
  const getMonthlyAverages = () => {
    if (!strainData?.strain?.records) return []

    const monthlyData = {}
    
    // Group ALL strain data by month
    strainData.strain.records.forEach(record => {
      const date = new Date(record.start || record.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthLabel,
          strainScores: [],
          avgHeartRates: [],
          calories: []
        }
      }
      
      if (record.score?.strain) {
        monthlyData[monthKey].strainScores.push(record.score.strain)
        if (record.score?.average_heart_rate) {
          monthlyData[monthKey].avgHeartRates.push(record.score.average_heart_rate)
        }
        if (record.score?.kilojoule) {
          monthlyData[monthKey].calories.push(record.score.kilojoule) // Using kilojoule value directly as calories
        }
      }
    })

    // Calculate averages and sort chronologically
    return Object.entries(monthlyData)
      .filter(([_, month]) => month.strainScores && month.strainScores.length > 0)
      .map(([monthKey, month]) => ({
        monthKey,
        month: month.month,
        avgStrainScore: month.strainScores.length > 0 ? 
          Math.round((month.strainScores.reduce((a, b) => a + b, 0) / month.strainScores.length) * 10) / 10 : 0,
        avgHeartRate: month.avgHeartRates && month.avgHeartRates.length > 0 ? 
          Math.round((month.avgHeartRates.reduce((a, b) => a + b, 0) / month.avgHeartRates.length) * 10) / 10 : 0,
        avgCalories: month.calories && month.calories.length > 0 ?
          Math.round((month.calories.reduce((a, b) => a + b, 0) / month.calories.length) * 10) / 10 : 0,
        dataPoints: month.strainScores.length
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  }

  // Calculate overall averages across all data
  const getOverallAverages = () => {
    if (!strainData?.strain?.records) return null

    const allStrainScores = []
    const allHeartRates = []
    const allCalories = []

    strainData.strain.records.forEach(record => {
      if (record.score?.strain) {
        allStrainScores.push(record.score.strain)
      }
      if (record.score?.average_heart_rate) {
        allHeartRates.push(record.score.average_heart_rate)
      }
      if (record.score?.kilojoule) {
        allCalories.push(record.score.kilojoule) // Using kilojoule value directly as calories
      }
    })

    return {
      avgStrainScore: allStrainScores.length > 0 ? Math.round((allStrainScores.reduce((a, b) => a + b, 0) / allStrainScores.length) * 10) / 10 : 0,
      avgHeartRate: allHeartRates.length > 0 ? Math.round((allHeartRates.reduce((a, b) => a + b, 0) / allHeartRates.length) * 10) / 10 : 0,
      avgCalories: allCalories.length > 0 ? Math.round((allCalories.reduce((a, b) => a + b, 0) / allCalories.length) * 10) / 10 : 0,
      totalDays: allStrainScores.length
    }
  }

  // Get current month's averages
  const getCurrentMonthAverages = () => {
    if (!strainData?.strain?.records) return null

    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    // Calculate total days in current month
    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    
    const currentMonthData = {
      strainScores: [],
      heartRates: [],
      calories: []
    }

    strainData.strain.records.forEach(record => {
      const date = new Date(record.start || record.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthKey === currentMonthKey && record.score?.strain) {
        currentMonthData.strainScores.push(record.score.strain)
        if (record.score?.average_heart_rate) {
          currentMonthData.heartRates.push(record.score.average_heart_rate)
        }
        if (record.score?.kilojoule) {
          currentMonthData.calories.push(record.score.kilojoule) // Using kilojoule value directly as calories
        }
      }
    })

    return {
      avgStrainScore: currentMonthData.strainScores.length > 0 ? Math.round((currentMonthData.strainScores.reduce((a, b) => a + b, 0) / currentMonthData.strainScores.length) * 10) / 10 : 0,
      avgHeartRate: currentMonthData.heartRates.length > 0 ? Math.round((currentMonthData.heartRates.reduce((a, b) => a + b, 0) / currentMonthData.heartRates.length) * 10) / 10 : 0,
      avgCalories: currentMonthData.calories.length > 0 ? Math.round((currentMonthData.calories.reduce((a, b) => a + b, 0) / currentMonthData.calories.length) * 10) / 10 : 0,
      daysThisMonth: daysInCurrentMonth,
      activeDaysThisMonth: currentMonthData.strainScores.length
    }
  }

  // Get yearly exercise averages for average hours per day calculation
  const getYearlyExerciseAverages = () => {
    if (!strainData?.strain?.records) return []

    const yearlyData = {}
    
    // Group strain data by year and calculate exercise hours
    strainData.strain.records.forEach(record => {
      const date = new Date(record.start || record.created_at)
      const year = date.getFullYear()
      
      if (!yearlyData[year]) {
        yearlyData[year] = {
          exerciseMinutes: 0,
          totalDays: new Set(), // Use Set to track unique days
          records: 0
        }
      }
      
      // Add exercise duration if available (converting from seconds to minutes if needed)
      if (record.during && record.during.lower && record.during.upper) {
        const durationMs = new Date(record.during.upper).getTime() - new Date(record.during.lower).getTime()
        const durationMinutes = durationMs / (1000 * 60) // Convert to minutes
        yearlyData[year].exerciseMinutes += durationMinutes
      } else if (record.score?.strain && record.score.strain > 0) {
        // Estimate exercise duration based on strain score (rough approximation)
        // Higher strain typically means longer exercise
        const estimatedMinutes = Math.max(15, record.score.strain * 6) // Min 15 min, ~6 min per strain point
        yearlyData[year].exerciseMinutes += estimatedMinutes
      }
      
      // Track unique days for this year
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      yearlyData[year].totalDays.add(dayKey)
      yearlyData[year].records++
    })

    // Calculate average hours per day for each year
    return Object.entries(yearlyData)
      .map(([year, data]) => ({
        year: parseInt(year),
        totalExerciseHours: Math.round((data.exerciseMinutes / 60) * 10) / 10,
        totalDays: data.totalDays.size,
        avgHoursPerDay: data.totalDays.size > 0 ? Math.round((data.exerciseMinutes / 60 / data.totalDays.size) * 100) / 100 : 0,
        totalRecords: data.records
      }))
      .sort((a, b) => a.year - b.year)
  }

  // Download CSV functionality
  const downloadCSV = () => {
    if (!strainData?.strain?.records) return

    const csvData = strainData.strain.records.map(record => ({
      date: new Date(record.start || record.created_at).toISOString().split('T')[0],
      sport: getSportName(record.sport_id),
      sportId: record.sport_id,
      strainScore: record.score?.strain || 'N/A',
      avgHeartRate: record.score?.average_heart_rate || 'N/A',
      maxHeartRate: record.score?.max_heart_rate || 'N/A',
      calories: record.score?.kilojoule ? Math.round(record.score.kilojoule / 4.184) : 'N/A'
    }))

    const csvContent = [
      ['Date', 'Sport', 'Sport ID', 'Strain Score', 'Avg Heart Rate', 'Max Heart Rate', 'Calories'],
      ...csvData.map(row => [row.date, row.sport, row.sportId, row.strainScore, row.avgHeartRate, row.maxHeartRate, row.calories])
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `whoop_strain_data_${new Date().toISOString().split('T')[0]}.csv`)
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
          color: #f59e0b !important;
        }
        .bg-gradient-to-r {
          background: #fffbeb !important;
          border: 1px solid #f59e0b !important;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ALL strain data...</p>
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
            onClick={refreshStrainData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!strainData || !strainData.strain || !strainData.strain.records) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No strain data available</p>
          <button
            onClick={refreshStrainData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Calculate sport frequencies for this month and all time
  const getSportFrequencies = () => {
    if (!strainData?.strain?.records) return { 
      thisMonth: [], 
      allTime: [], 
      thisMonthTotal: 0,
      thisMonthPercentage: 0,
      tennisThisMonth: { count: 0, percentage: 0 },
      weightliftingThisMonth: { count: 0, percentage: 0 },
      tennisYearlyAverages: [],
      weightliftingYearlyAverages: [],
      yearlyAverages: []
    };
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysSoFar = now.getDate();
    
    const thisMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    const thisMonthSports = {};
    const allTimeSports = {};
    const yearlyData = {};
    const tennisYearlyData = {};
    const weightliftingYearlyData = {};
    let tennisCountThisMonth = 0;
    let weightliftingCountThisMonth = 0;
    
    strainData.strain.records.forEach(record => {
      const recordDate = new Date(record.start || record.created_at);
      const recordYear = recordDate.getFullYear();
      const recordMonth = `${recordYear}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
      const sportName = getSportName(record.sport_id);
      
      // All time count
      allTimeSports[sportName] = (allTimeSports[sportName] || 0) + 1;
      
      // This month count
      if (recordMonth === thisMonth) {
        thisMonthSports[sportName] = (thisMonthSports[sportName] || 0) + 1;
        
        // Track specific sports for individual percentages
        if (record.sport_id === 34) { // Tennis
          tennisCountThisMonth += 1;
        }
        if (record.sport_id === 45 || record.sport_id === 59) { // Weightlifting or Powerlifting
          weightliftingCountThisMonth += 1;
        }
      }
      
      // Yearly data for all sports
      if (!yearlyData[recordYear]) {
        yearlyData[recordYear] = { total: 0, months: new Set() };
      }
      yearlyData[recordYear].total += 1;
      yearlyData[recordYear].months.add(recordMonth);
      
      // Tennis yearly data
      if (record.sport_id === 34) {
        if (!tennisYearlyData[recordYear]) {
          tennisYearlyData[recordYear] = { total: 0 };
        }
        tennisYearlyData[recordYear].total += 1;
      }
      
      // Weightlifting yearly data
      if (record.sport_id === 45 || record.sport_id === 59) {
        if (!weightliftingYearlyData[recordYear]) {
          weightliftingYearlyData[recordYear] = { total: 0 };
        }
        weightliftingYearlyData[recordYear].total += 1;
      }
    });
    
    // Calculate this month totals and percentage
    const thisMonthTotal = Object.values(thisMonthSports).reduce((sum, count) => sum + count, 0);
    const thisMonthPercentage = daysSoFar > 0 ? thisMonthTotal / daysSoFar : 0;
    
    // Calculate individual sport percentages
    const tennisPercentage = daysSoFar > 0 ? tennisCountThisMonth / daysSoFar : 0;
    const weightliftingPercentage = daysSoFar > 0 ? weightliftingCountThisMonth / daysSoFar : 0;
    
    // Calculate yearly averages for all sports
    const yearlyAverages = Object.entries(yearlyData)
      .map(([year, data]) => {
        const yearInt = parseInt(year);
        let totalDays;
        
        if (yearInt === currentYear) {
          const startOfYear = new Date(yearInt, 0, 1);
          totalDays = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        } else {
          totalDays = (yearInt % 4 === 0 && (yearInt % 100 !== 0 || yearInt % 400 === 0)) ? 366 : 365;
        }
        
        const average = data.total / totalDays;
        return { year: yearInt, total: data.total, average, totalDays };
      })
      .sort((a, b) => b.year - a.year);
    
    // Calculate tennis yearly averages
    const tennisYearlyAverages = Object.entries(tennisYearlyData)
      .map(([year, data]) => {
        const yearInt = parseInt(year);
        let totalDays;
        
        if (yearInt === currentYear) {
          const startOfYear = new Date(yearInt, 0, 1);
          totalDays = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        } else {
          totalDays = (yearInt % 4 === 0 && (yearInt % 100 !== 0 || yearInt % 400 === 0)) ? 366 : 365;
        }
        
        const average = data.total / totalDays;
        return { year: yearInt, total: data.total, average, totalDays };
      })
      .sort((a, b) => b.year - a.year);
    
    // Calculate weightlifting yearly averages
    const weightliftingYearlyAverages = Object.entries(weightliftingYearlyData)
      .map(([year, data]) => {
        const yearInt = parseInt(year);
        let totalDays;
        
        if (yearInt === currentYear) {
          const startOfYear = new Date(yearInt, 0, 1);
          totalDays = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        } else {
          totalDays = (yearInt % 4 === 0 && (yearInt % 100 !== 0 || yearInt % 400 === 0)) ? 366 : 365;
        }
        
        const average = data.total / totalDays;
        return { year: yearInt, total: data.total, average, totalDays };
      })
      .sort((a, b) => b.year - a.year);
    
    // Convert to arrays and sort by frequency (descending)
    const thisMonthTop3 = Object.entries(thisMonthSports)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([sport, count]) => ({ sport, count }));
      
    const allTimeTop3 = Object.entries(allTimeSports)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([sport, count]) => ({ sport, count }));
    
    return { 
      thisMonth: thisMonthTop3, 
      allTime: allTimeTop3,
      thisMonthTotal,
      thisMonthPercentage,
      tennisThisMonth: { count: tennisCountThisMonth, percentage: tennisPercentage },
      weightliftingThisMonth: { count: weightliftingCountThisMonth, percentage: weightliftingPercentage },
      tennisYearlyAverages,
      weightliftingYearlyAverages,
      daysSoFar,
      daysInCurrentMonth,
      yearlyAverages
    };
  };

  // Get monthly weightlifting percentages for the last 12 months
  const getMonthlyWeightliftingPercentages = () => {
    if (!strainData?.strain?.records) return [];
    
    const now = new Date();
    const monthlyData = {};
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      monthlyData[monthKey] = {
        month: monthLabel,
        weightliftingCount: 0,
        totalDays: 0
      };
    }
    
    // Count weightlifting sessions per month
    strainData.strain.records.forEach(record => {
      const recordDate = new Date(record.start || record.created_at);
      const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[monthKey]) {
        if (record.sport_id === 45 || record.sport_id === 59) { // Weightlifting or Powerlifting
          monthlyData[monthKey].weightliftingCount += 1;
        }
      }
    });
    
    // Calculate percentages and total days for each month
    const result = Object.entries(monthlyData).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const yearInt = parseInt(year);
      const monthInt = parseInt(month);
      
      let totalDays;
      if (yearInt === now.getFullYear() && monthInt === now.getMonth() + 1) {
        // Current month - use days so far
        totalDays = now.getDate();
      } else {
        // Past month - use total days in that month
        totalDays = new Date(yearInt, monthInt, 0).getDate();
      }
      
      const percentage = totalDays > 0 ? (data.weightliftingCount / totalDays) * 100 : 0;
      
      return {
        month: data.month,
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
        count: data.weightliftingCount,
        totalDays,
        displayLabel: `${data.weightliftingCount}/${totalDays}`
      };
    });
    
    return result;
  };

  const lastMonth = getLastMonth()
  const monthlyAverages = getMonthlyAverages()
  const overallAverages = getOverallAverages()
  const currentMonthAverages = getCurrentMonthAverages()
  const yearlyExerciseAverages = getYearlyExerciseAverages()

  // Chart.js data configurations
  const strainScoreChartData = {
    labels: lastMonth.map(day => day.date),
    datasets: [
      {
        label: 'Strain Score',
        data: lastMonth.map(day => day.strainScore),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  }

  const monthlyChartData = {
    labels: monthlyAverages.map(month => month.month),
    datasets: [
      {
        label: 'Avg Strain Score',
        data: monthlyAverages.map(month => month.avgStrainScore),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: false,
        yAxisID: 'y',
      },
      {
        label: 'Avg Calories Burned',
        data: monthlyAverages.map(month => month.avgCalories),
        borderColor: 'rgba(168, 85, 247, 1)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        fill: false,
        yAxisID: 'y1',
      },
    ],
  }

  const sportFrequencies = getSportFrequencies();
  const monthlyWeightliftingData = getMonthlyWeightliftingPercentages();

  // Weightlifting Monthly Percentage Chart Data
  const weightliftingChartData = {
    labels: monthlyWeightliftingData.map(data => data.month),
    datasets: [
      {
        label: 'Weightlifting %',
        data: monthlyWeightliftingData.map(data => data.percentage),
        backgroundColor: monthlyWeightliftingData.map(data => 
          data.percentage < 40 ? 'rgba(239, 68, 68, 0.8)' : 
          data.percentage <= 60 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(34, 197, 94, 0.8)'
        ),
        borderColor: monthlyWeightliftingData.map(data => 
          data.percentage < 40 ? 'rgba(239, 68, 68, 1)' : 
          data.percentage <= 60 ? 'rgba(245, 158, 11, 1)' : 'rgba(34, 197, 94, 1)'
        ),
        borderWidth: 2,
      },
    ],
  };

  const weightliftingChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const dataPoint = monthlyWeightliftingData[context.dataIndex];
            return `${dataPoint.displayLabel} (${dataPoint.percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage (%)'
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      }
    },
  };

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
        max: 21,
        title: {
          display: true,
          text: 'Strain Score'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Calories Burned'
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
        max: 21,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ChartJSLoader onReady={() => setChartsReady(true)} />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete Strain History Dashboard</h1>
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
              onClick={refreshStrainData}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-2"
            >
              🔄 Update Data
            </button>
          </div>
          
          {/* Data Summary */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-900 mb-2">🔥 Complete Strain Data Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-red-800">Total Records:</span> 
                <span className="ml-2 text-red-900">{strainData?.strain?.total_count || strainData?.strain?.records?.length || 0}</span>
              </div>
              <div>
                <span className="font-medium text-red-800">Date Range:</span> 
                <span className="ml-2 text-red-900">
                  {strainData?.strain?.date_range?.earliest ? `${formatDate(strainData.strain.date_range.earliest)} - ${formatDate(strainData.strain.date_range.latest)}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-red-800">Last Updated:</span> 
                <span className="ml-2 text-red-900">
                  {formatDateTime(strainData?.strain?.lastUpdate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall and Current Month Averages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Overall Averages */}
          {overallAverages && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📈 Overall Averages ({overallAverages.totalDays} days)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">Strain Score</p>
                  <p className="text-xl font-bold text-blue-900">{formatDecimal(overallAverages.avgStrainScore)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">Heart Rate</p>
                  <p className="text-xl font-bold text-blue-900">{formatDecimal(overallAverages.avgHeartRate)} bpm</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">Calories</p>
                  <p className="text-xl font-bold text-blue-900">{formatNumber(overallAverages.avgCalories)} cal</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Month Averages */}
          {currentMonthAverages && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">🗓️ This Month ({currentMonthAverages.daysThisMonth} days)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Strain Score</p>
                  <p className="text-xl font-bold text-green-900">{formatDecimal(currentMonthAverages.avgStrainScore)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Heart Rate</p>
                  <p className="text-xl font-bold text-green-900">{formatDecimal(currentMonthAverages.avgHeartRate)} bpm</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Calories</p>
                  <p className="text-xl font-bold text-green-900">{formatNumber(currentMonthAverages.avgCalories)} cal</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Yearly Exercise Averages */}
        {yearlyExerciseAverages && yearlyExerciseAverages.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">⏱️ Average Exercise Hours Per Day by Year</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {yearlyExerciseAverages.map((yearData) => (
                  <div key={yearData.year} className="bg-white rounded-lg p-4 border border-purple-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-900 mb-1">{yearData.year}</p>
                      <div className="space-y-1">
                        <div>
                          <p className="text-2xl font-bold text-purple-700">{yearData.avgHoursPerDay}h</p>
                          <p className="text-xs text-purple-600">avg/day</p>
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          <div>{yearData.totalExerciseHours}h total</div>
                          <div>{yearData.totalRecords} workouts</div>
                          <div>{yearData.totalDays} active days</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {lastMonth.length > 0 && (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Latest Strain Score</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {lastMonth[lastMonth.length - 1]?.strainScore?.toFixed(1) || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">This Month Average</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {lastMonth.length > 0 ? 
                    (lastMonth.reduce((sum, day) => sum + (day.strainScore || 0), 0) / lastMonth.length).toFixed(1) : 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Avg Heart Rate</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {lastMonth.length > 0 ? 
                    (lastMonth.reduce((sum, day) => sum + (day.averageHeartRate || 0), 0) / lastMonth.length).toFixed(0) : 0} bpm
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Avg Calories</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {lastMonth.length > 0 ? 
                    formatNumber(lastMonth.reduce((sum, day) => sum + (day.calories || 0), 0) / lastMonth.length) : 0} cal
                </p>
              </div>
            </>
          )}
        </div>

        {/* Sport Frequency Analysis */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Individual Sport Tracking - Tennis & Weightlifting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tennis Tracking */}
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{
              borderLeftColor: sportFrequencies.tennisThisMonth.percentage < 0.4 ? '#ef4444' : 
                              sportFrequencies.tennisThisMonth.percentage <= 0.6 ? '#f59e0b' : '#22c55e'
            }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="text-2xl mr-2">🎾</span>
                Tennis This Month
              </h3>
              <div className="p-4 rounded-lg border-2" style={{
                backgroundColor: sportFrequencies.tennisThisMonth.percentage < 0.4 ? '#fee2e2' : 
                               sportFrequencies.tennisThisMonth.percentage <= 0.6 ? '#fef3c7' : '#dcfce7',
                borderColor: sportFrequencies.tennisThisMonth.percentage < 0.4 ? '#ef4444' : 
                            sportFrequencies.tennisThisMonth.percentage <= 0.6 ? '#f59e0b' : '#22c55e'
              }}>
                <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      {sportFrequencies.tennisThisMonth.count}/{sportFrequencies.daysSoFar}
                    </div>
                    <div className="text-xl font-semibold mb-1">
                      {(sportFrequencies.tennisThisMonth.percentage * 100).toFixed(1)}% tennis rate
                    </div>
                    <div className="text-xs mt-2 font-medium">
                      {sportFrequencies.tennisThisMonth.percentage < 0.4 ? 'Low' : 
                       sportFrequencies.tennisThisMonth.percentage <= 0.6 ? 'Medium' : 'High'}
                    </div>
                </div>
              </div>
            </div>

            {/* Weightlifting Tracking */}
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{
              borderLeftColor: sportFrequencies.weightliftingThisMonth.percentage < 0.4 ? '#ef4444' : 
                              sportFrequencies.weightliftingThisMonth.percentage <= 0.6 ? '#f59e0b' : '#22c55e'
            }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="text-2xl mr-2">🏋️</span>
                Weightlifting This Month
              </h3>
              <div className="p-4 rounded-lg border-2" style={{
                backgroundColor: sportFrequencies.weightliftingThisMonth.percentage < 0.4 ? '#fee2e2' : 
                               sportFrequencies.weightliftingThisMonth.percentage <= 0.6 ? '#fef3c7' : '#dcfce7',
                borderColor: sportFrequencies.weightliftingThisMonth.percentage < 0.4 ? '#ef4444' : 
                            sportFrequencies.weightliftingThisMonth.percentage <= 0.6 ? '#f59e0b' : '#22c55e'
              }}>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {sportFrequencies.weightliftingThisMonth.count}/{sportFrequencies.daysSoFar}
                  </div>
                  <div className="text-xl font-semibold mb-1">
                    {(sportFrequencies.weightliftingThisMonth.percentage * 100).toFixed(1)}% lifting rate
                  </div>
                  <div className="text-xs mt-2 font-medium">
                    {sportFrequencies.weightliftingThisMonth.percentage < 0.4 ? 'Low' : 
                     sportFrequencies.weightliftingThisMonth.percentage <= 0.6 ? 'Medium' : 'High'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Yearly Averages - Tennis & Weightlifting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tennis Historical Data */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">🎾</span>
                Tennis - Historical Yearly Averages
              </h3>
              {sportFrequencies.tennisYearlyAverages.length > 0 ? (
                <div className="space-y-3">
                  {sportFrequencies.tennisYearlyAverages.map((yearData, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="font-bold text-xl text-green-900">{yearData.year}</span>
                        <div className="text-sm text-green-600">
                          <div>{yearData.total} tennis sessions</div>
                          <div className="text-xs text-gray-500">{yearData.totalDays} days tracked</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-700">
                          {(yearData.average * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-green-600">No tennis data available.</p>
              )}
            </div>

            {/* Weightlifting Historical Data */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">🏋️</span>
                Weightlifting - Historical Yearly Averages
              </h3>
              {sportFrequencies.weightliftingYearlyAverages.length > 0 ? (
                <div className="space-y-3">
                  {sportFrequencies.weightliftingYearlyAverages.map((yearData, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="font-bold text-xl text-orange-900">{yearData.year}</span>
                        <div className="text-sm text-orange-600">
                          <div>{yearData.total} lifting sessions</div>
                          <div className="text-xs text-gray-500">{yearData.totalDays} days tracked</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-700">
                          {(yearData.average * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-orange-600">No weightlifting data available.</p>
              )}
            </div>
          </div>

          {/* All Time Top Sports */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">🏆 All Time - Top Sports</h3>
            <div className="space-y-3">
              {sportFrequencies.allTime.map((item, index) => (
                <div key={item.sport} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getSportIcon(
                      Object.keys(WHOOP_SPORTS).find(id => WHOOP_SPORTS[id] === item.sport) || "71"
                    )}</span>
                    <span className="font-medium text-purple-900">{item.sport}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-purple-600">{item.count}</span>
                    <p className="text-xs text-purple-500">total sessions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts */}
        {chartsReady && (
          <>
            {/* This Month Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-4">This Month Strain Scores</h2>
              <div style={{ height: '300px' }}>
                <Bar data={strainScoreChartData} options={simpleChartOptions} />
              </div>
            </div>

            {/* Weightlifting Monthly Percentage Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-2xl mr-2">🏋️</span>
                Weightlifting Frequency - Last 12 Months
              </h2>
              <div style={{ height: '400px' }}>
                <Bar data={weightliftingChartData} options={weightliftingChartOptions} />
              </div>
              <div className="mt-4 text-sm text-gray-600 grid grid-cols-3 gap-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span>Low (&lt;40%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                  <span>Medium (40-60%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span>High (&gt;60%)</span>
                </div>
              </div>
            </div>

            {/* Monthly Averages Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-4">Complete Monthly Strain History (All Time)</h2>
              <div style={{ height: '400px' }}>
                <Line data={monthlyChartData} options={chartOptions} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
