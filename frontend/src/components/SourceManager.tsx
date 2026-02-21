import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Database, Play } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

const SourceManager = () => {
  const [sources, setSources] = useState([]);
  const [name, setName] = useState('');
  const [dbType, setDbType] = useState('postgres');
  const [connectionUrl, setConnectionUrl] = useState('');

  const fetchSources = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sources`);
      setSources(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchSources(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/sources`, { name, db_type: dbType, connection_url: connectionUrl });
      setName(''); setConnectionUrl('');
      fetchSources();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-2">
        <Database /> Manage Data Sources
      </h1>

      {/* Add New Source */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-12">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Plus size={20} className="text-blue-600" /> Add New Database
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Name</label>
            <input className="p-2 border rounded" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Type</label>
            <select className="p-2 border rounded" value={dbType} onChange={e => setDbType(e.target.value)}>
              <option value="postgres">PostgreSQL</option>
              <option value="snowflake">Snowflake</option>
              <option value="mysql">MySQL</option>
              <option value="mssql">SQL Server</option>
            </select>
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Connection URL (SQLAlchemy compatible)</label>
            <input className="p-2 border rounded" placeholder="postgresql://user:pass@host/db" value={connectionUrl} onChange={e => setConnectionUrl(e.target.value)} required />
          </div>
          <button type="submit" className="col-span-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition font-medium">
            Connect & Scan Database
          </button>
        </form>
      </div>

      {/* List Sources */}
      <div className="grid grid-cols-1 gap-4">
        {sources.map(s => (
          <div key={s.id} className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{s.name}</h3>
              <p className="text-sm text-slate-500">{s.db_type} | Created {new Date(s.created_at).toLocaleDateString()}</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded text-slate-600 hover:bg-slate-200 transition">
              <Play size={16} /> Re-scan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceManager;
