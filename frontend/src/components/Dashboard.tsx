import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Database, Table, Activity, TrendingUp, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:8000/api/v1';

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-[24px] shadow-soft border border-surface-100 group relative overflow-hidden"
  >
    <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
      <Icon size={120} />
    </div>
    <div className="flex items-start justify-between relative z-10">
      <div className={`p-3 rounded-2xl ${color.replace('text-', 'bg-')}/10 ${color}`}>
        <Icon size={24} />
      </div>
      <div className="text-right">
        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{title}</span>
        <p className="text-2xl font-bold text-surface-900 mt-0.5 tracking-tight">{value}</p>
        <p className="text-xs font-medium text-surface-400 mt-1">{subtitle}</p>
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ sources: 0, tables: 0, pii_columns: 0, health_score: 100 });
  const [chartData, setChartData] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    try {
      const statsRes = await axios.get(`${API_BASE}/stats`);
      setStats(statsRes.data);
      
      // Mock data for visualization
      setChartData([
        { name: 'Mon', count: 4000, active: 2400 },
        { name: 'Tue', count: 3000, active: 1398 },
        { name: 'Wed', count: 2000, active: 9800 },
        { name: 'Thu', count: 2780, active: 3908 },
        { name: 'Fri', count: 1890, active: 4800 },
        { name: 'Sat', count: 2390, active: 3800 },
        { name: 'Sun', count: 3490, active: 4300 },
      ]);
    } catch (e) { console.error(e); }
  };

  const handleGlobalSync = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API_BASE}/sync-all`);
      alert("Global sync triggered! Data will update in the background.");
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling for updates
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Enterprise Overview</h1>
          <p className="text-surface-500 mt-1 font-medium italic">Monitoring documentation coverage across all nodes.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={handleGlobalSync}
            disabled={syncing}
            className="px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-all flex items-center gap-2"
           >
             <RefreshCw size={16} className={`${syncing ? 'animate-spin' : ''} text-amber-500`} /> 
             {syncing ? 'Syncing...' : 'Global Refresh'}
           </button>
           <button className="btn-primary flex items-center gap-2">
             <TrendingUp size={16} /> Export Audit
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Connected Sources" value={stats.sources} icon={Database} color="text-brand-600" subtitle="Total DB Bridges" />
        <StatCard title="Scanned Tables" value={stats.tables.toLocaleString()} icon={Table} color="text-indigo-600" subtitle="Indexed Entities" />
        <StatCard title="Data Health" value={`${stats.health_score}%`} icon={ShieldCheck} color="text-emerald-600" subtitle="Integrity Score" />
        <StatCard title="PII Alerts" value={stats.pii_columns} icon={Activity} color="text-brand-500" subtitle="Sensitive Fields" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-soft border border-surface-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-surface-900 tracking-tight">Activity Log</h3>
              <p className="text-xs text-surface-400 font-medium">Schema changes & quality alerts over time.</p>
            </div>
            <div className="flex bg-surface-100 p-1 rounded-xl">
               <button className="px-3 py-1 text-[10px] font-bold uppercase rounded-lg bg-white shadow-sm">Real-time</button>
               <button className="px-3 py-1 text-[10px] font-bold uppercase text-surface-500">Historical</button>
            </div>
          </div>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b5bf0" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b5bf0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="active" stroke="#3b5bf0" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-brand-600 p-8 rounded-[32px] shadow-elevated text-white flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700">
            <Zap size={240} />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-4 relative z-10">AI Copilot <br/>Efficiency</h3>
          <p className="text-brand-100 text-sm leading-relaxed mb-8 relative z-10 font-medium">
            Your automated documentation coverage is at <span className="text-white font-bold">84%</span>. Gemini 2.0 Flash saved you approximately <span className="text-white font-bold">22 hours</span> of manual work this week.
          </p>
          <div className="mt-auto space-y-4 relative z-10">
            <div className="space-y-1.5">
               <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-brand-200">
                 <span>Coverage</span>
                 <span>84%</span>
               </div>
               <div className="w-full h-1.5 bg-brand-500 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: '84%' }} transition={{ duration: 1.5 }} className="h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
               </div>
            </div>
            <button className="w-full py-3 bg-white text-brand-600 rounded-2xl font-bold text-sm hover:bg-brand-50 transition-colors shadow-xl">
              Optimize Coverage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
