import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface ChatMessage {
  roomId: string;
  message: string;
  senderId: string;
  senderName?: string;
  timestamp: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'webrtc',
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('WebRTCGateway');
  private rooms: Map<string, Set<string>> = new Map();
  private userNames: Map<string, string> = new Map(); // Store user names by socket ID

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.log(`Client headers:`, client.handshake.headers);
    this.logger.log(`Client query:`, client.handshake.query);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove client from all rooms
    this.rooms.forEach((clients, roomId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        this.logger.log(`Removed client ${client.id} from room ${roomId}`);
        if (clients.size === 0) {
          this.rooms.delete(roomId);
          this.logger.log(`Room ${roomId} deleted (empty)`);
        } else {
          // Notify remaining clients
          client.to(roomId).emit('user-left');
          this.logger.log(`Notified remaining clients in room ${roomId}`);
        }
      }
    });
    
    // Remove user name
    this.userNames.delete(client.id);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, roomId: string) {
    this.logger.log(`Client ${client.id} joining room: ${roomId}`);
    this.logger.log(`Current rooms:`, Array.from(this.rooms.entries()));
    
    // Get or create room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      this.logger.log(`Created new room: ${roomId}`);
    }
    const room = this.rooms.get(roomId);
    this.logger.log(`Room ${roomId} has ${room.size} users before join`);
    this.logger.log(`Room ${roomId} clients:`, Array.from(room));

    // Check if room is full (max 2 users)
    if (room.size >= 2) {
      this.logger.log(`Room ${roomId} is full, rejecting client ${client.id}`);
      client.emit('full');
      return;
    }

    // Join room
    client.join(roomId);
    room.add(client.id);
    this.logger.log(`Client ${client.id} joined room ${roomId}, room now has ${room.size} users`);
    this.logger.log(`Room ${roomId} clients after join:`, Array.from(room));

    // Notify client about their role
    if (room.size === 1) {
      this.logger.log(`Client ${client.id} is initiator`);
      client.emit('created');
    } else {
      this.logger.log(`Client ${client.id} is not initiator`);
      client.emit('joined');
    }
  }

  @SubscribeMessage('ready')
  handleReady(client: Socket, payload: any) {
    this.logger.log(`Client ${client.id} is ready in room: ${payload.roomId}`);
    this.logger.log(`Broadcasting ready to room ${payload.roomId}`);
    this.logger.log(`Room ${payload.roomId} has clients:`, Array.from(this.rooms.get(payload.roomId) || []));
    
    // Get all clients in the room except the sender
    const room = this.rooms.get(payload.roomId);
    if (room) {
      const otherClients = Array.from(room).filter(id => id !== client.id);
      this.logger.log(`Broadcasting ready to other clients:`, otherClients);
    }
    
    client.to(payload.roomId).emit('ready');
    this.logger.log(`Ready event broadcasted to room ${payload.roomId}`);
  }

  @SubscribeMessage('offer')
  handleOffer(client: Socket, payload: any) {
    this.logger.log(`Received offer from client ${client.id} for room: ${payload.roomId}`);
    this.logger.log(`Room ${payload.roomId} has clients:`, Array.from(this.rooms.get(payload.roomId) || []));
    this.logger.log(`Broadcasting offer to room ${payload.roomId}`);
    
    // Get all clients in the room except the sender
    const room = this.rooms.get(payload.roomId);
    if (room) {
      const otherClients = Array.from(room).filter(id => id !== client.id);
      this.logger.log(`Broadcasting offer to other clients:`, otherClients);
    }
    
    client.to(payload.roomId).emit('offer', payload.offer);
    this.logger.log(`Offer broadcasted to room ${payload.roomId}`);
  }

  @SubscribeMessage('answer')
  handleAnswer(client: Socket, payload: any) {
    this.logger.log(`Client ${client.id} sending answer to room: ${payload.roomId}`);
    client.to(payload.roomId).emit('answer', payload.answer);
  }

  @SubscribeMessage('candidate')
  handleIceCandidate(client: Socket, payload: any) {
    this.logger.log(`Client ${client.id} sending ICE candidate to room: ${payload.roomId}`);
    client.to(payload.roomId).emit('candidate', payload.candidate);
  }

  @SubscribeMessage('send-message')
  handleSendMessage(client: Socket, payload: ChatMessage) {
    this.logger.log(`Client ${client.id} sending message to room: ${payload.roomId}`);
    
    // Verify user is in the room
    const room = this.rooms.get(payload.roomId);
    if (!room || !room.has(client.id)) {
      this.logger.warn(`Client ${client.id} not in room ${payload.roomId}`);
      return;
    }

    // Create message object
    const message: ChatMessage = {
      roomId: payload.roomId,
      message: payload.message,
      senderId: client.id,
      senderName: payload.senderName || `User ${client.id.slice(0, 8)}`,
      timestamp: Date.now(),
    };

    // Store user name for future messages
    this.userNames.set(client.id, message.senderName);

    // Broadcast message to all clients in the room
    this.server.to(payload.roomId).emit('message', message);
    this.logger.log(`Message broadcasted to room ${payload.roomId}: ${message.message}`);
  }

  @SubscribeMessage('test')
  handleTest(client: Socket, message: string) {
    this.logger.log(`Test message from client ${client.id}: ${message}`);
    client.emit('test-response', `Server received: ${message}`);
  }
} 