import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

// Custom Table Node Component
const TableNode = ({ data }) => (
  <div className="bg-white border-2 border-slate-900 rounded-lg shadow-xl w-64">
    <div className="bg-slate-900 text-white p-2 text-xs font-bold rounded-t flex justify-between">
      <span>{data.label}</span>
    </div>
    <div className="p-2 space-y-1">
      {data.columns?.map((col, i) => (
        <div key={i} className="text-[10px] flex justify-between border-b border-slate-50">
          <span className="text-slate-700">{col.name}</span>
          <span className="text-slate-400">{col.type}</span>
        </div>
      ))}
    </div>
    <Handle type="target" position={Position.Left} className="w-2 h-2 bg-blue-500" />
    <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-500" />
  </div>
);

const nodeTypes = { table: TableNode };

const LineageView = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');

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
      const fetchLineage = async () => {
        try {
          const res = await axios.get(`${API_BASE}/schema/${selectedSourceId}`);
          const schema = res.data;
          
          const newNodes = schema.map((table, i) => ({
            id: table.table_name,
            type: 'table',
            data: { label: table.table_name, columns: table.columns },
            position: { x: (i % 3) * 300, y: Math.floor(i / 3) * 200 },
          }));

          const newEdges = [];
          schema.forEach(table => {
            table.relationships?.forEach((rel, ri) => {
              newEdges.push({
                id: `e-${table.table_name}-${rel.referred_table}-${ri}`,
                source: table.table_name,
                target: rel.referred_table,
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 },
              });
            });
          });

          setNodes(newNodes);
          setEdges(newEdges);
        } catch (e) { console.error(e); }
      };
      fetchLineage();
    }
  }, [selectedSourceId, setNodes, setEdges]);

  return (
    <div className="h-[calc(100vh-120px)] w-full flex flex-col">
       <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-slate-900">Entity Relationships</h1>
        <select 
          className="p-2 border rounded bg-white shadow-sm" 
          value={selectedSourceId} 
          onChange={e => setSelectedSourceId(e.target.value)}
        >
          {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="flex-1 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
};

export default LineageView;
