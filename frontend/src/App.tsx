import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Database, Book, MessageSquare, Share2 } from 'lucide-react';
import SourceManager from './components/SourceManager';
import DataDictionary from './components/DataDictionary';
import ChatInterface from './components/ChatInterface';
import LineageView from './components/LineageView';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <nav className="w-64 bg-slate-900 text-white flex flex-col p-4 shadow-xl">
          <div className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Database className="text-blue-400" />
            <span>DataDictAI</span>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition">
              <Database size={20} /> Sources
            </Link>
            <Link to="/dictionary" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition">
              <Book size={20} /> Dictionary
            </Link>
            <Link to="/lineage" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition">
              <Share2 size={20} /> Lineage
            </Link>
            <Link to="/chat" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition">
              <MessageSquare size={20} /> AI Chat
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8">
          <Routes>
            <Route path="/" element={<SourceManager />} />
            <Route path="/dictionary" element={<DataDictionary />} />
            <Route path="/lineage" element={<LineageView />} />
            <Route path="/chat" element={<ChatInterface />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
