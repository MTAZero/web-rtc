import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
interface ChatMessage {
    roomId: string;
    message: string;
    senderId: string;
    senderName?: string;
    timestamp: number;
}
export declare class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    private rooms;
    private userNames;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, roomId: string): void;
    handleReady(client: Socket, payload: any): void;
    handleOffer(client: Socket, payload: any): void;
    handleAnswer(client: Socket, payload: any): void;
    handleIceCandidate(client: Socket, payload: any): void;
    handleSendMessage(client: Socket, payload: ChatMessage): void;
    handleTest(client: Socket, message: string): void;
}
export {};
