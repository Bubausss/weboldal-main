import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RequestInvitePage from "./pages/RequestInvitePage";
import DashboardPage from "./pages/DashboardPage";
import ConfigPage from "./pages/ConfigPage";
import CommunityPage from "./pages/CommunityPage";
import SupportPage from "./pages/SupportPage";
import AdminPage from "./pages/AdminPage";
import Layout from "./components/Layout";
import "./App.css";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/50 font-mono text-sm tracking-widest">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/50 font-mono text-sm tracking-widest">LOADING...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/request-invite" element={<PublicRoute><RequestInvitePage /></PublicRoute>} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="config" element={<ConfigPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="noise-overlay" />
        <AppRoutes />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontFamily: 'JetBrains Mono, monospace',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
