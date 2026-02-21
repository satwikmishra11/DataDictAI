import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Database, Play, CheckCircle, Server, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:8000/api/v1';

const SourceManager = () => {
  const [sources, setSources] = useState([]);
  const [name, setName] = useState('');
  const [dbType, setDbType] = useState('postgres');
  const [connectionUrl, setConnectionUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSources = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sources`);
      setSources(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchSources(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/sources`, { name, db_type: dbType, connection_url: connectionUrl });
      setName(''); setConnectionUrl('');
      fetchSources();
    } catch (e) { console.error(e); } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Data Sources</h1>
          <p className="text-slate-500 mt-1">Manage your database connections and metadata extraction.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/30">
          <Plus size={18} /> New Connection
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connection Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Server size={20} className="text-blue-500" /> Connect Database
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Source Name</label>
              <input 
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                placeholder="e.g. Production DB"
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Database Type</label>
              <select 
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white" 
                value={dbType} 
                onChange={e => setDbType(e.target.value)}
              >
                <option value="postgres">PostgreSQL</option>
                <option value="snowflake">Snowflake</option>
                <option value="mysql">MySQL</option>
                <option value="mssql">SQL Server</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Connection String</label>
              <textarea 
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-sm" 
                placeholder="postgresql://user:pass@host/db" 
                rows={3}
                value={connectionUrl} 
                onChange={e => setConnectionUrl(e.target.value)} 
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white p-3 rounded-lg hover:bg-slate-800 transition font-medium flex justify-center items-center gap-2"
            >
              {loading ? <Activity className="animate-spin" size={18} /> : <CheckCircle size={18} />}
              {loading ? 'Connecting...' : 'Connect & Scan'}
            </button>
          </form>
        </div>

        {/* Sources List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Active Connections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((s: any) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={s.id} 
                className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Database size={24} />
                  </div>
                  <div className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-800">{s.name}</h3>
                <p className="text-sm text-slate-500 mb-4 font-mono truncate">{s.connection_url.split('@')[1] || s.connection_url}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 border-t pt-4">
                  <span>{s.db_type.toUpperCase()}</span>
                  <span>Scanned: {new Date(s.created_at).toLocaleDateString()}</span>
                </div>
                <button className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                  <Play size={14} /> Re-scan Metadata
                </button>
              </motion.div>
            ))}
            {sources.length === 0 && (
              <div className="col-span-2 p-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                <Database size={48} className="mb-4 opacity-50" />
                <p>No data sources connected yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceManager;
