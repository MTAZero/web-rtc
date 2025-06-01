import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  CallEnd,
  People,
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

    const initializeMedia = async () => {
      try {
        // Kiểm tra xem trình duyệt có hỗ trợ getUserMedia không
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support media devices. Please try using Chrome, Firefox, or Edge.');
        }

        // Thử lấy stream với cấu hình đơn giản nhất
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        newSocket.emit('join-room', roomId);

        newSocket.on('user-joined', (userId: string) => {
          if (newSocket.id) {
            const peer = createPeer(userId, newSocket.id, stream);
            peersRef.current.push({
              peerId: userId,
              peer,
            });
            setPeers((users) => [...users, { peerId: userId, peer }]);
          }
        });

        newSocket.on('all-users', (users: string[]) => {
          const peers: PeerConnection[] = [];
          users.forEach((userId) => {
            if (newSocket.id) {
              const peer = createPeer(userId, newSocket.id, stream);
              peersRef.current.push({
                peerId: userId,
                peer,
              });
              peers.push({ peerId: userId, peer });
            }
          });
          setPeers(peers);
        });

        newSocket.on('user-left', (userId: string) => {
          const peerObj = peersRef.current.find((p) => p.peerId === userId);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          const peers = peersRef.current.filter((p) => p.peerId !== userId);
          peersRef.current = peers;
          setPeers(peers);
        });

        newSocket.on('offer', handleReceiveCall);
        newSocket.on('answer', handleAnswer);
        newSocket.on('ice-candidate', handleNewICECandidate);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('Please allow access to your camera and microphone in your browser settings');
          } else if (err.name === 'NotFoundError') {
            setError('No camera or microphone found. Please check your device connections');
          } else if (err.name === 'NotReadableError') {
            setError('Your camera or microphone is already in use by another application');
          } else if (err.name === 'OverconstrainedError') {
            setError('Your camera does not support the requested resolution. Please try a different camera');
          } else {
            setError('Error accessing camera and microphone: ' + err.message);
          }
        } else {
          setError('Unknown error accessing media devices');
        }
      }
    };

    initializeMedia();

    return () => {
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      newSocket.close();
    };
  }, []);

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
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Video Call
          </Typography>
          <Button color="inherit" onClick={() => navigate('/users')}>
            <People />
          </Button>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
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
                }}
              />
              {peers.map((peer, index) => (
                <video
                  key={peer.peerId}
                  autoPlay
                  playsInline
                  style={{
                    position: 'absolute',
                    width: '200px',
                    height: '150px',
                    objectFit: 'cover',
                    right: 20 + index * 220,
                    bottom: 20,
                    borderRadius: '8px',
                  }}
                />
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Controls
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                <IconButton onClick={toggleMute} color={isMuted ? 'error' : 'primary'}>
                  {isMuted ? <MicOff /> : <Mic />}
                </IconButton>
                <IconButton onClick={toggleVideo} color={isVideoOff ? 'error' : 'primary'}>
                  {isVideoOff ? <VideocamOff /> : <Videocam />}
                </IconButton>
                <IconButton onClick={handleEndCall} color="error">
                  <CallEnd />
                </IconButton>
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
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VideoCall; 