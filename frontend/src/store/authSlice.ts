import { createSlice } from '@reduxjs/toolkit';

interface User {
  id: string;
  username: string;
  email: string;
  isAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Get token from localStorage
const getStoredToken = () => {
  const token = localStorage.getItem('token');
  console.log('Stored token:', token ? 'exists' : 'not found');
  return token;
};

const initialState: AuthState = {
  user: null,
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      console.log('Setting credentials:', { user: user?.username, token: token ? 'exists' : 'not found' });
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      console.log('Credentials set successfully');
    },
    logout: (state) => {
      console.log('Logging out user');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      console.log('User logged out successfully');
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('token');
      console.log('Initializing auth with token:', token ? 'exists' : 'not found');
      state.token = token;
      state.isAuthenticated = !!token;
      // Note: user data is not persisted, so it will be null on page refresh
      // You might want to fetch user data from API if token exists
    },
  },
});

export const { setCredentials, logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectToken = (state: { auth: AuthState }) => state.auth.token; 