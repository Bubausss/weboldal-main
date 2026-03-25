import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  HelpCircle, 
  Shield,
  LogOut,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/config', icon: Settings, label: 'Config' },
    { to: '/community', icon: Users, label: 'Community' },
    { to: '/support', icon: HelpCircle, label: 'Support' },
  ];

  if (user?.is_admin) {
    navItems.push({ to: '/admin', icon: Shield, label: 'Admin' });
  }

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="h-8 w-8 text-white" />
          <div>
            <h1 className="font-serif text-xl tracking-wider text-white text-glow">ANELY</h1>
            <p className="font-mono text-[10px] tracking-[0.3em] text-white/40 uppercase">Driver</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item, index) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NavLink
              to={item.to}
              onClick={handleNavClick}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-sm font-mono text-xs uppercase tracking-widest transition-all duration-300 ${
                  isActive
                    ? 'bg-white/10 text-white border-l-2 border-white'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-white/5">
        <div className="mb-4 px-4">
          <p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-1">Logged in as</p>
          <p className="font-mono text-xs text-white/70 truncate">{user?.email}</p>
          {user?.is_admin && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-white/10 text-[10px] font-mono tracking-widest text-white/60 uppercase rounded-sm">
              Admin
            </span>
          )}
        </div>
        <button
          onClick={logout}
          data-testid="logout-btn"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-sm font-mono text-xs uppercase tracking-widest text-white/40 hover:text-red-400 hover:bg-red-900/10 transition-all duration-300"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
