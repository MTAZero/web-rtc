import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Alert,
  Snackbar,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  CallEnd,
  ArrowBack,
  ScreenShare,
  StopScreenShare,
} from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PeerConnection {
  peerId: string;
  peer: Peer.Instance;
}

const VideoCall: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [roomId] = useState('main-room');
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<PeerConnection[]>([]);

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        newSocket.emit('join-room', roomId);

        newSocket.on('all-users', (users: string[]) => {
          const peers: PeerConnection[] = [];
          users.forEach((userID) => {
            const peer = createPeer(userID, newSocket.id, stream);
            peersRef.current.push({
              peerId: userID,
              peer,
            });
            peers.push({
              peerId: userID,
              peer,
            });
          });
          setPeers(peers);
        });

        newSocket.on('user-joined', (payload: { signal: any; callerID: string }) => {
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({
            peerId: payload.callerID,
            peer,
          });

          const peerObj = {
            peerId: payload.callerID,
            peer,
          };

          setPeers((users) => [...users, peerObj]);
        });

        newSocket.on('receiving-returned-signal', (payload: { id: string; signal: any }) => {
          const item = peersRef.current.find((p) => p.peerId === payload.id);
          item?.peer.signal(payload.signal);
        });
      })
      .catch((error) => {
        setError('Không thể truy cập camera và microphone');
        console.error('Error accessing media devices:', error);
      });

    return () => {
      newSocket.disconnect();
      peersRef.current.forEach(({ peer }) => {
        peer.destroy();
      });
    };
  }, [roomId]);

  const createPeer = (userToSignal: string, callerId: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket?.emit('offer', {
        target: userToSignal,
        offer: signal,
      });
    });

    return peer;
  };

  const handleReceiveCall = (incoming: { from: string; offer: Peer.SignalData }) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: localVideoRef.current?.srcObject as MediaStream,
    });

    peer.on('signal', (signal) => {
      socket?.emit('answer', {
        target: incoming.from,
        answer: signal,
      });
    });

    peer.signal(incoming.offer);

    peersRef.current.push({
      peerId: incoming.from,
      peer,
    });

    setPeers((users) => [...users, { peerId: incoming.from, peer }]);
  };

  const handleAnswer = (incoming: { from: string; answer: Peer.SignalData }) => {
    const item = peersRef.current.find((p) => p.peerId === incoming.from);
    item?.peer.signal(incoming.answer);
  };

  const handleNewICECandidate = (incoming: { from: string; candidate: Peer.SignalData }) => {
    const item = peersRef.current.find((p) => p.peerId === incoming.from);
    item?.peer.signal(incoming.candidate);
  };

  const toggleMute = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const handleEndCall = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    peers.forEach(({ peer }) => peer.destroy());
    socket?.close();
    navigate('/');
  };

  return (
    <Box 
      sx={{ 
        flexGrow: 1, 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: '#1a1a1a',
        color: 'white',
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <Tooltip title="Quay lại">
          <IconButton 
            onClick={() => navigate('/')}
            sx={{ 
              mr: 2,
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Cuộc gọi video
        </Typography>
      </Box>

      <Container 
        maxWidth="xl" 
        sx={{ 
          mt: 8,
          mb: 4, 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Grid container spacing={2} sx={{ height: '100%' }}>
          <Grid item xs={12} md={9}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 2,
                overflow: 'hidden',
                '&:hover': {
                  '& .controls-overlay': {
                    opacity: 1,
                  },
                },
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
              {peers.map((peer, index) => (
                <Fade in={true} key={peer.peerId}>
                  <Box
                    sx={{
                      position: 'absolute',
                      width: '160px',
                      height: '120px',
                      right: 20,
                      top: 20 + index * 140,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    <video
                      autoPlay
                      playsInline
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                </Fade>
              ))}
              <Box
                className="controls-overlay"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 2,
                  background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Tooltip title={isMuted ? "Bật mic" : "Tắt mic"}>
                    <IconButton 
                      onClick={toggleMute}
                      sx={{
                        bgcolor: isMuted ? 'error.main' : 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: isMuted ? 'error.dark' : 'rgba(255, 255, 255, 0.3)',
                        },
                      }}
                    >
                      {isMuted ? <MicOff /> : <Mic />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={isVideoOff ? "Bật camera" : "Tắt camera"}>
                    <IconButton 
                      onClick={toggleVideo}
                      sx={{
                        bgcolor: isVideoOff ? 'error.main' : 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: isVideoOff ? 'error.dark' : 'rgba(255, 255, 255, 0.3)',
                        },
                      }}
                    >
                      {isVideoOff ? <VideocamOff /> : <Videocam />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Kết thúc cuộc gọi">
                    <IconButton 
                      onClick={handleEndCall}
                      sx={{
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'error.dark',
                        },
                      }}
                    >
                      <CallEnd />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 2,
                color: 'white',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                Thông tin cuộc gọi
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Số người tham gia: {peers.length + 1}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
                  Trạng thái: Đang kết nối
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ 
            width: '100%',
            bgcolor: 'error.dark',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white',
            },
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VideoCall; 