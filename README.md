# WebRTC Video Call Application

A real-time video call application built with WebRTC, NestJS, and React.

## Features

- User authentication (login/register)
- Admin user management
- Real-time video calls using WebRTC
- Modern UI with Material-UI
- Secure WebSocket communication

## Tech Stack

### Backend
- NestJS
- MongoDB
- WebSocket
- JWT Authentication

### Frontend
- React with TypeScript
- Vite
- Material-UI
- WebRTC
- Socket.IO Client

## Prerequisites

- Node.js (v18 or later)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web-rtc
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/web-rtc
JWT_SECRET=your-secret-key
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run start:dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Register a new account or log in with existing credentials
2. As an admin user, you can manage other users
3. Start a video call by clicking the "Start Video Call" button
4. Share the room ID with other users to join the call
5. Use the controls to mute/unmute audio, enable/disable video, or end the call

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 