import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private rooms: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove client from all rooms
    this.rooms.forEach((clients, roomId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.rooms.delete(roomId);
        } else {
          this.server.to(roomId).emit('user-left', client.id);
        }
      }
    });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, roomId: string) {
    client.join(roomId);
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(client.id);
    
    // Notify others in the room
    client.to(roomId).emit('user-joined', client.id);
    
    // Send list of users in room to the new user
    const usersInRoom = Array.from(this.rooms.get(roomId))
      .filter(id => id !== client.id);
    client.emit('room-users', usersInRoom);
  }

  @SubscribeMessage('offer')
  handleOffer(client: Socket, payload: { target: string; offer: any }) {
    this.server.to(payload.target).emit('offer', {
      offer: payload.offer,
      from: client.id,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(client: Socket, payload: { target: string; answer: any }) {
    this.server.to(payload.target).emit('answer', {
      answer: payload.answer,
      from: client.id,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(client: Socket, payload: { target: string; candidate: any }) {
    this.server.to(payload.target).emit('ice-candidate', {
      candidate: payload.candidate,
      from: client.id,
    });
  }
} 