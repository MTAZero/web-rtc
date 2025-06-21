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
  Paper,
} from "@mui/material";
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  CallEnd,
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
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" },
      ],
    });

    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        socket?.emit("candidate", {
          candidate: event.candidate,
          roomId: roomIdRef.current,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected") {
        console.log("ICE connection established!");
      } else if (pc.iceConnectionState === "failed") {
        console.error("ICE connection failed");
        setError("Kết nối ICE thất bại. Vui lòng thử lại.");
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        console.log("Peer connection established!");
      } else if (pc.connectionState === "failed") {
        console.error("Peer connection failed");
        setError("Kết nối peer thất bại. Vui lòng thử lại.");
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
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            maxWidth: 400,
            width: "100%",
            bgcolor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ color: "#1a237e" }}
          >
            Video Chat
          </Typography>
          <TextField
            fullWidth
            label="Tên phòng"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Nhập tên phòng"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "#667eea",
                },
              },
            }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleJoinRoom}
            disabled={!isSocketConnected}
            sx={{
              bgcolor: "#667eea",
              "&:hover": {
                bgcolor: "#764ba2",
              },
              py: 1.5,
              borderRadius: "8px",
            }}
          >
            Tham gia
          </Button>
          {isInCall && !isInitiator && (
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                console.log("Manual ready emit to room:", roomIdRef.current);
                socket?.emit("ready", { roomId: roomIdRef.current });
              }}
              sx={{
                borderColor: "#667eea",
                color: "#667eea",
                "&:hover": {
                  borderColor: "#764ba2",
                  color: "#764ba2",
                },
              }}
            >
              Test Ready Signal
            </Button>
          )}
        </Paper>
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
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "8px",
        }}
      />
      <video
        ref={peerVideoRef}
        autoPlay
        playsInline
        style={{
          position: "absolute",
          width: "200px",
          height: "150px",
          right: "20px",
          top: "10%",
          objectFit: "cover",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          border: "2px solid white",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 2,
          bgcolor: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          padding: 2,
          borderRadius: "50px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <IconButton
          onClick={toggleMute}
          sx={{
            color: "white",
            bgcolor: "rgba(255, 255, 255, 0.2)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.3)",
            },
          }}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </IconButton>
        <IconButton
          onClick={toggleVideo}
          sx={{
            color: "white",
            bgcolor: "rgba(255, 255, 255, 0.2)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.3)",
            },
          }}
        >
          {isVideoOff ? <VideocamOff /> : <Videocam />}
        </IconButton>
        <IconButton
          onClick={handleEndCall}
          sx={{
            color: "white",
            bgcolor: "#ff4444",
            "&:hover": {
              bgcolor: "#cc0000",
            },
          }}
        >
          <CallEnd />
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
