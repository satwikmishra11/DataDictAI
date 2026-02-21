import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SourceManager from './components/SourceManager';
import DataDictionary from './components/DataDictionary';
import ChatInterface from './components/ChatInterface';
import LineageView from './components/LineageView';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sources" element={<SourceManager />} />
          <Route path="/dictionary" element={<DataDictionary />} />
          <Route path="/lineage" element={<LineageView />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
