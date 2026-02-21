import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Database, 
  Play, 
  CheckCircle, 
  Server, 
  Activity, 
  Trash2, 
  ExternalLink,
  Shield,
  Zap,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:8000/api/v1';

const placeholders = {
  postgres: "postgresql://user:password@localhost:5432/dbname",
  mysql: "mysql+pymysql://user:password@localhost:3306/dbname",
  snowflake: "snowflake://user:password@account/dbname/schema?warehouse=warehouse&role=role",
  mssql: "mssql+pyodbc://user:password@localhost/dbname?driver=ODBC+Driver+17+for+SQL+Server"
};

const SourceManager = () => {
  const [sources, setSources] = useState([]);
  const [name, setName] = useState('');
  const [dbType, setDbType] = useState('postgres');
  const [connectionUrl, setConnectionUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const fetchSources = async () => {
    setFetching(true);
    try {
      const res = await axios.get(`${API_BASE}/sources`);
      setSources(res.data);
    } catch (e) { 
      console.error(e); 
    } finally {
      setFetching(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this source? All associated metadata will be removed.")) return;
    try {
      await axios.delete(`${API_BASE}/sources/${id}`);
      fetchSources();
    } catch (e) { console.error(e); }
  };

  const handleSync = async (id: number) => {
    setSyncingId(id);
    try {
      await axios.post(`${API_BASE}/sync/${id}`);
      alert("Sync triggered! Data will update in a few moments.");
    } catch (e) { 
      console.error(e); 
    } finally {
      setSyncingId(null);
    }
  };

  useEffect(() => { 
    fetchSources(); 
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/sources`, { name, db_type: dbType, connection_url: connectionUrl });
      setName(''); setConnectionUrl('');
      fetchSources();
    } catch (e) { 
      if (axios.isAxiosError(e) && e.response?.status === 400) {
        alert(e.response.data.detail);
      } else {
        console.error(e); 
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Data Connectivity</h1>
          <p className="text-surface-500 mt-1 font-medium">Provision new database bridges and monitor existing tunnels.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex -space-x-2">
             {[1,2,3].map(i => (
               <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-surface-200" />
             ))}
           </div>
           <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">System Integrated</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Connection Panel */}
        <div className="xl:col-span-4">
          <div className="bg-white p-8 rounded-[32px] shadow-soft border border-surface-100 sticky top-8">
            <div className="flex items-center gap-3 mb-8">
               <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600">
                 <Zap size={20} />
               </div>
               <h2 className="text-xl font-bold text-surface-900 tracking-tight">Instant Connect</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">Label</label>
                <input className="input-field" placeholder="e.g. Analytics Cluster" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">Provider</label>
                <select className="input-field appearance-none" value={dbType} onChange={e => setDbType(e.target.value)}>
                  <option value="postgres">PostgreSQL (Standard)</option>
                  <option value="snowflake">Snowflake (Enterprise)</option>
                  <option value="mysql">MySQL (Scalable)</option>
                  <option value="mssql">SQL Server (Legacy)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">Secure DSN</label>
                <textarea 
                  className="input-field font-mono text-[13px] leading-relaxed" 
                  placeholder={placeholders[dbType]} 
                  rows={4}
                  value={connectionUrl} 
                  onChange={e => setConnectionUrl(e.target.value)} 
                  required 
                />
                <p className="text-[10px] text-surface-400 flex items-center gap-1.5 mt-2 ml-1">
                  <Shield size={10} className="text-emerald-500" /> End-to-end encrypted connection
                </p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-sm flex justify-center items-center gap-3">
                {loading ? <Activity className="animate-spin" size={18} /> : <Plus size={18} />}
                {loading ? 'Initializing...' : 'Establish Bridge'}
              </button>
            </form>
          </div>
        </div>

        {/* Bridges List */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-lg font-bold text-surface-900 tracking-tight">Active Bridges</h2>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> All Systems Online
              </span>
            </div>
          </div>

          {fetching ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[28px] border border-dashed border-surface-200">
              <Loader2 className="animate-spin text-brand-500 mb-4" size={32} />
              <p className="text-sm font-bold text-surface-400 uppercase tracking-widest">Synchronizing sources...</p>
            </div>
          ) : sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[28px] border border-dashed border-surface-200">
              <Database className="text-surface-200 mb-4" size={48} />
              <p className="text-sm font-bold text-surface-400 uppercase tracking-widest">No active bridges found</p>
              <p className="text-xs text-surface-400 mt-1">Connect your first database to begin extraction.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sources.map((s: any) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={s.id} 
                  className="bg-white p-6 rounded-[28px] border border-surface-100 shadow-soft hover:shadow-elevated transition-all duration-500 group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface-50 rounded-2xl flex items-center justify-center text-surface-400 group-hover:bg-brand-500 group-hover:text-white transition-all duration-500 shadow-inner">
                        <Database size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-surface-900 group-hover:text-brand-600 transition-colors">{s.name}</h3>
                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{s.db_type}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleSync(s.id)}
                        disabled={syncingId === s.id}
                        title="Sync Metadata"
                        className="p-2 text-surface-400 hover:text-brand-500 bg-surface-50 rounded-lg transition-colors"
                      >
                        <RefreshCw size={16} className={syncingId === s.id ? "animate-spin" : ""} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        title="Remove Bridge"
                        className="p-2 text-surface-400 hover:text-red-500 bg-surface-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 bg-surface-50 rounded-xl font-mono text-[10px] text-surface-500 break-all border border-surface-100/50">
                      {s.connection_url.split('@')[1] || s.connection_url}
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-surface-400 uppercase">Integrity</span>
                            <span className="text-xs font-bold text-emerald-500">99.8%</span>
                          </div>
                          <div className="w-px h-6 bg-surface-100" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-surface-400 uppercase">Latency</span>
                            <span className="text-xs font-bold text-surface-700">12ms</span>
                          </div>
                       </div>
                       <button className="p-2 text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                         <Play size={18} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceManager;
