import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Activity, Shield, Users, Wifi, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardPage = () => {
  const { getToken, user } = useAuth();
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statusRes, statsRes] = await Promise.all([
        axios.get(`${API}/dashboard/status`, { headers }),
        axios.get(`${API}/dashboard/stats`, { headers })
      ]);
      
      setStatus(statusRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="font-mono text-sm text-white/40 tracking-widest">LOADING...</div>
      </div>
    );
  }

  return (
    <motion.div
      data-testid="dashboard-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white text-glow">
          DASHBOARD
        </h1>
        <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase mt-2">
          System Overview
        </p>
      </motion.div>

      {/* Status Cards Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Driver Status */}
        <div 
          data-testid="driver-status-card"
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6 hover:border-white/20 transition-all duration-500"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-white/5 rounded-sm">
              <Shield className="h-5 w-5 text-white/60" />
            </div>
            <div className={`status-dot ${status?.killswitch_active ? 'offline' : 'online'}`} />
          </div>
          <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase mb-2">
            Driver Status
          </p>
          <p className={`font-serif text-2xl ${status?.killswitch_active ? 'text-red-400' : 'text-green-400'}`}>
            {status?.driver_status || 'Unknown'}
          </p>
        </div>

        {/* Last Update */}
        <div 
          data-testid="last-update-card"
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6 hover:border-white/20 transition-all duration-500"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-white/5 rounded-sm">
              <Clock className="h-5 w-5 text-white/60" />
            </div>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
          <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase mb-2">
            Last Update
          </p>
          <p className="font-serif text-2xl text-white">
            {status?.last_update || 'N/A'}
          </p>
        </div>

        {/* Subscription Status */}
        <div 
          data-testid="subscription-card"
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6 hover:border-white/20 transition-all duration-500"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-white/5 rounded-sm">
              <Activity className="h-5 w-5 text-white/60" />
            </div>
          </div>
          <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase mb-2">
            Subscription
          </p>
          <p className="font-serif text-2xl text-white">
            {user?.subscription_days || 0} <span className="text-base text-white/40">days</span>
          </p>
          <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((user?.subscription_days || 0) / 30 * 100, 100)}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Live Stats Section */}
      <motion.div variants={itemVariants}>
        <h2 className="font-serif text-xl tracking-tight text-white mb-6">
          LIVE STATS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Users */}
          <div 
            data-testid="active-users-card"
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-sm">
                <Users className="h-6 w-6 text-white/60" />
              </div>
              <div>
                <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
                  Active Users
                </p>
                <p className="font-serif text-3xl text-white mt-1">
                  {stats?.active_users || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Server Connectivity */}
          <div 
            data-testid="server-connectivity-card"
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-sm">
                <Wifi className="h-6 w-6 text-white/60" />
              </div>
              <div className="flex-1">
                <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
                  Server Connectivity
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`status-dot ${stats?.server_connectivity === 'Online' ? 'online' : 'offline'}`} />
                  <p className="font-serif text-xl text-white">
                    {stats?.server_connectivity || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Activity Log */}
      <motion.div variants={itemVariants}>
        <h2 className="font-serif text-xl tracking-tight text-white mb-6">
          ACTIVITY LOG
        </h2>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-4 font-mono text-xs text-white/40 space-y-2 max-h-48 overflow-y-auto">
          <div className="flex gap-4">
            <span className="text-white/20">[{new Date().toLocaleTimeString()}]</span>
            <span className="text-green-400">SYSTEM</span>
            <span>Dashboard initialized</span>
          </div>
          <div className="flex gap-4">
            <span className="text-white/20">[{new Date().toLocaleTimeString()}]</span>
            <span className="text-blue-400">AUTH</span>
            <span>Session validated</span>
          </div>
          <div className="flex gap-4">
            <span className="text-white/20">[{new Date().toLocaleTimeString()}]</span>
            <span className="text-yellow-400">DRIVER</span>
            <span>Status check: {status?.driver_status}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;
