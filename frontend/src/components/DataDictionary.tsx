import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Search, Filter, BarChart, Info, MoreHorizontal, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:8000/api/v1';

const DataDictionary = () => {
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [schema, setSchema] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await axios.get(`${API_BASE}/sources`);
        setSources(res.data);
        if (res.data.length > 0) setSelectedSourceId(res.data[0].id);
      } catch (e) { console.error(e); }
    };
    fetchSources();
  }, []);

  useEffect(() => {
    if (selectedSourceId) {
      const fetchSchema = async () => {
        try {
          const res = await axios.get(`${API_BASE}/schema/${selectedSourceId}`);
          setSchema(res.data);
        } catch (e) { console.error(e); }
      };
      fetchSchema();
    }
  }, [selectedSourceId]);

  const filteredSchema = schema.filter((t: any) => 
    t.table_name.toLowerCase().includes(search.toLowerCase()) ||
    t.ai_summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" 
              placeholder="Search tables, columns..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Filter size={18} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm font-medium text-slate-500">Source:</span>
          <select 
            className="p-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" 
            value={selectedSourceId} 
            onChange={e => setSelectedSourceId(e.target.value)}
          >
            {sources.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {filteredSchema.map((table: any, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={idx} 
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Table Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-blue-600">
                  <Table size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                    {table.table_name}
                    <span className="text-xs font-normal text-slate-400 px-2 py-0.5 border rounded-full bg-white">
                      {table.schema_name}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                    <span>{table.columns?.length} Columns</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>Last updated 2 days ago</span>
                  </p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal size={20} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* AI Summary Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-sm uppercase tracking-wide">
                    <Info size={16} /> AI Insight
                  </div>
                  <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                    {table.ai_summary || "Analyzing table structure to generate insights..."}
                  </p>
                </div>

                <div>
                   <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Schema Structure</h4>
                   <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                       <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                         <tr>
                           <th className="px-4 py-3 font-medium">Column Name</th>
                           <th className="px-4 py-3 font-medium">Type</th>
                           <th className="px-4 py-3 font-medium">Nullable</th>
                         </tr>
                       </thead>
                       <tbody>
                         {table.columns?.slice(0, 5).map((col: any, cIdx: number) => (
                           <tr key={cIdx} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                             <td className="px-4 py-3 font-medium text-slate-700">{col.name}</td>
                             <td className="px-4 py-3 text-slate-500 font-mono text-xs">{col.type}</td>
                             <td className="px-4 py-3 text-slate-500">
                               {col.nullable ? 
                                 <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs">Yes</span> : 
                                 <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-xs">No</span>
                               }
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                     {table.columns?.length > 5 && (
                       <div className="p-2 text-center text-xs text-blue-600 font-medium cursor-pointer hover:bg-slate-50 transition-colors border-t">
                         View all {table.columns.length} columns
                       </div>
                     )}
                   </div>
                </div>
              </div>

              {/* Quality Sidebar */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm uppercase tracking-wide">
                    <BarChart size={16} className="text-purple-500" /> Quality Health
                  </div>
                  <div className="space-y-4">
                     {Object.entries(table.quality_metrics || {}).slice(0, 4).map(([col, metrics]: any, mIdx) => (
                       <div key={mIdx} className="space-y-1">
                         <div className="flex justify-between text-xs">
                           <span className="font-medium text-slate-700 truncate max-w-[120px]">{col}</span>
                           <span className="text-slate-500 font-mono">{(100 - (metrics.null_rate * 100)).toFixed(0)}%</span>
                         </div>
                         <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(1 - (metrics.null_rate || 0)) * 100}%` }}
                             className={`h-full rounded-full ${metrics.null_rate > 0.5 ? 'bg-red-400' : metrics.null_rate > 0.1 ? 'bg-amber-400' : 'bg-green-500'}`}
                           />
                         </div>
                       </div>
                     ))}
                  </div>
                  <button className="mt-5 w-full py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-1">
                    Full Report <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredSchema.length === 0 && (
          <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-600">No tables found</p>
            <p className="text-sm">Try adjusting your search filters or select a different source.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataDictionary;
