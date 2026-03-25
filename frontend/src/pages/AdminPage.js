import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Shield, Users, Key, AlertOctagon, Check, X, 
  Ban, Clock, Plus, Copy, Trash2, Power, MessageSquare, Eye
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../components/ui/table';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger 
} from '../components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminPage = () => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [inviteRequests, setInviteRequests] = useState([]);
  const [inviteKeys, setInviteKeys] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [killswitchActive, setKillswitchActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [extendDays, setExtendDays] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      const [usersRes, requestsRes, keysRes, killswitchRes, suggestionsRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { headers }),
        axios.get(`${API}/admin/invite-requests`, { headers }),
        axios.get(`${API}/admin/invite-keys`, { headers }),
        axios.get(`${API}/admin/killswitch/status`, { headers }),
        axios.get(`${API}/admin/suggestions`, { headers })
      ]);
      
      setUsers(usersRes.data.users || []);
      setInviteRequests(requestsRes.data.requests || []);
      setInviteKeys(keysRes.data.keys || []);
      setKillswitchActive(killswitchRes.data.active);
      setSuggestions(suggestionsRes.data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId, isBanned) => {
    try {
      const token = getToken();
      const endpoint = isBanned ? 'unban' : 'ban';
      await axios.post(`${API}/admin/users/${userId}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(isBanned ? 'User unbanned' : 'User banned');
      fetchData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleExtend = async (userId) => {
    const days = parseInt(extendDays[userId] || 30);
    if (isNaN(days) || days <= 0) {
      toast.error('Invalid days');
      return;
    }
    
    try {
      const token = getToken();
      await axios.post(`${API}/admin/users/${userId}/extend`, { days }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Extended by ${days} days`);
      setExtendDays(prev => ({ ...prev, [userId]: '' }));
      fetchData();
    } catch (error) {
      toast.error('Failed to extend');
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API}/admin/invite-requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Approved! Key: ${res.data.invite_key}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const token = getToken();
      await axios.post(`${API}/admin/invite-requests/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Request rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const handleGenerateKey = async () => {
    try {
      const token = getToken();
      const res = await axios.post(`${API}/admin/invite-keys/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Generated: ${res.data.key}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to generate');
    }
  };

  const handleKillswitch = async (activate) => {
    try {
      const token = getToken();
      const endpoint = activate ? 'activate' : 'deactivate';
      await axios.post(`${API}/admin/killswitch/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(activate ? 'KILLSWITCH ACTIVATED' : 'Killswitch deactivated');
      setKillswitchActive(activate);
      fetchData();
    } catch (error) {
      toast.error('Killswitch action failed');
    }
  };

  const handleMarkSuggestionReviewed = async (suggestionId) => {
    try {
      const token = getToken();
      await axios.post(`${API}/admin/suggestions/${suggestionId}/review`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Marked as reviewed');
      fetchData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleDeleteSuggestion = async (suggestionId) => {
    try {
      const token = getToken();
      await axios.delete(`${API}/admin/suggestions/${suggestionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Suggestion deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="font-mono text-sm text-white/40 tracking-widest">LOADING...</div>
      </div>
    );
  }

  const newSuggestionsCount = suggestions.filter(s => s.status === 'new').length;

  return (
    <motion.div
      data-testid="admin-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white text-glow">
            ADMIN PANEL
          </h1>
          <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase mt-2">
            Judgement Hall
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-white/40" />
          <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Admin Access</span>
        </div>
      </motion.div>

      {/* Killswitch Section */}
      <motion.div variants={itemVariants}>
        <div className={`bg-black/40 backdrop-blur-xl border rounded-sm p-6 ${killswitchActive ? 'border-red-500/50' : 'border-white/10'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-sm ${killswitchActive ? 'bg-red-900/30' : 'bg-white/5'}`}>
                <AlertOctagon className={`h-6 w-6 ${killswitchActive ? 'text-red-400' : 'text-white/60'}`} />
              </div>
              <div>
                <p className="font-serif text-xl text-white">Global Killswitch</p>
                <p className="font-mono text-xs text-white/40 mt-1">
                  {killswitchActive ? 'ALL DRIVERS STOPPED' : 'System operational'}
                </p>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  data-testid="killswitch-btn"
                  className={`font-mono uppercase tracking-widest px-8 h-12 rounded-sm transition-all ${
                    killswitchActive 
                      ? 'bg-green-900/30 border border-green-500/50 text-green-400 hover:bg-green-900/50' 
                      : 'bg-red-900/30 border border-red-500/50 text-red-400 hover:bg-red-900/50'
                  }`}
                >
                  <Power className="h-4 w-4 mr-2" />
                  {killswitchActive ? 'Deactivate' : 'Activate'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-black border border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif text-xl text-white">
                    {killswitchActive ? 'Deactivate Killswitch?' : 'ACTIVATE KILLSWITCH?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-mono text-sm text-white/60">
                    {killswitchActive 
                      ? 'This will restore normal operation for all drivers.'
                      : 'This will immediately stop ALL active drivers across the network. Use only in emergencies.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-mono text-xs uppercase tracking-widest bg-transparent border border-white/20 text-white hover:bg-white/5">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleKillswitch(!killswitchActive)}
                    data-testid="killswitch-confirm-btn"
                    className={`font-mono text-xs uppercase tracking-widest ${
                      killswitchActive 
                        ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70' 
                        : 'bg-red-900/50 text-red-400 hover:bg-red-900/70'
                    }`}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-black/40 border border-white/10 rounded-sm p-1 flex-wrap h-auto">
            <TabsTrigger 
              value="users" 
              data-testid="users-tab"
              className="font-mono text-xs uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              data-testid="requests-tab"
              className="font-mono text-xs uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-sm"
            >
              <Clock className="h-4 w-4 mr-2" />
              Requests ({inviteRequests.filter(r => r.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger 
              value="keys" 
              data-testid="keys-tab"
              className="font-mono text-xs uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-sm"
            >
              <Key className="h-4 w-4 mr-2" />
              Invite Keys
            </TabsTrigger>
            <TabsTrigger 
              value="suggestions" 
              data-testid="suggestions-tab"
              className="font-mono text-xs uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-sm relative"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Suggestions
              {newSuggestionsCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-black text-[10px] rounded-sm">
                  {newSuggestionsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Email</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Status</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Days</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <TableCell className="font-mono text-sm text-white/80">
                        {user.email}
                        {user.is_admin && (
                          <span className="ml-2 px-2 py-0.5 bg-white/10 text-[10px] uppercase tracking-widest text-white/60 rounded-sm">
                            Admin
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono ${
                          user.is_banned 
                            ? 'bg-red-900/30 text-red-400' 
                            : 'bg-green-900/30 text-green-400'
                        }`}>
                          {user.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-white/60">
                        {user.subscription_days}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="30"
                              value={extendDays[user.id] || ''}
                              onChange={(e) => setExtendDays(prev => ({ ...prev, [user.id]: e.target.value }))}
                              className="w-16 h-8 bg-black border-white/20 text-white font-mono text-xs rounded-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleExtend(user.id)}
                              data-testid={`extend-btn-${user.id}`}
                              className="h-8 bg-transparent border border-white/20 text-white hover:bg-white/5 rounded-sm"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleBan(user.id, user.is_banned)}
                            data-testid={`ban-btn-${user.id}`}
                            className={`h-8 rounded-sm ${
                              user.is_banned 
                                ? 'bg-green-900/30 border border-green-500/30 text-green-400 hover:bg-green-900/50' 
                                : 'bg-red-900/30 border border-red-500/30 text-red-400 hover:bg-red-900/50'
                            }`}
                          >
                            <Ban className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="mt-6">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Email</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Reason</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Status</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inviteRequests.map((request) => (
                    <TableRow key={request.id} className="border-b border-white/5 hover:bg-white/5">
                      <TableCell className="font-mono text-sm text-white/80">
                        {request.email}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-white/40 max-w-xs truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono ${
                          request.status === 'approved' 
                            ? 'bg-green-900/30 text-green-400' 
                            : request.status === 'rejected'
                            ? 'bg-red-900/30 text-red-400'
                            : 'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {request.status}
                        </span>
                        {request.invite_key && (
                          <span className="ml-2 font-mono text-xs text-white/40">
                            {request.invite_key}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              data-testid={`approve-btn-${request.id}`}
                              className="h-8 bg-green-900/30 border border-green-500/30 text-green-400 hover:bg-green-900/50 rounded-sm"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRejectRequest(request.id)}
                              data-testid={`reject-btn-${request.id}`}
                              className="h-8 bg-red-900/30 border border-red-500/30 text-red-400 hover:bg-red-900/50 rounded-sm"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {inviteRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 font-mono text-sm text-white/40">
                        No invite requests
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Keys Tab */}
          <TabsContent value="keys" className="mt-6">
            <div className="mb-4 flex justify-end">
              <Button
                onClick={handleGenerateKey}
                data-testid="generate-key-btn"
                className="bg-white text-black font-mono uppercase tracking-widest px-6 h-10 rounded-sm hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Generate Key
              </Button>
            </div>
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Key</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Status</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Created</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inviteKeys.map((key) => (
                    <TableRow key={key.id} className="border-b border-white/5 hover:bg-white/5">
                      <TableCell className="font-mono text-sm text-white/80 tracking-wider">
                        {key.key}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono ${
                          key.used 
                            ? 'bg-white/10 text-white/40' 
                            : 'bg-green-900/30 text-green-400'
                        }`}>
                          {key.used ? 'Used' : 'Available'}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-white/40">
                        {new Date(key.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(key.key)}
                          data-testid={`copy-key-btn-${key.id}`}
                          className="h-8 bg-transparent border border-white/20 text-white hover:bg-white/5 rounded-sm"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="mt-6">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">User</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Suggestion</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Status</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40">Date</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-white/40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((suggestion) => (
                    <TableRow key={suggestion.id} className="border-b border-white/5 hover:bg-white/5">
                      <TableCell className="font-mono text-sm text-white/80">
                        {suggestion.user_email}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-white/60 max-w-md">
                        <div className="whitespace-pre-wrap break-words">
                          {suggestion.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono ${
                          suggestion.status === 'new' 
                            ? 'bg-yellow-900/30 text-yellow-400' 
                            : suggestion.status === 'reviewed'
                            ? 'bg-blue-900/30 text-blue-400'
                            : 'bg-green-900/30 text-green-400'
                        }`}>
                          {suggestion.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-white/40">
                        {new Date(suggestion.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {suggestion.status === 'new' && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkSuggestionReviewed(suggestion.id)}
                              data-testid={`review-suggestion-btn-${suggestion.id}`}
                              className="h-8 bg-blue-900/30 border border-blue-500/30 text-blue-400 hover:bg-blue-900/50 rounded-sm"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleDeleteSuggestion(suggestion.id)}
                            data-testid={`delete-suggestion-btn-${suggestion.id}`}
                            className="h-8 bg-red-900/30 border border-red-500/30 text-red-400 hover:bg-red-900/50 rounded-sm"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {suggestions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 font-mono text-sm text-white/40">
                        No suggestions yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default AdminPage;
