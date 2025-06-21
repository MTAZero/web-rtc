import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    private rooms;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, roomId: string): void;
    handleReady(client: Socket, payload: any): void;
    handleOffer(client: Socket, payload: any): void;
    handleAnswer(client: Socket, payload: any): void;
    handleIceCandidate(client: Socket, payload: any): void;
    handleTest(client: Socket, message: string): void;
}
