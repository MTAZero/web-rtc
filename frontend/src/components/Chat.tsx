import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  TextField,
  Typography,
  Drawer,
  List,
  ListItem,
  Paper,
  InputAdornment,
  Badge,
} from "@mui/material";
import {
  Chat as ChatIcon,
  Send,
  Close,
} from "@mui/icons-material";
import { Socket } from "socket.io-client";

interface ChatMessage {
  roomId: string;
  message: string;
  senderId: string;
  senderName?: string;
  timestamp: number;
}

interface ChatProps {
  socket: Socket | null;
  roomId: string;
  userName: string;
}

const Chat: React.FC<ChatProps> = ({ socket, roomId, userName }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Chat message handlers
    const handleMessage = (message: ChatMessage) => {
      console.log("Received message:", message);
      setMessages(prev => [...prev, message]);
      
      // Increment unread count if chat is not open
      if (!isChatOpen) {
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket, isChatOpen]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !roomId || !socket.id) return;

    const messageData: ChatMessage = {
      roomId: roomId,
      message: newMessage.trim(),
      senderId: socket.id,
      senderName: userName,
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

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setUnreadCount(0);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Chat Button */}
      <IconButton
        onClick={toggleChat}
        sx={{
          position: "absolute",
          top: "20px",
          right: "20px",
          color: "white",
          background: 'rgba(255, 255, 255, 0.2)',
          width: 56,
          height: 56,
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.3)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <ChatIcon />
        </Badge>
      </IconButton>

      {/* Chat Panel */}
      <Drawer
        anchor="right"
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        PaperProps={{
          sx: {
            width: 350,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Chat Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Chat - {roomId}
              </Typography>
              <IconButton 
                onClick={() => setIsChatOpen(false)}
                sx={{ color: 'white' }}
              >
                <Close />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              {messages.length} tin nhắn
            </Typography>
          </Box>

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
                py: 4,
                color: 'text.secondary'
              }}>
                <ChatIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="body2">
                  Chưa có tin nhắn nào
                </Typography>
                <Typography variant="caption">
                  Bắt đầu trò chuyện với người khác
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderId === (socket?.id || '');
                  return (
                    <ListItem 
                      key={index} 
                      sx={{ 
                        p: 0, 
                        mb: 1,
                        flexDirection: 'column',
                        alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1.5,
                          maxWidth: '80%',
                          background: isOwnMessage 
                            ? 'linear-gradient(45deg, #667eea, #764ba2)' 
                            : 'white',
                          color: isOwnMessage ? 'white' : 'text.primary',
                          borderRadius: 2,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          wordBreak: 'break-word'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {message.senderName || `User ${message.senderId.slice(0, 8)}`}
                        </Typography>
                        <Typography variant="body1">
                          {message.message}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            opacity: 0.7,
                            display: 'block',
                            mt: 0.5
                          }}
                        >
                          {formatTime(message.timestamp)}
                        </Typography>
                      </Paper>
                    </ListItem>
                  );
                })}
                <div ref={messagesEndRef} />
              </List>
            )}
          </Box>

          {/* Message Input */}
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
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
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      sx={{
                        color: newMessage.trim() ? '#667eea' : 'rgba(0, 0, 0, 0.38)'
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
        </Box>
      </Drawer>
    </>
  );
};

export default Chat; 