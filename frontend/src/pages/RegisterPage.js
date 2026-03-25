import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Sparkles, Eye, EyeOff, Key } from 'lucide-react';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteKey, setInviteKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, inviteKey);
      toast.success('Registration successful. Welcome.');
      navigate('/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.detail;
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Registration failed');
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
            INITIATION
          </h1>
          <p className="font-mono text-xs tracking-[0.3em] text-white/30 uppercase">
            Join the Network
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Invite Key - Prominent */}
            <div className="space-y-2">
              <label className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase flex items-center gap-2">
                <Key className="h-3 w-3" />
                Invite Key
              </label>
              <Input
                type="text"
                value={inviteKey}
                onChange={(e) => setInviteKey(e.target.value.toUpperCase())}
                data-testid="register-invite-input"
                className="bg-black border-white/20 focus:border-white/50 text-white font-mono h-12 rounded-sm tracking-[0.2em] text-center"
                placeholder="ANELY-XXXX-XXXX"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="register-email-input"
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
                  data-testid="register-password-input"
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

            <div className="space-y-2">
              <label className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
                Confirm Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="register-confirm-password-input"
                className="bg-black border-white/20 focus:border-white/50 text-white font-mono h-12 rounded-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              data-testid="register-submit-btn"
              disabled={loading}
              className="w-full bg-white text-black font-mono uppercase tracking-widest h-12 rounded-sm hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Initiating...' : 'Complete Initiation'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-4">
            <Link
              to="/login"
              data-testid="login-link"
              className="block font-mono text-xs tracking-widest text-white/40 hover:text-white/80 uppercase transition-colors"
            >
              Already initiated? Login
            </Link>
            <Link
              to="/request-invite"
              data-testid="request-invite-link"
              className="block font-mono text-[10px] tracking-widest text-white/20 hover:text-white/40 uppercase transition-colors"
            >
              Need an invite key?
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
