import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('omr_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('omr_token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const res = await api.post('/auth/token', formData);
    localStorage.setItem('omr_token', res.data.access_token);
    setUser({
      id: res.data.user_id,
      username: res.data.username,
      full_name_ku: res.data.full_name_ku,
      role: res.data.role,
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('omr_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
