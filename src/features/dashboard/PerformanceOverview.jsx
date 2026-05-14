import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import PerformanceChart from '../analytics/PerformanceChart';
import './PerformanceOverview.css';

export default function PerformanceOverview() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-overview">
      <div className="section-header">
        <BarChart3 size={20} />
        <h3>Performance Overview</h3>
      </div>
      <PerformanceChart refreshTrigger={refreshTrigger} />
    </div>
  );
}
