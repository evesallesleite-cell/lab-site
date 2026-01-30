import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SafeStackedBarChart({ data, height = 300 }) {
  // Extra safety checks
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Ensure all data points have the required fields
  const safeData = data.filter(item => 
    item && 
    typeof item.deepSleep !== 'undefined' && 
    typeof item.remSleep !== 'undefined' && 
    typeof item.lightSleep !== 'undefined'
  );
  
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
        <p className="text-gray-500">No valid sleep stage data</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={safeData}>
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
  );
}
