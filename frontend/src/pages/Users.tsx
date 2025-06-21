import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { 
  ArrowBack, 
  Add, 
  Edit, 
  Delete, 
  PersonAdd,
  Refresh,
  AdminPanelSettings,
  Person,
  Email,
  Security,
  Group,
  VerifiedUser,
} from '@mui/icons-material';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';

interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt?: string;
  __v?: number;
}

const Users: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    isAdmin: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/users');
      console.log('Users response:', response.data); // Debug log
      // Ensure all users have required properties
      const validUsers = response.data.filter((user: Partial<User>) => 
        user && user._id && user.username && user.email !== undefined
      ) as User[];
      console.log('Valid users:', validUsers); // Debug log
      setUsers(validUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        isAdmin: user.isAdmin,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        isAdmin: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      isAdmin: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser._id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Không thể lưu người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      setLoading(true);
      try {
        await api.delete(`/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Không thể xóa người dùng');
      } finally {
        setLoading(false);
      }
    }
  };

  const adminUsers = users.filter(u => u.isAdmin);
  const regularUsers = users.filter(u => !u.isAdmin);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pb: 4
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
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ 
              mr: 2,
              background: 'rgba(255, 255, 255, 0.1)',
              '&:hover': { background: 'rgba(255, 255, 255, 0.2)' }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <AdminPanelSettings sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Quản lý người dùng
            </Typography>
          </Box>
          {user?.isAdmin && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Làm mới danh sách">
                <IconButton
                  color="inherit"
                  onClick={fetchUsers}
                  disabled={loading}
                  sx={{ 
                    background: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': { background: 'rgba(255, 255, 255, 0.2)' }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button
                color="inherit"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                variant="outlined"
                sx={{ 
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': { 
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Thêm người dùng
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ 
            flex: 1, 
            minWidth: 250,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 2 
              }}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main', 
                  width: 56, 
                  height: 56,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)'
                }}>
                  <Group sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Tổng số người dùng
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {users.length}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: 1, 
            minWidth: 250,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 2 
              }}>
                <Avatar sx={{ 
                  bgcolor: 'success.main', 
                  width: 56, 
                  height: 56,
                  background: 'linear-gradient(45deg, #4caf50, #45a049)'
                }}>
                  <VerifiedUser sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Quản trị viên
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {adminUsers.length}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: 1, 
            minWidth: 250,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 2 
              }}>
                <Avatar sx={{ 
                  bgcolor: 'info.main', 
                  width: 56, 
                  height: 56,
                  background: 'linear-gradient(45deg, #2196f3, #1976d2)'
                }}>
                  <Person sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Người dùng thường
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                {regularUsers.length}
              </Typography>
              {user?.isAdmin && (
                <CardActions sx={{ justifyContent: 'center', pt: 2 }}>
                  <Button 
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => handleOpenDialog()}
                    sx={{
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      borderRadius: 2,
                      px: 3,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd8, #6a4190)'
                      }
                    }}
                  >
                    Thêm người dùng mới
                  </Button>
                </CardActions>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Users Table */}
        <Paper sx={{ 
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          {loading && (
            <Box sx={{ width: '100%' }}>
              <LinearProgress sx={{ height: 3 }} />
            </Box>
          )}
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Danh sách người dùng
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(0, 0, 0, 0.02)' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Người dùng</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Vai trò</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Ngày tạo</TableCell>
                  {user?.isAdmin && (
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                      Thao tác
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((userItem) => (
                  <TableRow 
                    key={userItem._id}
                    sx={{ 
                      '&:hover': { 
                        background: 'rgba(102, 126, 234, 0.05)',
                        transition: 'background 0.2s ease'
                      },
                      '&:nth-of-type(even)': { 
                        background: 'rgba(0, 0, 0, 0.01)' 
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: userItem.isAdmin ? 'success.main' : 'primary.main',
                          background: userItem.isAdmin 
                            ? 'linear-gradient(45deg, #4caf50, #45a049)'
                            : 'linear-gradient(45deg, #667eea, #764ba2)'
                        }}>
                          {userItem.username?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {userItem.username || 'Unknown User'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            ID: {userItem._id ? userItem._id.slice(-8) : 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography>{userItem.email || 'No email'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={userItem.isAdmin ? <AdminPanelSettings /> : <Person />}
                        label={userItem.isAdmin ? 'Quản trị viên' : 'Người dùng'}
                        color={userItem.isAdmin ? 'success' : 'default'}
                        variant={userItem.isAdmin ? 'filled' : 'outlined'}
                        sx={{ 
                          fontWeight: 600,
                          '& .MuiChip-icon': { fontSize: 16 }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </Typography>
                    </TableCell>
                    {user?.isAdmin && (
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(userItem)}
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': { 
                                  background: 'rgba(102, 126, 234, 0.1)',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              onClick={() => userItem._id && handleDelete(userItem._id)}
                              sx={{ 
                                color: 'error.main',
                                '&:hover': { 
                                  background: 'rgba(244, 67, 54, 0.1)',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      {/* Floating Action Button */}
      {user?.isAdmin && (
        <Fab
          color="primary"
          aria-label="add user"
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24,
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.3s ease'
          }}
          onClick={() => handleOpenDialog()}
        >
          <Add />
        </Fab>
      )}

      {/* Add/Edit User Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 16px 64px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            {editingUser ? <Edit /> : <PersonAdd />}
            {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Tên người dùng"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required={!editingUser}
              fullWidth
              label="Mật khẩu"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              helperText={editingUser ? 'Để trống nếu không muốn thay đổi mật khẩu' : ''}
              sx={{ mb: 3 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAdmin}
                  onChange={(e) =>
                    setFormData({ ...formData, isAdmin: e.target.checked })
                  }
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4caf50',
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#4caf50',
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security sx={{ fontSize: 20 }} />
                  <Typography>Quyền quản trị viên</Typography>
                </Box>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={loading}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              px: 3,
              borderColor: 'rgba(0, 0, 0, 0.2)'
            }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            sx={{
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              borderRadius: 2,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8, #6a4190)'
              }
            }}
          >
            {editingUser ? 'Lưu' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users; 