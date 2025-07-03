import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  IconButton,
  Alert,
  Snackbar,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  AppBar,
  Toolbar,
  Container,
  Divider,
} from "@mui/material";
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  CallEnd,
  VideoCall as VideoCallIcon,
  ArrowBack,
  Wifi,
  WifiOff,
  Group,
} from "@mui/icons-material";
import { io, Socket } from "socket.io-client";

const VideoCall: React.FC = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [readyReceived, setReadyReceived] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef<string>("");
  const isInitiatorRef = useRef<boolean>(false);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        try {
          await localVideoRef.current.play();
        } catch (err) {
          console.error("Error playing local video:", err);
        }
      }

      // Add tracks to peer connection if it exists
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          if (peerConnectionRef.current) {
            peerConnectionRef.current.addTrack(track, stream);
          }
        });
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
      let errorMessage = "Không thể truy cập camera/microphone. ";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage += "Vui lòng cho phép truy cập camera và microphone.";
        } else if (err.name === "NotFoundError") {
          errorMessage += "Không tìm thấy camera hoặc microphone.";
        } else if (err.name === "NotReadableError") {
          errorMessage +=
            "Camera hoặc microphone đang được sử dụng bởi ứng dụng khác.";
        }
      }
      setError(errorMessage);
    }
  };

  const createPeerConnection = () => {
    console.log(
      "Creating peer connection, isInitiator:",
      isInitiatorRef.current
    );
    const pc = new RTCPeerConnection({
      iceServers: [
        // STUN servers
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },

        // ExpressTurn TURN servers (comprehensive list)
        {
          urls: [
            "turn:relay1.expressturn.com:80",
            "turn:relay1.expressturn.com:443",
            "turn:relay1.expressturn.com:3478",
            "turn:relay2.expressturn.com:3478",
            "turn:relay3.expressturn.com:3478",
            "turn:relay4.expressturn.com:3478",
            "turn:relay5.expressturn.com:3478",
            "turn:relay6.expressturn.com:3478",
            "turn:relay7.expressturn.com:3478",
            "turn:relay8.expressturn.com:3478",
            "turn:relay9.expressturn.com:3478",
            "turn:relay10.expressturn.com:3478",
            "turn:relay11.expressturn.com:3478",
            "turn:relay12.expressturn.com:3478",
            "turn:relay13.expressturn.com:3478",
            "turn:relay14.expressturn.com:3478",
            "turn:relay15.expressturn.com:3478",
            "turn:relay16.expressturn.com:3478",
            "turn:relay17.expressturn.com:3478",
            "turn:global.expressturn.com:3478",
          ],
          username: "000000002066834392",
          credential: "k78IYXzTuscOW57aYgAv+GstxSo=",
        },
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
      iceTransportPolicy: "all",
    });

    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        console.log("Candidate type:", event.candidate.type);
        console.log("Candidate protocol:", event.candidate.protocol);
        console.log("Candidate address:", event.candidate.address);
        console.log("Candidate port:", event.candidate.port);

        // Log relay candidates specifically
        if (event.candidate.type === "relay") {
          console.log("🎉 RELAY CANDIDATE FOUND:", event.candidate);
        }

        socket?.emit("candidate", {
          candidate: event.candidate,
          roomId: roomIdRef.current,
        });
      } else {
        console.log("🎉 ICE gathering completed - no more candidates");
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected") {
        console.log("🎉 ICE connection established!");
        setIsPeerConnected(true);
      } else if (pc.iceConnectionState === "checking") {
        console.log("ICE connection checking...");
      } else if (pc.iceConnectionState === "disconnected") {
        console.log("❌ ICE connection disconnected");
        setIsPeerConnected(false);
      } else if (pc.iceConnectionState === "failed") {
        console.error("❌ ICE connection failed");
        setError("Kết nối ICE thất bại. Vui lòng thử lại.");
        setIsPeerConnected(false);
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log("ICE gathering state:", pc.iceGatheringState);
      if (pc.iceGatheringState === "complete") {
        console.log("🎉 ICE gathering completed!");
      } else if (pc.iceGatheringState === "gathering") {
        console.log("ICE gathering in progress...");
      } else if (pc.iceGatheringState === "new") {
        console.log("ICE gathering starting...");
      }
    };

    pc.onicecandidateerror = (event) => {
      console.error("ICE candidate error:", {
        url: event.url,
        errorCode: event.errorCode,
        errorText: event.errorText,
        address: event.address,
        port: event.port,
      });
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        console.log("Peer connection established!");
        setIsPeerConnected(true);
      } else if (pc.connectionState === "failed") {
        console.error("Peer connection failed");
        setError("Kết nối peer thất bại. Vui lòng thử lại.");
        setIsPeerConnected(false);
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote track:", event);
      console.log("Remote streams:", event.streams);
      console.log("Remote track:", event.track);

      if (event.streams && event.streams[0]) {
        console.log("Setting remote stream to peer video");
        if (peerVideoRef.current) {
          peerVideoRef.current.srcObject = event.streams[0];
          peerVideoRef.current.play().catch((err) => {
            console.error("Error playing peer video:", err);
          });
        }
      } else {
        console.warn("No remote streams in track event");
      }
    };

    // Add local tracks to peer connection
    if (streamRef.current) {
      console.log("Adding local tracks to peer connection");
      streamRef.current.getTracks().forEach((track) => {
        console.log("Adding track:", track.kind, track.id);
        pc.addTrack(track, streamRef.current!);
      });
    } else {
      console.warn("No local stream available when creating peer connection");
    }

    // Create and send offer if initiator
    if (isInitiatorRef.current) {
      console.log("Creating offer as initiator");
      pc.createOffer()
        .then((offer) => {
          console.log("Created offer:", offer);
          return pc.setLocalDescription(offer);
        })
        .then(() => {
          console.log(
            "Set local description, sending offer:",
            pc.localDescription
          );
          console.log("Emitting offer to room:", roomIdRef.current);
          console.log("Offer payload:", {
            offer: pc.localDescription,
            roomId: roomIdRef.current,
          });
          socket?.emit("offer", {
            offer: pc.localDescription,
            roomId: roomIdRef.current,
          });
          console.log("Offer emitted successfully");
        })
        .catch((err) => {
          console.error("Error creating offer:", err);
          setError("Có lỗi xảy ra khi tạo offer. Vui lòng thử lại.");
        });
    }
  };

  useEffect(() => {
    // Initialize socket connection
    const socket = io(`${window.location.origin}/webrtc`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socket);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsSocketConnected(true);
      setError(null);

      // Test connection
      socket.emit("test", "Hello from frontend");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      console.error("Error details:", {
        message: err.message,
        name: err.name,
      });
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
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
      setError("Có lỗi xảy ra với kết nối socket.");
    });

    socket.on("created", async () => {
      console.log("Room created, you are initiator");
      setIsInitiator(true);
      isInitiatorRef.current = true;
      await initializeMedia();
    });

    socket.on("joined", async () => {
      console.log("Room joined, you are not initiator");
      setIsInitiator(false);
      isInitiatorRef.current = false;
      await initializeMedia();
      console.log("Sending ready signal to room:", roomIdRef.current);
      socket?.emit("ready", { roomId: roomIdRef.current });
    });

    socket.on("full", () => {
      console.log("Room is full");
      setError("Phòng đã đầy.");
    });

    socket.on("ready", () => {
      console.log(
        "Peer is ready, creating peer connection, isInitiator:",
        isInitiatorRef.current
      );
      console.log("Current roomId:", roomIdRef.current);
      console.log("Socket ID:", socket.id);
      if (isInitiatorRef.current) {
        console.log("Initiator received ready, setting readyReceived flag");
        setReadyReceived(true);
      } else {
        console.log(
          "Non-initiator received ready signal, but should not create peer connection yet"
        );
      }
    });

    socket.on("offer", (offer: RTCSessionDescriptionInit) => {
      console.log("Received offer:", offer);
      console.log("Current isInitiator:", isInitiatorRef.current);
      console.log("Socket ID:", socket.id);
      if (!isInitiatorRef.current) {
        console.log("Non-initiator handling offer - creating peer connection");
        createPeerConnection();
        console.log("Peer connection created, setting remote description");
        peerConnectionRef.current
          ?.setRemoteDescription(new RTCSessionDescription(offer))
          .then(() => {
            console.log("Set remote description, creating answer");
            return peerConnectionRef.current?.createAnswer();
          })
          .then((answer) => {
            console.log("Created answer:", answer);
            return peerConnectionRef.current?.setLocalDescription(answer);
          })
          .then(() => {
            console.log(
              "Set local description, sending answer:",
              peerConnectionRef.current?.localDescription
            );
            socket?.emit("answer", {
              answer: peerConnectionRef.current?.localDescription,
              roomId: roomIdRef.current,
            });
          })
          .catch((err) => {
            console.error("Error handling offer:", err);
            setError("Có lỗi xảy ra khi xử lý offer. Vui lòng thử lại.");
          });
      } else {
        console.log("Initiator received offer, ignoring");
      }
    });

    socket.on("answer", (answer: RTCSessionDescriptionInit) => {
      console.log("Received answer:", answer);
      if (isInitiatorRef.current && peerConnectionRef.current) {
        console.log("Initiator setting remote description from answer");
        peerConnectionRef.current
          .setRemoteDescription(new RTCSessionDescription(answer))
          .then(() => {
            console.log("Successfully set remote description from answer");
          })
          .catch((err) => {
            console.error("Error setting remote description:", err);
            setError("Có lỗi xảy ra khi xử lý answer. Vui lòng thử lại.");
          });
      }
    });

    socket.on("candidate", (candidate: RTCIceCandidateInit) => {
      console.log("Received ICE candidate:", candidate);
      if (peerConnectionRef.current) {
        const iceCandidate = new RTCIceCandidate(candidate);
        peerConnectionRef.current.addIceCandidate(iceCandidate).catch((err) => {
          console.error("Error adding ICE candidate:", err);
        });
      }
    });

    socket.on("user-left", () => {
      console.log("User left");
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (peerVideoRef.current) {
        peerVideoRef.current.srcObject = null;
      }
      setError("Người dùng khác đã rời khỏi cuộc gọi.");
    });

    socket.on("test-response", (response) => {
      console.log("Test response:", response);
    });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      socket.disconnect();
    };
  }, []);

  // Update roomIdRef when roomId state changes
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // Create peer connection when initiator is ready and received ready signal
  useEffect(() => {
    if (isInitiator && readyReceived && isInCall) {
      console.log(
        "Initiator ready and received ready signal, creating peer connection"
      );
      createPeerConnection();
      setReadyReceived(false); // Reset flag
    }
  }, [isInitiator, readyReceived, isInCall]);

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setError("Vui lòng nhập tên phòng");
      return;
    }

    if (!socket || !isSocketConnected) {
      console.error("Socket not connected:", {
        socket: !!socket,
        isSocketConnected,
      });
      setError("Socket chưa kết nối. Vui lòng thử lại.");
      return;
    }

    roomIdRef.current = roomId;
    console.log("Joining room:", roomId);
    console.log("Socket state:", {
      connected: socket.connected,
      id: socket.id,
      isSocketConnected,
    });

    try {
      socket.emit("join-room", roomId);
      console.log("Emitted join-room event");
      setIsInCall(true);
    } catch (error) {
      console.error("Error emitting join-room:", error);
      setError("Có lỗi khi tham gia phòng. Vui lòng thử lại.");
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setIsInCall(false);
    setRoomId("");
    navigate("/");
  };

  if (!isInCall) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        {/* Header */}
        <AppBar
          position="static"
          sx={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
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
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              <VideoCallIcon sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                Video Call
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                icon={isSocketConnected ? <Wifi /> : <WifiOff />}
                label={isSocketConnected ? "Đã kết nối" : "Đang kết nối..."}
                color={isSocketConnected ? "success" : "warning"}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
          <Card
            sx={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              overflow: "visible",
            }}
          >
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "linear-gradient(45deg, #667eea, #764ba2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 3,
                  boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
                }}
              >
                <VideoCallIcon sx={{ fontSize: 40, color: "white" }} />
              </Box>

              <Typography
                variant="h4"
                sx={{ fontWeight: 700, mb: 1, color: "#1a237e" }}
              >
                Tham gia cuộc gọi
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Nhập tên phòng để bắt đầu cuộc gọi video với bạn bè
              </Typography>

              <TextField
                fullWidth
                label="Tên phòng"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Ví dụ: phong-hop-1"
                variant="outlined"
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "#667eea",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#667eea",
                    },
                  },
                }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleJoinRoom}
                disabled={!isSocketConnected || !roomId.trim()}
                startIcon={<Group />}
                sx={{
                  background: "linear-gradient(45deg, #667eea, #764ba2)",
                  borderRadius: 2,
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #5a6fd8, #6a4190)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 40px rgba(102, 126, 234, 0.4)",
                  },
                  "&:disabled": {
                    background: "rgba(0, 0, 0, 0.12)",
                    color: "rgba(0, 0, 0, 0.38)",
                    transform: "none",
                    boxShadow: "none",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {!isSocketConnected ? "Đang kết nối..." : "Tham gia phòng"}
              </Button>

              {isInCall && !isInitiator && (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    console.log(
                      "Manual ready emit to room:",
                      roomIdRef.current
                    );
                    socket?.emit("ready", { roomId: roomIdRef.current });
                  }}
                  sx={{
                    mt: 2,
                    borderColor: "rgba(102, 126, 234, 0.3)",
                    color: "#667eea",
                    borderRadius: 2,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "#667eea",
                      background: "rgba(102, 126, 234, 0.05)",
                    },
                  }}
                >
                  Test Ready Signal
                </Button>
              )}

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  hoặc
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => setRoomId(`room-${Date.now()}`)}
                sx={{
                  borderColor: "rgba(102, 126, 234, 0.3)",
                  color: "#667eea",
                  borderRadius: 2,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#667eea",
                    background: "rgba(102, 126, 234, 0.05)",
                  },
                }}
              >
                Tạo phòng mới
              </Button>
            </CardContent>
          </Card>
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
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* Main Video */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "0",
        }}
      />

      {/* Peer Video */}
      <video
        ref={peerVideoRef}
        autoPlay
        playsInline
        style={{
          position: "absolute",
          width: "280px",
          height: "210px",
          right: "20px",
          top: "20px",
          objectFit: "cover",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          border: "3px solid rgba(255, 255, 255, 0.8)",
          background: "rgba(0, 0, 0, 0.1)",
        }}
      />

      {/* Connection Status */}
      <Box
        sx={{
          position: "absolute",
          top: "20px",
          left: "20px",
          display: "flex",
          gap: 1,
        }}
      >
        <Chip
          icon={isSocketConnected ? <Wifi /> : <WifiOff />}
          label={isSocketConnected ? "Đã kết nối" : "Mất kết nối"}
          color={isSocketConnected ? "success" : "error"}
          size="small"
          sx={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            fontWeight: 600,
          }}
        />
        {isPeerConnected && (
          <Chip
            icon={<VideoCallIcon />}
            label="Đã kết nối peer"
            color="success"
            size="small"
            sx={{
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      {/* Room Info */}
      <Box
        sx={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          padding: "8px 16px",
          borderRadius: "20px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a237e" }}>
          Phòng: {roomId}
        </Typography>
      </Box>

      {/* Control Buttons */}
      <Box
        sx={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 3,
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(20px)",
          padding: "16px 24px",
          borderRadius: "50px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <IconButton
          onClick={toggleMute}
          sx={{
            color: "white",
            background: isMuted
              ? "rgba(244, 67, 54, 0.8)"
              : "rgba(255, 255, 255, 0.2)",
            width: 56,
            height: 56,
            "&:hover": {
              background: isMuted
                ? "rgba(244, 67, 54, 1)"
                : "rgba(255, 255, 255, 0.3)",
              transform: "scale(1.1)",
            },
            transition: "all 0.3s ease",
          }}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </IconButton>

        <IconButton
          onClick={toggleVideo}
          sx={{
            color: "white",
            background: isVideoOff
              ? "rgba(244, 67, 54, 0.8)"
              : "rgba(255, 255, 255, 0.2)",
            width: 56,
            height: 56,
            "&:hover": {
              background: isVideoOff
                ? "rgba(244, 67, 54, 1)"
                : "rgba(255, 255, 255, 0.3)",
              transform: "scale(1.1)",
            },
            transition: "all 0.3s ease",
          }}
        >
          {isVideoOff ? <VideocamOff /> : <Videocam />}
        </IconButton>

        <IconButton
          onClick={handleEndCall}
          sx={{
            color: "white",
            background: "linear-gradient(45deg, #ff4444, #cc0000)",
            width: 64,
            height: 64,
            "&:hover": {
              background: "linear-gradient(45deg, #cc0000, #990000)",
              transform: "scale(1.1)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <CallEnd sx={{ fontSize: 28 }} />
        </IconButton>
      </Box>

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

export default VideoCall;
