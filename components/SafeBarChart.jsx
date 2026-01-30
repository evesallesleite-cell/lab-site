import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SafeBarChart({ data, dataKey, name, color = "#3B82F6", height = 300 }) {
  // Extra safety checks
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Ensure all data points have the required field
  const safeData = data.filter(item => item && typeof item[dataKey] !== 'undefined' && item[dataKey] !== null);
  
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
        <p className="text-gray-500">No valid data points</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={safeData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value) => [`${value.toFixed(0)}%`, name]} />
        <Legend />
        <Bar dataKey={dataKey} fill={color} name={name} />
      </BarChart>
    </ResponsiveContainer>
  );
}
