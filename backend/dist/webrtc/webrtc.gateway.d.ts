import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private rooms;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, roomId: string): void;
    handleOffer(client: Socket, payload: {
        target: string;
        offer: any;
    }): void;
    handleAnswer(client: Socket, payload: {
        target: string;
        answer: any;
    }): void;
    handleIceCandidate(client: Socket, payload: {
        target: string;
        candidate: any;
    }): void;
}
