import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  TextField,
} from "@mui/material";
import { 
  VideoCall, 
  Logout, 
  People, 
  AdminPanelSettings,
  Home as HomeIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [chatRoomId, setChatRoomId] = React.useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleJoinChat = () => {
    if (!chatRoomId.trim()) {
      alert("Vui lòng nhập tên phòng chat");
      return;
    }
    navigate(`/chat/${chatRoomId.trim()}`);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      {/* Header */}
      <AppBar 
        position="static" 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <HomeIcon sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Video Call App
            </Typography>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ 
                width: 32, 
                height: 32,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                fontSize: '0.875rem'
              }}>
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="body2" color="inherit" sx={{ fontWeight: 600 }}>
                  {user?.username || 'User'}
                </Typography>
                <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
                  {user?.email}
                </Typography>
              </Box>
            </Box>
            
            {user?.isAdmin && (
              <Chip
                icon={<AdminPanelSettings />}
                label="Admin"
                color="success"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
            
            <IconButton
              color="inherit"
              onClick={handleLogout}
              sx={{ 
                background: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { background: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700, 
              color: 'white',
              mb: 2,
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            Chào mừng trở lại!
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 4,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            Bắt đầu cuộc gọi video với bạn bè và đồng nghiệp của bạn, hoặc quản lý hệ thống
          </Typography>
        </Box>

        {/* Main Action Cards */}
        <Box sx={{ display: 'flex', gap: 4, mb: 6, flexWrap: 'wrap' }}>
          {/* Video Call Card */}
          <Card sx={{ 
            flex: 1,
            minWidth: 300,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-8px)' }
          }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                }}
              >
                <VideoCall sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Video Call
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Bắt đầu cuộc gọi video với chất lượng cao. Kết nối với bạn bè và đồng nghiệp một cách dễ dàng.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<VideoCall />}
                onClick={() => navigate("/video-call")}
                sx={{
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Bắt đầu cuộc gọi
              </Button>
            </CardContent>
          </Card>

          {/* Chat Card */}
          <Card sx={{ 
            flex: 1,
            minWidth: 300,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-8px)' }
          }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(255, 152, 0, 0.3)',
                }}
              >
                <ChatIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Chat Room
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Tham gia phòng chat để trò chuyện với bạn bè và đồng nghiệp. Hỗ trợ tin nhắn real-time.
              </Typography>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Tên phòng chat"
                  value={chatRoomId}
                  onChange={(e) => setChatRoomId(e.target.value)}
                  placeholder="Ví dụ: general, team-1"
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#ff9800',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ff9800',
                      },
                    },
                  }}
                />
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<ChatIcon />}
                onClick={handleJoinChat}
                disabled={!chatRoomId.trim()}
                sx={{
                  background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 8px 32px rgba(255, 152, 0, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #f57c00, #ef6c00)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(255, 152, 0, 0.4)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.38)',
                    transform: 'none',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Tham gia chat
              </Button>
            </CardContent>
          </Card>

          {/* User Management Card (Admin Only) */}
          {user?.isAdmin && (
            <Card sx={{ 
              flex: 1,
              minWidth: 300,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-8px)' }
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #4caf50, #45a049)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                  }}
                >
                  <People sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                  Quản lý người dùng
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Quản lý tài khoản người dùng, phân quyền và theo dõi hoạt động của hệ thống.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<People />}
                  onClick={() => navigate("/users")}
                  sx={{
                    background: 'linear-gradient(45deg, #4caf50, #45a049)',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #45a049, #3d8b40)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Quản lý người dùng
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Quick Actions */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600, 
              color: 'white',
              mb: 3
            }}
          >
            Thao tác nhanh
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<VideoCall />}
              onClick={() => navigate("/video-call")}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Video Call
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ChatIcon />}
              onClick={() => navigate("/chat/general")}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Chat
            </Button>
            
            {user?.isAdmin && (
              <Button
                variant="outlined"
                startIcon={<People />}
                onClick={() => navigate("/users")}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'white',
                    background: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Quản lý người dùng
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Đăng xuất
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
