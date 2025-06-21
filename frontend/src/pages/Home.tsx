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
} from "@mui/material";
import { VideoCall, Logout } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" component="div">
          Video Call App
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
          <IconButton onClick={handleLogout} color="inherit">
            <Logout />
          </IconButton>
        </Box>
      </Box>

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
