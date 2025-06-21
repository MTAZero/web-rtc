import React, { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  setCredentials,
  logout,
  selectIsAuthenticated,
  selectCurrentUser,
} from "../store/authSlice";
import api from "../utils/axios";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (token: string, userData: any) => void;
  logout: () => void;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  // Initialize auth state and fetch user data if token exists
  useEffect(() => {
    const initializeAuthState = async () => {
      const storedToken = localStorage.getItem('token');
      console.log('AuthProvider: Initializing with token:', storedToken ? 'exists' : 'not found');
      
      if (storedToken && !user) {
        try {
          // Fetch user data from API
          const response = await api.get('/auth/me');
          const userData = response.data;
          console.log('AuthProvider: Fetched user data:', userData);
          dispatch(setCredentials({ user: userData, token: storedToken }));
        } catch (error) {
          console.error('AuthProvider: Failed to fetch user data:', error);
          // Token might be invalid, clear it
          dispatch(logout());
        }
      }
    };

    initializeAuthState();
  }, [dispatch, user]);

  const handleLogin = (token: string, userData: any) => {
    console.log('AuthProvider: Login with user:', userData?.username);
    dispatch(setCredentials({ user: userData, token }));
    navigate("/");
  };

  const handleLogout = () => {
    console.log('AuthProvider: Logging out');
    dispatch(logout());
    navigate("/login");
  };

  const handleRegister = async (userData: any) => {
    const response = await api.post("/auth/register", userData);
    const { access_token, user } = response.data;
    handleLogin(access_token, user);
  };

  const value = {
    isAuthenticated,
    user,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
