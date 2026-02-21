import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import { RefreshCcw, Database, Loader2, Share2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

// Custom Table Node Component
const TableNode = ({ data }) => (
  <div className="bg-white border-2 border-slate-900 rounded-xl shadow-2xl w-72 overflow-hidden">
    <div className="bg-slate-900 text-white p-3 text-sm font-bold flex justify-between items-center">
      <span className="truncate">{data.label}</span>
      <Database size={14} className="opacity-50" />
    </div>
    <div className="p-3 space-y-1.5 max-h-60 overflow-y-auto bg-slate-50/50">
      {data.columns?.map((col, i) => (
        <div key={i} className="text-[11px] flex justify-between items-center border-b border-slate-100 pb-1 last:border-0">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800">{col.name}</span>
            {col.tags?.length > 0 && (
              <div className="flex gap-1 mt-0.5">
                {col.tags.map(t => (
                  <span key={t} className="px-1 bg-red-100 text-red-600 rounded-[2px] text-[8px] font-bold uppercase">PII</span>
                ))}
              </div>
            )}
          </div>
          <span className="text-slate-400 font-mono text-[9px]">{col.type.split('(')[0]}</span>
        </div>
      ))}
    </div>
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-brand-500 border-2 border-white" />
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-brand-500 border-2 border-white" />
  </div>
);

const nodeTypes = { table: TableNode };

const LineageView = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [loadingSources, setLoadingSources] = useState(true);
  const [fetchingLineage, setFetchingLineage] = useState(false);

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
      setLoadingSources(false);
    }
  };

  useEffect(() => { 
    fetchSources(); 
  }, []);

  const fetchLineage = useCallback(async (id: string) => {
    if (!id) return;
    setFetchingLineage(true);
    try {
      const res = await axios.get(`${API_BASE}/schema/${id}`);
      const schema = res.data.sort((a, b) => a.table_name.localeCompare(b.table_name));
      
      // Calculate layout
      const nodesPerRow = 3;
      const xOffset = 400;
      const yOffset = 350;

      const newNodes = schema.map((table, i) => ({
        id: table.table_name,
        type: 'table',
        data: { label: table.table_name, columns: table.columns },
        position: { 
          x: (i % nodesPerRow) * xOffset, 
          y: Math.floor(i / nodesPerRow) * yOffset 
        },
      }));

      const newEdges = [];
      schema.forEach(table => {
        table.relationships?.forEach((rel, ri) => {
          const targetExists = schema.some(t => t.table_name === rel.referred_table);
          if (targetExists) {
            newEdges.push({
              id: `e-${table.table_name}-${rel.referred_table}-${ri}`,
              source: table.table_name,
              target: rel.referred_table,
              animated: true,
              label: rel.constrained_columns?.join(', '),
              labelStyle: { fontSize: 8, fill: '#64748b', fontWeight: 700 },
              style: { stroke: '#3b82f6', strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#3b82f6',
              },
            });
          }
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (e) { 
      console.error(e); 
    } finally {
      setFetchingLineage(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (selectedSourceId) {
      fetchLineage(selectedSourceId);
    }
  }, [selectedSourceId, fetchLineage]);

  if (loadingSources) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-brand-500 mb-4" size={40} />
        <p className="text-sm font-bold text-surface-400 uppercase tracking-widest">Mapping data flows...</p>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-[32px] border border-dashed border-surface-200 shadow-soft">
        <Share2 className="text-surface-200 mb-4" size={64} />
        <h2 className="text-xl font-bold text-surface-900 mb-2">No Relationships to Visualize</h2>
        <p className="text-surface-500 max-w-sm text-center">Connect a database with foreign key constraints to see your data lineage in action.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] w-full flex flex-col space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Entity Relationships</h1>
          <p className="text-slate-500 font-medium">Visualizing foreign key constraints and data flow.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="p-2.5 border border-slate-200 rounded-xl bg-white shadow-sm text-sm font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer" 
            value={selectedSourceId} 
            onChange={e => setSelectedSourceId(e.target.value)}
          >
            {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button 
            onClick={() => fetchLineage(selectedSourceId)}
            disabled={fetchingLineage}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCcw size={18} className={`${fetchingLineage ? 'animate-spin' : ''} text-slate-600`} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 rounded-[32px] border border-slate-200 overflow-hidden relative shadow-inner">
        {fetchingLineage && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-500" size={32} />
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
        >
          <Background color="#cbd5e1" gap={20} />
          <Controls className="bg-white border-slate-200 rounded-lg shadow-lg" />
          <MiniMap 
            className="bg-white border border-slate-200 rounded-xl shadow-2xl" 
            nodeColor="#f8fafc"
            maskColor="rgba(241, 245, 249, 0.7)"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default LineageView;
