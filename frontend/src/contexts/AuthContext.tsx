import React, { createContext, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  setCredentials,
  logout,
  selectIsAuthenticated,
  selectCurrentUser,
} from "../store/authSlice";
import axios from "axios";

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

  const handleLogin = (token: string, userData: any) => {
    dispatch(setCredentials({ user: userData, token }));
    navigate("/");
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleRegister = async (userData: any) => {
    try {
      const response = await axios.post("/api/auth/register", userData);
      const { token, user } = response.data;
      handleLogin(token, user);
    } catch (error) {
      throw error;
    }
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
