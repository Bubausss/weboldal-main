import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Settings, CloudUpload, Save, Eye, Crosshair, Zap, 
  ChevronDown, ChevronUp, Volume2, Circle, Minus, Keyboard,
  Radar, Target, Timer, Users
} from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Button } from '../components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const KEYBIND_OPTIONS = [
  'MOUSE4', 'MOUSE5', 'SHIFT', 'CTRL', 'ALT', 'CAPSLOCK'
];

const COLOR_PRESETS = [
  '#FF0000', '#8B0000', '#DC143C', '#FF6B6B',
  '#FF8800', '#FF4500', '#FFAA5C',
  '#FFFF00', '#FFD700', '#FFEB3B',
  '#00FF00', '#32CD32', '#228B22', '#50C878', '#008080',
  '#00FFFF', '#00CED1', '#40E0D0',
  '#0066FF', '#00BFFF', '#4169E1', '#000080', '#7DF9FF',
  '#800080', '#8B00FF', '#FF00FF', '#FF69B4', '#FF1493', '#E6E6FA',
  '#FFFFFF', '#C0C0C0', '#808080'
];

const ColorPicker = ({ value, onChange, testId }) => {
  return (
    <div className="flex flex-wrap gap-1">
      {COLOR_PRESETS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`w-5 h-5 rounded-sm border transition-colors ${
            value === color ? 'border-white' : 'border-transparent hover:border-white/30'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 rounded-sm cursor-pointer bg-transparent ml-1"
        data-testid={`${testId}-picker`}
      />
    </div>
  );
};

const ConfigPage = () => {
  const { getToken } = useAuth();
  const [config, setConfig] = useState({
    esp_enabled: false,
    esp_color: '#FF0000',
    esp_sound: false,
    esp_sound_color: '#FFFF00',
    esp_head_circle: false,
    esp_snap_line: false,
    rcs_enabled: false,
    rcs_strength: 50,
    triggerbot_enabled: false,
    triggerbot_delay: 100,
    triggerbot_key: 'MOUSE4',
    radar_enabled: false,
    radar_color: '#00FF00',
    grenade_prediction_enabled: false,
    grenade_prediction_color: '#FF8800',
    bomb_timer_enabled: false,
    bomb_timer_color: '#FF0000',
    spectator_list_enabled: false,
    spectator_list_color: '#FFFFFF'
  });
  
  // Local state for sliders to prevent lag
  const [localRcsStrength, setLocalRcsStrength] = useState(50);
  const [localTriggerbotDelay, setLocalTriggerbotDelay] = useState(100);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openModules, setOpenModules] = useState({});
  const [isBindingKey, setIsBindingKey] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data);
      setLocalRcsStrength(response.data.rcs_strength || 50);
      setLocalTriggerbotDelay(response.data.triggerbot_delay || 100);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const token = getToken();
      const saveData = {
        ...config,
        rcs_strength: localRcsStrength,
        triggerbot_delay: localTriggerbotDelay
      };
      await axios.put(`${API}/config`, saveData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(saveData);
      toast.success('Configuration saved');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = useCallback((key) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleColorChange = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleModule = useCallback((module) => {
    setOpenModules(prev => ({ ...prev, [module]: !prev[module] }));
  }, []);

  const handleKeyBind = useCallback(() => {
    setIsBindingKey(true);
    
    const handleKeyDown = (e) => {
      e.preventDefault();
      let key = e.key.toUpperCase();
      if (key === ' ') key = 'SPACE';
      if (key === 'CONTROL') key = 'CTRL';
      if (key === 'ESCAPE') {
        setIsBindingKey(false);
        document.removeEventListener('keydown', handleKeyDown);
        return;
      }
      setConfig(prev => ({ ...prev, triggerbot_key: key }));
      setIsBindingKey(false);
      document.removeEventListener('keydown', handleKeyDown);
      toast.success(`Key: ${key}`);
    };

    document.addEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      setIsBindingKey(false);
      document.removeEventListener('keydown', handleKeyDown);
    }, 5000);
  }, []);

  // Commit slider values to config on release
  const handleRcsCommit = useCallback(() => {
    setConfig(prev => ({ ...prev, rcs_strength: localRcsStrength }));
  }, [localRcsStrength]);

  const handleTriggerbotCommit = useCallback(() => {
    setConfig(prev => ({ ...prev, triggerbot_delay: localTriggerbotDelay }));
  }, [localTriggerbotDelay]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="font-mono text-sm text-white/40 tracking-widest">LOADING...</div>
      </div>
    );
  }

  return (
    <motion.div
      data-testid="config-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white text-glow">CONFIG</h1>
          <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase mt-2">Switchboard Control</p>
        </div>
        <Button
          onClick={saveConfig}
          disabled={saving}
          data-testid="cloud-sync-btn"
          className="bg-transparent border border-white/20 text-white font-mono uppercase tracking-widest px-6 h-10 rounded-sm hover:bg-white/5"
        >
          <CloudUpload className="h-4 w-4 mr-2" />
          {saving ? 'Syncing...' : 'Cloud Sync'}
        </Button>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        
        {/* ESP */}
        <div className="bg-black/40 border border-white/10 rounded-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-white/60" />
              <div>
                <p className="font-serif text-lg text-white">ESP</p>
                <p className="font-mono text-xs text-white/30">Extra Sensory Perception</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={config.esp_enabled} onCheckedChange={() => handleToggle('esp_enabled')} data-testid="esp-toggle" />
              <button onClick={() => toggleModule('esp')} className="p-1 hover:bg-white/5 rounded">
                {openModules.esp ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
              </button>
            </div>
          </div>
          {openModules.esp && (
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
              <div>
                <label className="font-mono text-xs text-white/40 uppercase mb-2 block">ESP Color</label>
                <ColorPicker value={config.esp_color} onChange={(v) => handleColorChange('esp_color', v)} testId="esp-color" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 rounded-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-white/60 flex items-center gap-2"><Volume2 className="h-3 w-3" />Sound ESP</span>
                    <Switch checked={config.esp_sound} onCheckedChange={() => handleToggle('esp_sound')} data-testid="esp-sound-toggle" />
                  </div>
                  {config.esp_sound && (
                    <div className="pt-2 border-t border-white/5">
                      <ColorPicker value={config.esp_sound_color} onChange={(v) => handleColorChange('esp_sound_color', v)} testId="esp-sound-color" />
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white/5 rounded-sm flex items-center justify-between">
                  <span className="font-mono text-xs text-white/60 flex items-center gap-2"><Circle className="h-3 w-3" />Head Circle</span>
                  <Switch checked={config.esp_head_circle} onCheckedChange={() => handleToggle('esp_head_circle')} data-testid="esp-head-circle-toggle" />
                </div>
                <div className="p-3 bg-white/5 rounded-sm flex items-center justify-between">
                  <span className="font-mono text-xs text-white/60 flex items-center gap-2"><Minus className="h-3 w-3" />Snap Line</span>
                  <Switch checked={config.esp_snap_line} onCheckedChange={() => handleToggle('esp_snap_line')} data-testid="esp-snap-line-toggle" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RCS */}
        <div className="bg-black/40 border border-white/10 rounded-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crosshair className="h-5 w-5 text-white/60" />
              <div>
                <p className="font-serif text-lg text-white">RCS</p>
                <p className="font-mono text-xs text-white/30">Recoil Control System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={config.rcs_enabled} onCheckedChange={() => handleToggle('rcs_enabled')} data-testid="rcs-toggle" />
              <button onClick={() => toggleModule('rcs')} className="p-1 hover:bg-white/5 rounded">
                {openModules.rcs ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
              </button>
            </div>
          </div>
          {openModules.rcs && (
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <label className="font-mono text-xs text-white/40 uppercase">Strength</label>
                <span className="font-mono text-lg text-white">{localRcsStrength}%</span>
              </div>
              <Slider
                value={[localRcsStrength]}
                onValueChange={(v) => setLocalRcsStrength(v[0])}
                onValueCommit={handleRcsCommit}
                min={0}
                max={100}
                step={5}
                data-testid="rcs-strength-slider"
              />
              <div className="flex justify-between mt-1 font-mono text-[10px] text-white/20">
                <span>WEAK</span><span>STRONG</span>
              </div>
            </div>
          )}
        </div>

        {/* Triggerbot */}
        <div className="bg-black/40 border border-white/10 rounded-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-white/60" />
              <div>
                <p className="font-serif text-lg text-white">Triggerbot</p>
                <p className="font-mono text-xs text-white/30">Auto Fire System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={config.triggerbot_enabled} onCheckedChange={() => handleToggle('triggerbot_enabled')} data-testid="triggerbot-toggle" />
              <button onClick={() => toggleModule('triggerbot')} className="p-1 hover:bg-white/5 rounded">
                {openModules.triggerbot ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
              </button>
            </div>
          </div>
          {openModules.triggerbot && (
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-mono text-xs text-white/40 uppercase">Delay</label>
                  <span className="font-mono text-lg text-white">{localTriggerbotDelay}ms</span>
                </div>
                <Slider
                  value={[localTriggerbotDelay]}
                  onValueChange={(v) => setLocalTriggerbotDelay(v[0])}
                  onValueCommit={handleTriggerbotCommit}
                  min={50}
                  max={500}
                  step={10}
                  data-testid="triggerbot-delay-slider"
                />
                <div className="flex justify-between mt-1 font-mono text-[10px] text-white/20">
                  <span>50MS</span><span>500MS</span>
                </div>
              </div>
              <div>
                <label className="font-mono text-xs text-white/40 uppercase mb-2 block">
                  <Keyboard className="h-3 w-3 inline mr-1" />Activation Key
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleKeyBind}
                    data-testid="triggerbot-keybind-btn"
                    className={`px-4 py-2 border rounded-sm font-mono text-sm ${isBindingKey ? 'border-yellow-500 text-yellow-400' : 'border-white/20 text-white hover:bg-white/5'}`}
                  >
                    {isBindingKey ? 'Press key...' : config.triggerbot_key}
                  </button>
                  {KEYBIND_OPTIONS.map((key) => (
                    <button
                      key={key}
                      onClick={() => setConfig(prev => ({ ...prev, triggerbot_key: key }))}
                      className={`px-2 py-1 border rounded-sm font-mono text-xs ${config.triggerbot_key === key ? 'border-white bg-white/10' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Radar */}
        <div className="bg-black/40 border border-white/10 rounded-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Radar className="h-5 w-5 text-white/60" />
              <div>
                <p className="font-serif text-lg text-white">Radar</p>
                <p className="font-mono text-xs text-white/30">Enemy Position Radar</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={config.radar_enabled} onCheckedChange={() => handleToggle('radar_enabled')} data-testid="radar-toggle" />
              <button onClick={() => toggleModule('radar')} className="p-1 hover:bg-white/5 rounded">
                {openModules.radar ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
              </button>
            </div>
          </div>
          {openModules.radar && (
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <label className="font-mono text-xs text-white/40 uppercase mb-2 block">Radar Color</label>
              <ColorPicker value={config.radar_color} onChange={(v) => handleColorChange('radar_color', v)} testId="radar-color" />
            </div>
          )}
        </div>

        {/* Grenade Prediction */}
        <div className="bg-black/40 border border-white/10 rounded-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-white/60" />
              <div>
                <p className="font-serif text-lg text-white">Grenade Prediction</p>
                <p className="font-mono text-xs text-white/30">Trajectory Prediction</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={config.grenade_prediction_enabled} onCheckedChange={() => handleToggle('grenade_prediction_enabled')} data-testid="grenade-toggle" />
              <button onClick={() => toggleModule('grenade')} className="p-1 hover:bg-white/5 rounded">
                {openModules.grenade ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
              </button>
            </div>
          </div>
          {openModules.grenade && (
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <label className="font-mono text-xs text-white/40 uppercase mb-2 block">Prediction Color</label>
              <ColorPicker value={config.grenade_prediction_color} onChange={(v) => handleColorChange('grenade_prediction_color', v)} testId="grenade-color" />
            </div>
          )}
        </div>

        {/* Bomb Timer */}
        <div className="bg-black/40 border border-white/10 rounded-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-white/60" />
              <div>
                <p className="font-serif text-lg text-white">Bomb Timer</p>
                <p className="font-mono text-xs text-white/30">C4 Countdown Display</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={config.bomb_timer_enabled} onCheckedChange={() => handleToggle('bomb_timer_enabled')} data-testid="bomb-toggle" />
              <button onClick={() => toggleModule('bomb')} className="p-1 hover:bg-white/5 rounded">
                {openModules.bomb ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
              </button>
            </div>
          </div>
          {openModules.bomb && (
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <label className="font-mono text-xs text-white/40 uppercase mb-2 block">Timer Color</label>
              <ColorPicker value={config.bomb_timer_color} onChange={(v) => handleColorChange('bomb_timer_color', v)} testId="bomb-color" />
            </div>
          )}
        </div>

        {/* Spectator List */}
        <div className="bg-black/40 border border-white/10 rounded-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-white/60" />
              <div>
                <p className="font-serif text-lg text-white">Spectator List</p>
                <p className="font-mono text-xs text-white/30">Who's Watching You</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={config.spectator_list_enabled} onCheckedChange={() => handleToggle('spectator_list_enabled')} data-testid="spectator-toggle" />
              <button onClick={() => toggleModule('spectator')} className="p-1 hover:bg-white/5 rounded">
                {openModules.spectator ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
              </button>
            </div>
          </div>
          {openModules.spectator && (
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <label className="font-mono text-xs text-white/40 uppercase mb-2 block">List Color</label>
              <ColorPicker value={config.spectator_list_color} onChange={(v) => handleColorChange('spectator_list_color', v)} testId="spectator-color" />
            </div>
          )}
        </div>

      </div>

      {/* Mobile Save */}
      <div className="md:hidden">
        <Button
          onClick={saveConfig}
          disabled={saving}
          data-testid="save-config-btn-mobile"
          className="w-full bg-white text-black font-mono uppercase tracking-widest h-12 rounded-sm hover:bg-gray-200"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </motion.div>
  );
};

export default ConfigPage;
