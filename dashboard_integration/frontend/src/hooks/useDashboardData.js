import { useState, useEffect } from 'react';
import { dashboardAPI, connectWebSocket, getSocket } from '../services/api';

export const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getFeed();
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Setup WebSocket for real-time updates
    const socket = connectWebSocket();
    
    socket.on('dashboard:update', (updatedData) => {
      console.log('📡 Real-time update received');
      setData(updatedData);
    });

    socket.on('dashboard:alert', (alert) => {
      console.log('🚨 Alert received:', alert);
      // Trigger notification or update alerts
    });

    // Refresh data every 30 seconds as fallback
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('dashboard:update');
        socket.off('dashboard:alert');
      }
    };
  }, []);

  return { data, loading, error, refresh: async () => {
    const response = await dashboardAPI.getFeed();
    setData(response.data);
  }};
};
