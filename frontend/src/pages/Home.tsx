import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  AppBar,
  Toolbar,
} from '@mui/material';
import { VideoCall, People, ExitToApp } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Video Call App
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<ExitToApp />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.username}!
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/video-call')}
            >
              <VideoCall sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                Start Video Call
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center">
                Start a new video call with other users
              </Typography>
            </Paper>
          </Grid>

          {user?.isAdmin && (
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/users')}
              >
                <People sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Manage Users
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Add, edit, or remove users from the system
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home; 