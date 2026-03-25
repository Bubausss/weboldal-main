import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Access granted');
      navigate('/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.detail;
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center mb-4"
          >
            <Sparkles className="h-16 w-16 text-white text-glow" />
          </motion.div>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-white text-glow mb-2">
            ANELY
          </h1>
          <p className="font-mono text-xs tracking-[0.3em] text-white/30 uppercase">
            Secure Access Portal
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
                className="bg-black border-white/20 focus:border-white/50 text-white font-mono h-12 rounded-sm"
                placeholder="ghost@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password-input"
                  className="bg-black border-white/20 focus:border-white/50 text-white font-mono h-12 rounded-sm pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              data-testid="login-submit-btn"
              disabled={loading}
              className="w-full bg-white text-black font-mono uppercase tracking-widest h-12 rounded-sm hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Authenticating...' : 'Enter'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-4">
            <Link
              to="/register"
              data-testid="register-link"
              className="block font-mono text-xs tracking-widest text-white/40 hover:text-white/80 uppercase transition-colors"
            >
              Have an invite key? Register
            </Link>
            <Link
              to="/request-invite"
              data-testid="request-invite-link"
              className="block font-mono text-[10px] tracking-widest text-white/20 hover:text-white/40 uppercase transition-colors"
            >
              Request Access
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
