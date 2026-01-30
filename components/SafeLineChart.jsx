import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SafeLineChart({ data, height = 400 }) {
  // Extra safety checks
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
        <p className="text-gray-500">No monthly data available</p>
      </div>
    );
  }

  // Ensure all data points have the required fields
  const safeData = data.filter(item => 
    item && 
    typeof item.avgSleepScore !== 'undefined' && 
    item.avgSleepScore > 0
  );
  
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
        <p className="text-gray-500">No valid monthly averages</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={safeData}>
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
  );
}
