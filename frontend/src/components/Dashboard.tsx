import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Database, Table, AlertTriangle, CheckCircle, Activity, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:8000/api/v1';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
      <Icon size={64} />
    </div>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.replace('text-', '')}`}>
        <Icon size={24} className={color.replace('bg-', 'text-').replace('-100', '-600')} />
      </div>
      {trend && (
        <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <ArrowUpRight size={12} className="mr-1" /> {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
    <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    sources: 0,
    tables: 0,
    activeAlerts: 2,
    healthScore: 94
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Simulate fetching dashboard data
    const fetchData = async () => {
      try {
        const sourcesRes = await axios.get(`${API_BASE}/sources`);
        const sources = sourcesRes.data;
        let totalTables = 0;
        
        // This is simplified. Ideally backend provides a summary endpoint.
        // We'll mock the chart data for now based on source count to show the UI.
        
        setStats(prev => ({ ...prev, sources: sources.length }));
        
        const mockChartData = sources.map((s: any, i: number) => ({
          name: s.name,
          tables: Math.floor(Math.random() * 50) + 10, // Mock data
          health: Math.floor(Math.random() * 20) + 80
        }));
        setChartData(mockChartData);
        setStats(prev => ({ ...prev, tables: mockChartData.reduce((acc: number, curr: any) => acc + curr.tables, 0) }));

      } catch (e) { console.error(e); }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">System Overview</h1>
        <p className="text-slate-500 mt-2">Welcome back! Here's what's happening with your data landscape today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Connected Sources" value={stats.sources} icon={Database} color="text-blue-600" trend="+1 New" />
        <StatCard title="Total Tables" value={stats.tables} icon={Table} color="text-purple-600" trend="+12%" />
        <StatCard title="Data Health Score" value={`${stats.healthScore}%`} icon={Activity} color="text-green-600" trend="+2.4%" />
        <StatCard title="Active Alerts" value={stats.activeAlerts} icon={AlertTriangle} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Tables per Source</h3>
            <select className="text-sm border-none bg-slate-50 rounded-lg p-2 text-slate-600 font-medium focus:ring-0">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="tables" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Storage Distribution</h3>
          <p className="text-sm text-slate-500 mb-6">Distribution of data volume across connected sources.</p>
          <div className="flex-1 min-h-[200px] relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="tables"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="block text-2xl font-bold text-slate-800">{stats.tables}</span>
                <span className="text-xs text-slate-400 font-medium uppercase">Tables</span>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {chartData.map((entry: any, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-600 font-medium">{entry.name}</span>
                </div>
                <span className="text-slate-800 font-bold">{entry.tables}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
