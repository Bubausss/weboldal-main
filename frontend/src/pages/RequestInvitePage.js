import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Sparkles, Send } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RequestInvitePage = () => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/invite-requests`, { email, reason });
      setSubmitted(true);
      toast.success('Request submitted. Await judgement.');
    } catch (error) {
      const errorMsg = error.response?.data?.detail;
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md"
        >
          <Sparkles className="h-16 w-16 text-white/40 mx-auto mb-6" />
          <h1 className="font-serif text-3xl tracking-tight text-white mb-4">
            REQUEST RECEIVED
          </h1>
          <p className="font-mono text-sm text-white/40 mb-8 leading-relaxed">
            Your request has been submitted for review. If approved, you will receive your invite key via the email provided.
          </p>
          <Link
            to="/login"
            className="font-mono text-xs tracking-widest text-white/30 hover:text-white/60 uppercase transition-colors"
          >
            Return to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
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
            <Sparkles className="h-16 w-16 text-white/40" />
          </motion.div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white mb-2">
            REQUEST ACCESS
          </h1>
          <p className="font-mono text-xs tracking-[0.2em] text-white/30 uppercase">
            Prove your worth
          </p>
        </div>

        {/* Request Form */}
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
                data-testid="request-email-input"
                className="bg-black border-white/20 focus:border-white/50 text-white font-mono h-12 rounded-sm"
                placeholder="ghost@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
                Why do you seek access?
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                data-testid="request-reason-input"
                className="bg-black border-white/20 focus:border-white/50 text-white font-mono rounded-sm min-h-[120px] resize-none"
                placeholder="State your purpose..."
                required
              />
            </div>

            <Button
              type="submit"
              data-testid="request-submit-btn"
              disabled={loading}
              className="w-full bg-transparent border border-white/20 text-white font-mono uppercase tracking-widest h-12 rounded-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link
              to="/login"
              data-testid="back-to-login-link"
              className="font-mono text-xs tracking-widest text-white/40 hover:text-white/80 uppercase transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RequestInvitePage;
