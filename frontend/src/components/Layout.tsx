import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, Book, MessageSquare, Share2, LayoutDashboard, Menu, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={clsx(
      "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
      active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-400 hover:text-white hover:bg-slate-800"
    )}
  >
    {active && (
      <motion.div 
        layoutId="active-pill" 
        className="absolute inset-0 bg-blue-600 z-0 rounded-lg"
        initial={false}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <span className="relative z-10 flex items-center gap-3">
      <Icon size={20} className={clsx(active ? "text-white" : "text-slate-400 group-hover:text-blue-400")} />
      <span className="font-medium">{label}</span>
    </span>
  </Link>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={{ width: 280 }}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-slate-900 text-white flex flex-col shadow-2xl z-20"
      >
        <div className="p-6 flex items-center justify-between">
          <div className={clsx("flex items-center gap-3 overflow-hidden transition-all", !isSidebarOpen && "w-0 opacity-0")}>
            <div className="p-2 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-lg shadow-lg">
              <Database className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 whitespace-nowrap">
              DataDictAI
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <NavItem to="/sources" icon={Database} label="Sources" active={location.pathname === '/sources'} />
          <NavItem to="/dictionary" icon={Book} label="Dictionary" active={location.pathname === '/dictionary'} />
          <NavItem to="/lineage" icon={Share2} label="Lineage" active={location.pathname === '/lineage'} />
          <NavItem to="/chat" icon={MessageSquare} label="AI Assistant" active={location.pathname === '/chat'} />
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className={clsx("flex items-center gap-3", !isSidebarOpen && "justify-center")}>
             <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold border-2 border-slate-600">
               SA
             </div>
             {isSidebarOpen && (
               <div className="flex flex-col">
                 <span className="text-sm font-medium">System Admin</span>
                 <span className="text-xs text-slate-400">admin@datadict.ai</span>
               </div>
             )}
           </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-slate-800">
             {location.pathname === '/' && 'Overview'}
             {location.pathname === '/sources' && 'Data Sources'}
             {location.pathname === '/dictionary' && 'Data Dictionary'}
             {location.pathname === '/lineage' && 'Data Lineage'}
             {location.pathname === '/chat' && 'AI Assistant'}
          </h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <span className="text-sm text-slate-500 font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-8 bg-slate-50 relative scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
