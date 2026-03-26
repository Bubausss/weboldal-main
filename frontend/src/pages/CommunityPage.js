import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Shield, Trophy, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const API = (process.env.REACT_APP_BACKEND_URL || "") + "/api";

const CommunityPage = () => {
  const { getToken } = useAuth();
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitSuggestion = async (e) => {
    e.preventDefault();
    if (!suggestion.trim()) {
      toast.error('Please enter a suggestion');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      await axios.post(`${API}/suggestions`, { message: suggestion }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Suggestion submitted! Admins will review it.');
      setSuggestion('');
    } catch (error) {
      toast.error('Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Discord Server",
      description: "Private community for real-time support, updates, and discussions with other users.",
      status: "Recommended"
    },
    {
      icon: Trophy,
      title: "Leaderboard System",
      description: "Track your stats and compare with other community members.",
      status: "Planned"
    }
  ];

  return (
    <motion.div
      data-testid="community-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white text-glow">
          COMMUNITY
        </h1>
        <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase mt-2">
          The Network
        </p>
      </motion.div>

      {/* Feature Suggestions */}
      <motion.div variants={itemVariants}>
        <h2 className="font-serif text-xl tracking-tight text-white mb-6">
          UPCOMING FEATURES
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((item, index) => (
            <div 
              key={index}
              className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6 hover:border-white/20 transition-all duration-500"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/5 rounded-sm">
                  <item.icon className="h-6 w-6 text-white/60" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-serif text-lg text-white">{item.title}</p>
                    <span className={`font-mono text-[10px] tracking-widest uppercase px-2 py-1 rounded-sm ${
                      item.status === 'Recommended' 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-white/10 text-white/40'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-white/40 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Guidelines */}
      <motion.div variants={itemVariants}>
        <h2 className="font-serif text-xl tracking-tight text-white mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5 text-white/40" />
          COMMUNITY GUIDELINES
        </h2>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="font-mono text-xs text-white/20">01</span>
            <p className="font-mono text-sm text-white/60">
              Do not share your invite key or credentials with anyone.
            </p>
          </div>
          <div className="flex items-start gap-4">
            <span className="font-mono text-xs text-white/20">02</span>
            <p className="font-mono text-sm text-white/60">
              Do not discuss specific operational details in public channels.
            </p>
          </div>
          <div className="flex items-start gap-4">
            <span className="font-mono text-xs text-white/20">03</span>
            <p className="font-mono text-sm text-white/60">
              Respect other members. We are all part of the network.
            </p>
          </div>
          <div className="flex items-start gap-4">
            <span className="font-mono text-xs text-white/20">04</span>
            <p className="font-mono text-sm text-white/60">
              Report any suspicious activity to administrators immediately.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Suggestion Form */}
      <motion.div variants={itemVariants}>
        <h2 className="font-serif text-xl tracking-tight text-white mb-6">
          SUBMIT A SUGGESTION
        </h2>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6">
          <p className="font-mono text-sm text-white/40 leading-relaxed mb-6">
            Have an idea for a new feature or improvement? Submit your suggestion and our team will review it.
          </p>
          <form onSubmit={handleSubmitSuggestion} className="space-y-4">
            <Textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              data-testid="suggestion-input"
              placeholder="Describe your suggestion..."
              className="bg-black border-white/20 focus:border-white/50 text-white font-mono rounded-sm min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
                data-testid="submit-suggestion-btn"
                className="bg-transparent border border-white/20 text-white font-mono uppercase tracking-widest px-6 h-10 rounded-sm hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CommunityPage;
