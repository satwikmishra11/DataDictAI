import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Table, 
  Search, 
  Filter, 
  BarChart, 
  Info, 
  MoreHorizontal, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Columns,
  Sparkles,
  Loader2,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000/api/v1';

const DataDictionary = () => {
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [schema, setSchema] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [fetchingSchema, setFetchingSchema] = useState(false);

  const fetchSources = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sources`);
      setSources(res.data);
      if (res.data.length > 0 && !selectedSourceId) {
        setSelectedSourceId(res.data[0].id);
      }
    } catch (e) { 
      console.error(e); 
    } finally {
      setLoading(false);
    }
  };

  const fetchSchema = useCallback(async (id: string) => {
    if (!id) return;
    setFetchingSchema(true);
    try {
      const res = await axios.get(`${API_BASE}/schema/${id}`);
      setSchema(res.data);
    } catch (e) { 
      console.error(e); 
    } finally {
      setFetchingSchema(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    if (selectedSourceId) {
      fetchSchema(selectedSourceId);
    }
  }, [selectedSourceId, fetchSchema]);

  const filteredSchema = schema.filter((t: any) => 
    t.table_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.ai_summary && t.ai_summary.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-brand-500 mb-4" size={40} />
        <p className="text-sm font-bold text-surface-400 uppercase tracking-widest">Loading Dictionary...</p>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-[32px] border border-dashed border-surface-200 shadow-soft">
        <Database className="text-surface-200 mb-4" size={64} />
        <h2 className="text-xl font-bold text-surface-900 mb-2">No Data Sources Connected</h2>
        <p className="text-surface-500 max-w-sm text-center">Connect your database in the Source Manager to generate your AI-powered data dictionary.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Semantic Dictionary</h1>
          <p className="text-surface-500 mt-1 font-medium">Auto-generated business definitions and schema health reports.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-soft border border-surface-100">
           {['all', 'flagged', 'archived'].map(tab => (
             <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-brand-500 text-white shadow-lg' : 'text-surface-400 hover:text-surface-600'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      {/* Global Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" size={18} />
          <input 
            className="w-full pl-12 pr-4 py-4 bg-white border border-surface-200 rounded-[20px] focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all shadow-soft text-sm font-medium" 
            placeholder="Search across tables, metadata, and AI summaries..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
          <select 
            className="w-full pl-12 pr-4 py-4 bg-white border border-surface-200 rounded-[20px] outline-none shadow-soft text-sm font-bold text-surface-700 appearance-none cursor-pointer"
            value={selectedSourceId} 
            onChange={e => setSelectedSourceId(e.target.value)}
          >
            {sources.map((s: any) => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
          </select>
        </div>
        <button className="bg-surface-900 text-white rounded-[20px] font-bold text-sm hover:bg-surface-800 transition-all shadow-lg flex items-center justify-center gap-2">
           <Sparkles size={18} className="text-brand-400" /> Re-index All
        </button>
      </div>

      {/* Dictionary Content */}
      <div className="grid grid-cols-1 gap-8 relative min-h-[400px]">
        {fetchingSchema && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-[32px]">
            <Loader2 className="animate-spin text-brand-500" size={32} />
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {filteredSchema.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[32px] border border-surface-100 shadow-soft">
              <p className="text-surface-400 font-bold uppercase text-xs tracking-widest">No tables found matching your search</p>
            </div>
          ) : (
            filteredSchema.map((table: any, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                key={table.id || idx} 
                className="bg-white rounded-[32px] shadow-soft border border-surface-100 overflow-hidden group hover:shadow-elevated transition-all duration-500"
              >
                <div className="grid grid-cols-1 xl:grid-cols-12">
                  <div className="xl:col-span-8 p-8 border-r border-surface-50">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-inner group-hover:bg-brand-500 group-hover:text-white transition-all duration-500">
                          <Table size={28} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-surface-900 tracking-tight flex items-center gap-3">
                            {table.table_name}
                            <span className="text-[10px] font-bold text-brand-500 bg-brand-50 px-2 py-1 rounded-lg uppercase">
                              {table.schema_name}
                            </span>
                          </h3>
                          <div className="flex items-center gap-4 mt-1.5">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-surface-400 uppercase tracking-widest">
                              <Columns size={12} /> {table.columns?.length} Fields
                            </span>
                            <span className="w-1 h-1 bg-surface-200 rounded-full" />
                            <span className="flex items-center gap-1.5 text-xs font-bold text-surface-400 uppercase tracking-widest">
                              <Calendar size={12} /> Live Sync Active
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="p-2.5 text-surface-300 hover:text-surface-600 transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>

                    <div className="bg-surface-50/50 p-6 rounded-[24px] border border-surface-100 relative group/insight">
                      <div className="absolute -top-3 left-6 px-3 py-1 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5">
                        <Sparkles size={10} /> AI Summary
                      </div>
                      <p className="text-surface-700 leading-relaxed font-medium italic">
                        {table.ai_summary || "Our AI is currently synthesizing business context for this entity..."}
                      </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {table.columns?.slice(0, 4).map((col: any, cIdx: number) => (
                        <div key={cIdx} className="p-4 bg-white border border-surface-100 rounded-2xl shadow-sm">
                          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1 truncate">{col.name}</p>
                          <p className="text-xs font-bold text-surface-800 font-mono">{col.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="xl:col-span-4 p-8 bg-surface-50/30 flex flex-col">
                     <div className="flex items-center justify-between mb-8">
                        <h4 className="text-xs font-bold text-surface-400 uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck size={14} className="text-emerald-500" /> Health Metrics
                        </h4>
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">LIVE</span>
                     </div>
                     
                     <div className="flex-1 space-y-6">
                        {Object.entries(table.quality_metrics || {}).slice(0, 4).map(([col, metrics]: any, mIdx) => (
                          <div key={mIdx} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[11px] font-bold text-surface-700 truncate max-w-[140px]">{col}</span>
                              <span className="text-[10px] font-mono font-bold text-surface-500">{(100 - (metrics.null_rate * 100)).toFixed(0)}% FILL</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(1 - (metrics.null_rate || 0)) * 100}%` }}
                                className={`h-full rounded-full ${metrics.null_rate > 0.5 ? 'bg-red-400' : 'bg-brand-500 shadow-[0_0_8px_rgba(59,91,240,0.4)]'}`}
                              />
                            </div>
                          </div>
                        ))}
                     </div>

                     <button className="mt-8 w-full py-3 bg-white border border-surface-200 rounded-2xl text-xs font-bold text-surface-600 hover:bg-surface-100 transition-all flex items-center justify-center gap-2">
                       Deep Statistical Profile <ArrowRight size={14} />
                     </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DataDictionary;
