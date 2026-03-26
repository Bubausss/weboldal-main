import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = (process.env.REACT_APP_BACKEND_URL || "") + "/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ghost_token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('ghost_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('ghost_token', token);
    // Fetch full user data to get all fields including is_admin
    await fetchUser(token);
    return userData;
  };

  const register = async (email, password, invite_key) => {
    const response = await axios.post(`${API}/auth/register`, { email, password, invite_key });
    const { token, user: userData } = response.data;
    localStorage.setItem('ghost_token', token);
    // Fetch full user data to get all fields
    await fetchUser(token);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('ghost_token');
    setUser(null);
  };

  const getToken = () => localStorage.getItem('ghost_token');

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
