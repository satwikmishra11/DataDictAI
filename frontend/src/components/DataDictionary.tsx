import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Search, ChevronRight, BarChart, Info } from 'lucide-react';

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

  const filteredSchema = schema.filter(t => 
    t.table_name.toLowerCase().includes(search.toLowerCase()) ||
    t.ai_summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Data Dictionary</h1>
        <div className="flex gap-4">
          <select 
            className="p-2 border rounded bg-white" 
            value={selectedSourceId} 
            onChange={e => setSelectedSourceId(e.target.value)}
          >
            {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              className="pl-10 pr-4 py-2 border rounded-lg bg-white" 
              placeholder="Search tables or columns..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {filteredSchema.map((table, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Table size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 uppercase tracking-tight">
                    {table.schema_name}.{table.table_name}
                  </h3>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                Active
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Summary */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-3 text-blue-600 font-semibold uppercase text-xs tracking-wider">
                  <Info size={14} /> AI Generated Summary
                </div>
                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {table.ai_summary || "No summary available."}
                </div>

                <div className="mt-6">
                   <div className="flex items-center gap-2 mb-3 text-slate-600 font-semibold uppercase text-xs tracking-wider">
                    Columns ({table.columns?.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {table.columns?.slice(0, 10).map((col, cIdx) => (
                      <div key={cIdx} className="p-2 bg-slate-50 rounded border text-sm flex justify-between">
                        <span className="font-medium text-slate-700">{col.name}</span>
                        <span className="text-slate-400 text-xs">{col.type}</span>
                      </div>
                    ))}
                    {table.columns?.length > 10 && (
                      <div className="p-2 text-slate-400 text-xs italic">
                        + {table.columns.length - 10} more columns
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quality Metrics */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-4 text-slate-600 font-semibold uppercase text-xs tracking-wider">
                  <BarChart size={14} /> Data Quality Snapshot
                </div>
                <div className="space-y-4">
                   {Object.entries(table.quality_metrics || {}).slice(0, 5).map(([col, metrics], mIdx) => (
                     <div key={mIdx}>
                       <div className="flex justify-between text-xs mb-1">
                         <span className="font-medium text-slate-700 truncate">{col}</span>
                         <span className="text-slate-500">{(100 - (metrics.null_rate * 100)).toFixed(1)}% Fill</span>
                       </div>
                       <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                         <div 
                           className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                           style={{ width: `${(1 - (metrics.null_rate || 0)) * 100}%` }}
                         />
                       </div>
                     </div>
                   ))}
                </div>
                <button className="mt-6 w-full text-center text-xs font-bold text-blue-600 uppercase hover:text-blue-700">
                  View Full Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataDictionary;
