import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  IconButton,
  TextField,
  Typography,
  AppBar,
  Toolbar,
  Container,
  Paper,
  List,
  ListItem,
  InputAdornment,
  Chip,
  Avatar,
  Divider,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Send,
  ArrowBack,
  Wifi,
  WifiOff,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

interface ChatMessage {
  roomId: string;
  message: string;
  senderId: string;
  senderName?: string;
  timestamp: number;
}

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomId) {
      setError("Không tìm thấy room ID");
      return;
    }

    // Initialize socket connection
    const socket = io(
      `${window.location.origin}/webrtc`,
      {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    setSocket(socket);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsSocketConnected(true);
      setError(null);

      // Join room
      socket.emit("join-room", roomId);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setIsSocketConnected(false);
      setError("Không thể kết nối đến server. Vui lòng thử lại sau.");
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected, reason:", reason);
      setIsSocketConnected(false);
      setError("Mất kết nối đến server. Đang thử kết nối lại...");
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      setIsSocketConnected(true);
      setError(null);
      
      // Rejoin room after reconnection
      socket.emit("join-room", roomId);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
      setError("Có lỗi xảy ra với kết nối socket.");
    });

    // Chat message handlers
    const handleMessage = (message: ChatMessage) => {
      console.log("Received message:", message);
      setMessages(prev => [...prev, message]);
    };

    socket.on("message", handleMessage);

    socket.on("full", () => {
      console.log("Room is full");
      setError("Phòng đã đầy.");
    });

    return () => {
      socket.off("message", handleMessage);
      socket.disconnect();
    };
  }, [roomId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !roomId || !socket.id || !user) return;

    const messageData: ChatMessage = {
      roomId: roomId,
      message: newMessage.trim(),
      senderId: socket.id,
      senderName: user.username || user.email,
      timestamp: Date.now(),
    };

    socket.emit("send-message", messageData);
    setNewMessage("");
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          Vui lòng đăng nhập để sử dụng chat
        </Alert>
      </Box>
    );
  }

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
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <ChatIcon sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Chat Room
            </Typography>
            <Chip
              label={roomId}
              size="small"
              sx={{ ml: 2, background: 'rgba(255, 255, 255, 0.2)' }}
            />
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              icon={isSocketConnected ? <Wifi /> : <WifiOff />}
              label={isSocketConnected ? "Đã kết nối" : "Đang kết nối..."}
              color={isSocketConnected ? "success" : "warning"}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Avatar sx={{ ml: 1, width: 32, height: 32, bgcolor: '#667eea' }}>
              {getInitials(user.username || user.email)}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 2, mb: 2, height: 'calc(100vh - 120px)' }}>
        <Paper sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}>
          {/* Messages List */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 2,
            background: 'rgba(248, 249, 250, 0.8)'
          }}>
            {messages.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: 'text.secondary'
              }}>
                <ChatIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Chưa có tin nhắn nào
                </Typography>
                <Typography variant="body2">
                  Bắt đầu trò chuyện với người khác trong phòng
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderId === (socket?.id || '');
                  const showDate = index === 0 || 
                    formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
                  
                  return (
                    <React.Fragment key={index}>
                      {showDate && (
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                          <Chip
                            label={formatDate(message.timestamp)}
                            size="small"
                            sx={{ 
                              background: 'rgba(102, 126, 234, 0.1)',
                              color: '#667eea',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                      )}
                      <ListItem 
                        sx={{ 
                          p: 0, 
                          mb: 1,
                          flexDirection: 'column',
                          alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-end',
                          gap: 1,
                          maxWidth: '70%',
                          flexDirection: isOwnMessage ? 'row-reverse' : 'row'
                        }}>
                          {!isOwnMessage && (
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: '#667eea',
                                fontSize: '0.75rem'
                              }}
                            >
                              {getInitials(message.senderName || 'User')}
                            </Avatar>
                          )}
                          <Paper
                            sx={{
                              p: 1.5,
                              background: isOwnMessage 
                                ? 'linear-gradient(45deg, #667eea, #764ba2)' 
                                : 'white',
                              color: isOwnMessage ? 'white' : 'text.primary',
                              borderRadius: 2,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                              wordBreak: 'break-word',
                              maxWidth: '100%'
                            }}
                          >
                            {!isOwnMessage && (
                              <Typography variant="caption" sx={{ 
                                fontWeight: 600, 
                                display: 'block',
                                mb: 0.5,
                                color: '#667eea'
                              }}>
                                {message.senderName || `User ${message.senderId.slice(0, 8)}`}
                              </Typography>
                            )}
                            <Typography variant="body1">
                              {message.message}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                opacity: 0.7,
                                display: 'block',
                                mt: 0.5,
                                textAlign: isOwnMessage ? 'right' : 'left'
                              }}
                            >
                              {formatTime(message.timestamp)}
                            </Typography>
                          </Paper>
                        </Box>
                      </ListItem>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </List>
            )}
          </Box>

          <Divider />

          {/* Message Input */}
          <Box sx={{ 
            p: 2, 
            background: 'white'
          }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              variant="outlined"
              size="small"
              disabled={!isSocketConnected}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || !isSocketConnected}
                      sx={{
                        color: newMessage.trim() && isSocketConnected ? '#667eea' : 'rgba(0, 0, 0, 0.38)'
                      }}
                    >
                      <Send />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                }
              }}
            />
          </Box>
        </Paper>
      </Container>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Chat; 