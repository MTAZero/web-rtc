# WebRTC Video Call App with Chat

Ứng dụng video call sử dụng WebRTC với chức năng chat message text theo room.

## Tính năng

### Video Call
- Video call 1-1 sử dụng WebRTC
- Tạo và tham gia phòng
- Bật/tắt microphone và camera
- Hiển thị trạng thái kết nối
- Responsive design

### Chat Message
- Chat text real-time trong phòng video call
- Hiển thị tin nhắn với timestamp và tên người gửi
- Badge hiển thị số tin nhắn chưa đọc
- UI chat panel có thể toggle ẩn/hiện
- Hỗ trợ gửi tin nhắn bằng Enter

## Cấu trúc dự án

```
web-rtc/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── webrtc/
│   │   │   ├── webrtc.gateway.ts    # WebSocket + WebRTC logic
│   │   │   └── webrtc.module.ts
│   │   ├── auth/                   # Authentication
│   │   ├── users/                  # User management
│   │   └── main.ts
│   └── package.json
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.tsx            # Chat component riêng biệt
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/
│   │   │   ├── VideoCall.tsx       # Video call + Chat integration
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   └── ...
│   └── package.json
└── README.md
```

## Cài đặt và chạy

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Cách sử dụng

### 1. **Video Call**
- Nhập tên phòng hoặc tạo phòng mới
- Click "Tham gia phòng"
- Sử dụng controls: bật/tắt microphone, camera, kết thúc cuộc gọi

### 2. **Chat Room (Màn hình riêng)**
- **Từ Home page**: Nhập tên phòng chat và click "Tham gia chat"
- **Từ Quick Actions**: Click nút "Chat" để vào phòng "general"
- **Truy cập trực tiếp**: URL `/chat/room-name`
- Hiển thị tên người dùng theo tài khoản đang đăng nhập
- Tin nhắn real-time với timestamp và avatar

### 3. **Tính năng Chat**
- **Real-time messaging**: Tin nhắn được gửi/nhận ngay lập tức
- **User identification**: Hiển thị tên và avatar người gửi
- **Date separators**: Phân chia tin nhắn theo ngày
- **Auto-scroll**: Tự động scroll xuống tin nhắn mới
- **Enter to send**: Gửi tin nhắn bằng Enter
- **Connection status**: Hiển thị trạng thái kết nối

## Công nghệ sử dụng

### Backend
- **NestJS** - Framework Node.js
- **Socket.IO** - Real-time communication
- **WebRTC** - Peer-to-peer video/audio
- **MongoDB** - Database
- **JWT** - Authentication

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Material-UI** - UI components
- **Socket.IO Client** - Real-time communication
- **WebRTC API** - Browser APIs

## API Events

### WebSocket Events (Socket.IO)

#### Video Call Events
- `join-room` - Tham gia phòng
- `ready` - Sẵn sàng kết nối WebRTC
- `offer` - Gửi offer WebRTC
- `answer` - Gửi answer WebRTC
- `candidate` - Gửi ICE candidate

#### Chat Events
- `send-message` - Gửi tin nhắn chat
- `message` - Nhận tin nhắn chat

### Chat Message Format
```typescript
interface ChatMessage {
  roomId: string;
  message: string;
  senderId: string;
  senderName?: string;
  timestamp: number;
}
```

## Tính năng nổi bật

### Chat Component
- **Tách biệt**: Component Chat riêng biệt, có thể tái sử dụng
- **Real-time**: Tin nhắn được gửi/nhận ngay lập tức
- **UI/UX**: Giao diện đẹp, responsive, dễ sử dụng
- **State Management**: Quản lý state độc lập
- **Auto-scroll**: Tự động scroll xuống tin nhắn mới nhất

### Video Call Integration
- **Seamless**: Chat hoạt động song song với video call
- **Room-based**: Chat theo room, chỉ users trong room mới nhận được
- **User-friendly**: Badge hiển thị tin nhắn chưa đọc

## Phát triển thêm

Có thể mở rộng thêm các tính năng:
- File sharing trong chat
- Emoji support
- Message history
- Typing indicators
- Read receipts
- Group video calls (>2 users) 