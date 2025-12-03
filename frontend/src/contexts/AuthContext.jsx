import { createContext, useContext, useState, useEffect } from 'react';
import { getUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user state from backend on mount
  useEffect(() => {
    const hydrateUser = async () => {
      try {
        // Check for stored userId (NOT full user object!)
        const storedUserId = localStorage.getItem('userId');

        if (storedUserId) {
          // Fetch fresh user data from backend
          const response = await getUser(storedUserId);
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Failed to hydrate user:', error);
        // If fetch fails, auto-logout (clear invalid session)
        localStorage.removeItem('userId');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrateUser();
  }, []);

  const login = (userData) => {
    // Save ONLY userId to localStorage
    localStorage.setItem('userId', userData.id);
    // Set full user object to React state
    setUser(userData);
  };

  const logout = () => {
    // Clear userId from localStorage
    localStorage.removeItem('userId');
    // Reset state
    setUser(null);
  };

  const updateUser = (userData) => {
    // Update React state only (backend is source of truth)
    // DO NOT save to localStorage - we only store userId
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
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
