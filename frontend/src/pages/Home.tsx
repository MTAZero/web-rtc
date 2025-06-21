import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  IconButton,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
} from "@mui/material";
import { VideoCall, Logout, People, Menu as MenuIcon } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Video Call App
          </Typography>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
              {user?.email}
            </Typography>
            
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleNavigate("/video-call")}>
                <VideoCall sx={{ mr: 1 }} />
                Video Call
              </MenuItem>
              {user?.isAdmin && (
                <MenuItem onClick={() => handleNavigate("/users")}>
                  <People sx={{ mr: 1 }} />
                  Quản lý người dùng
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Đăng xuất
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Grid container spacing={3}>
          <Box sx={{ width: "100%" }}>
            <Paper
              sx={{
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                bgcolor: "primary.main",
                color: "white",
                borderRadius: 2,
              }}
            >
              <Typography variant="h4" gutterBottom>
                Chào mừng đến với Video Call App
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Bắt đầu cuộc gọi video với bạn bè và đồng nghiệp của bạn
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<VideoCall />}
                onClick={() => navigate("/video-call")}
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: "grey.100",
                  },
                }}
              >
                Bắt đầu cuộc gọi
              </Button>
            </Paper>
          </Box>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
