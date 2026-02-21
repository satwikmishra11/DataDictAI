import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Database, 
  Book, 
  MessageSquare, 
  Share2, 
  LayoutDashboard, 
  Menu, 
  X, 
  Bell, 
  ChevronRight, 
  Settings,
  Search,
  Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, active, collapsed }: any) => (
  <Link 
    to={to} 
    className={clsx(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
      active 
        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25" 
        : "text-surface-400 hover:text-white hover:bg-surface-800"
    )}
  >
    <Icon size={20} className={clsx(active ? "text-white" : "text-surface-500 group-hover:text-brand-400")} />
    {!collapsed && <span className="font-semibold text-sm tracking-wide">{label}</span>}
    {active && !collapsed && (
      <motion.div layoutId="nav-glow" className="absolute right-2 w-1.5 h-1.5 rounded-full bg-brand-200 shadow-[0_0_8px_white]" />
    )}
  </Link>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-surface-950 font-sans text-surface-900 overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        className="bg-surface-900 text-white flex flex-col z-30 relative border-r border-surface-800"
      >
        <div className="h-20 flex items-center px-6 justify-between">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <Database size={20} className="text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-surface-400">
                  DataDict<span className="text-brand-400">AI</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-500 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className="flex-1 px-4 space-y-8 mt-4">
           <div className="space-y-1.5">
             {!collapsed && <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest px-3 mb-3">Main Menu</p>}
             <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} collapsed={collapsed} />
             <NavItem to="/sources" icon={Database} label="Sources" active={location.pathname === '/sources'} collapsed={collapsed} />
             <NavItem to="/dictionary" icon={Book} label="Dictionary" active={location.pathname === '/dictionary'} collapsed={collapsed} />
           </div>

           <div className="space-y-1.5">
             {!collapsed && <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest px-3 mb-3">Analysis</p>}
             <NavItem to="/lineage" icon={Share2} label="Lineage" active={location.pathname === '/lineage'} collapsed={collapsed} />
             <NavItem to="/chat" icon={MessageSquare} label="AI Copilot" active={location.pathname === '/chat'} collapsed={collapsed} />
           </div>
        </div>

        <div className="p-4 bg-surface-950/50">
           <div className={clsx("flex items-center gap-3 p-2 rounded-xl bg-surface-800/50 border border-surface-700/50", collapsed && "justify-center")}>
             <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-xs font-bold shadow-lg shadow-brand-500/10">
               JD
             </div>
             {!collapsed && (
               <div className="flex-1 min-w-0">
                 <p className="text-xs font-bold truncate">John Doe</p>
                 <p className="text-[10px] text-surface-500 truncate">Pro Plan</p>
               </div>
             )}
           </div>
        </div>
      </motion.aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-50 rounded-l-[32px] my-2 mr-2 shadow-2xl relative">
        <header className="h-16 flex items-center justify-between px-8 border-b border-surface-200/50">
          <div className="flex items-center gap-4 text-surface-500">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-100 rounded-lg text-xs font-medium">
               <Command size={14} /> <span>Search workspace...</span>
               <span className="ml-4 opacity-50 font-mono">⌘K</span>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-surface-400 hover:text-brand-500 transition-colors relative">
              <Bell size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-surface-50"></span>
            </button>
            <div className="h-8 w-px bg-surface-200"></div>
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                 <p className="text-xs font-bold text-surface-900 leading-tight">System Status</p>
                 <p className="text-[10px] font-medium text-green-500">Operational</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center">
                 <Settings size={18} className="text-surface-500" />
               </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 relative scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="max-w-[1400px] mx-auto"
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
