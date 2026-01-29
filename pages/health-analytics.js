import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../components/header"), { ssr: false });

export default function HealthAnalytics() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dataStats, setDataStats] = useState(null);
  const [availableMetrics, setAvailableMetrics] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadDataStats();
    loadAvailableMetrics();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadDataStats = async () => {
    try {
      const response = await fetch('/api/health-analytics/stats');
      const result = await response.json();
      if (result.success) {
        setDataStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAvailableMetrics = async () => {
    try {
      const response = await fetch('/api/health-analytics/metrics');
      const result = await response.json();
      if (result.success) {
        setAvailableMetrics(result.metrics);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { 
      role: 'user', 
      content: inputMessage, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/health-analytics/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage
        })
      });

      const result = await response.json();

      if (result.success) {
        const aiMessage = { 
          role: 'assistant', 
          content: result.response,
          data: result.data,
          sql: result.sql,
          toolUsed: result.toolUsed,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = { 
          role: 'assistant', 
          content: `Error: ${result.error}`, 
          timestamp: new Date(),
          isError: true 
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Network error. Please try again.', 
        timestamp: new Date(),
        isError: true 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatData = (data, toolUsed) => {
    if (!data) return null;
    
    switch (toolUsed) {
      case 'timeseries':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded border">
            <h4 className="font-semibold mb-2">Time Series Data</h4>
            <div className="space-y-1 text-sm">
              {data.map((row, i) => (
                <div key={i} className="flex justify-between">
                  <span>{row.period}</span>
                  <span className="font-mono">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'cohort_compare':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded border">
            <h4 className="font-semibold mb-2">Cohort Comparison</h4>
            <div className="grid grid-cols-3 gap-2 text-sm font-semibold border-b pb-2 mb-2">
              <span>Cohort</span>
              <span>Average</span>
              <span>Count</span>
            </div>
            {data.map((row, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 text-sm">
                <span>{row.cohort}</span>
                <span className="font-mono">{row.avg_metric}</span>
                <span className="font-mono">{row.n}</span>
              </div>
            ))}
          </div>
        );
      
      case 'correlation':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded border">
            <h4 className="font-semibold mb-2">Correlation Analysis</h4>
            <div className="text-sm">
              <div><strong>Correlation:</strong> {data.correlation}</div>
              <div><strong>P-value:</strong> {data.p_value}</div>
              <div><strong>Sample size:</strong> {data.n}</div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded border">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Analytics AI</h1>
          <p className="text-gray-600 mb-4">
            Ask questions about your health data. This AI can analyze trends, compare cohorts, calculate correlations, and provide statistical insights from your WHOOP, supplement, and health records.
          </p>
          
          {dataStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold text-blue-900">Sleep Sessions</div>
                <div className="text-blue-700">{dataStats.sleep_sessions}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="font-semibold text-purple-900">Workout Sessions</div>
                <div className="text-purple-700">{dataStats.workout_sessions}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold text-green-900">Recovery Records</div>
                <div className="text-green-700">{dataStats.recovery_sessions}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="font-semibold text-orange-900">Supplement Entries</div>
                <div className="text-orange-700">{dataStats.supplement_entries}</div>
              </div>
            </div>
          )}
        </div>

        {/* Example Questions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Try asking:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <button 
              onClick={() => setInputMessage("Show my weekly average HRV for the last 3 months")}
              className="text-left p-2 bg-blue-50 hover:bg-blue-100 rounded text-blue-800"
            >
              "Show my weekly average HRV for the last 3 months"
            </button>
            <button 
              onClick={() => setInputMessage("Did taking magnesium improve my recovery scores?")}
              className="text-left p-2 bg-green-50 hover:bg-green-100 rounded text-green-800"
            >
              "Did taking magnesium improve my recovery scores?"
            </button>
            <button 
              onClick={() => setInputMessage("Is my strain correlated with sleep efficiency?")}
              className="text-left p-2 bg-purple-50 hover:bg-purple-100 rounded text-purple-800"
            >
              "Is my strain correlated with sleep efficiency?"
            </button>
            <button 
              onClick={() => setInputMessage("Compare my gym performance on Mondays vs Fridays")}
              className="text-left p-2 bg-orange-50 hover:bg-orange-100 rounded text-orange-800"
            >
              "Compare my gym performance on Mondays vs Fridays"
            </button>
          </div>
        </div>

        {/* Available Metrics */}
        {availableMetrics.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Available Metrics:</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {availableMetrics.map((metric, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded">
                  {metric}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h3 className="font-bold text-gray-900">Analytics Chat</h3>
          </div>
          
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                Ask me anything about your health data! I can run statistical analyses, find correlations, compare time periods, and more.
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl rounded-lg p-4 ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : message.isError 
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Show SQL query if available */}
                  {message.sql && (
                    <div className="mt-3 p-2 bg-gray-800 text-green-400 rounded text-xs font-mono">
                      <div className="text-gray-400 mb-1">SQL Query:</div>
                      {message.sql}
                    </div>
                  )}
                  
                  {/* Show formatted data */}
                  {message.data && formatData(message.data, message.toolUsed)}
                  
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                    {message.toolUsed && (
                      <span className="ml-2 px-1 bg-black bg-opacity-20 rounded">
                        {message.toolUsed}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span>Analyzing your data...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-6 border-t">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your health data..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Analyzing...' : 'Ask'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}