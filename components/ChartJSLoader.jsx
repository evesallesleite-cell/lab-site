import { useEffect } from 'react';

export default function ChartJSLoader({ onReady }) {
  useEffect(() => {
    const loadChartJS = async () => {
      try {
        const Chart = await import('chart.js');
        const {
          CategoryScale,
          LinearScale,
          BarElement,
          LineElement,
          PointElement,
          Title,
          Tooltip,
          Legend,
        } = Chart;

        Chart.Chart.register(
          CategoryScale,
          LinearScale,
          BarElement,
          LineElement,
          PointElement,
          Title,
          Tooltip,
          Legend
        );

        onReady();
      } catch (error) {
        console.error('Failed to load Chart.js:', error);
      }
    };

    loadChartJS();
  }, [onReady]);

  return null;
}
