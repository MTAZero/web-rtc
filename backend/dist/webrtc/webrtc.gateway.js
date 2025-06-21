"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRTCGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let WebRTCGateway = class WebRTCGateway {
    constructor() {
        this.logger = new common_1.Logger('WebRTCGateway');
        this.rooms = new Map();
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
        this.logger.log(`Client headers:`, client.handshake.headers);
        this.logger.log(`Client query:`, client.handshake.query);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.rooms.forEach((clients, roomId) => {
            if (clients.has(client.id)) {
                clients.delete(client.id);
                this.logger.log(`Removed client ${client.id} from room ${roomId}`);
                if (clients.size === 0) {
                    this.rooms.delete(roomId);
                    this.logger.log(`Room ${roomId} deleted (empty)`);
                }
                else {
                    client.to(roomId).emit('user-left');
                    this.logger.log(`Notified remaining clients in room ${roomId}`);
                }
            }
        });
    }
    handleJoinRoom(client, roomId) {
        this.logger.log(`Client ${client.id} joining room: ${roomId}`);
        this.logger.log(`Current rooms:`, Array.from(this.rooms.entries()));
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
            this.logger.log(`Created new room: ${roomId}`);
        }
        const room = this.rooms.get(roomId);
        this.logger.log(`Room ${roomId} has ${room.size} users before join`);
        this.logger.log(`Room ${roomId} clients:`, Array.from(room));
        if (room.size >= 2) {
            this.logger.log(`Room ${roomId} is full, rejecting client ${client.id}`);
            client.emit('full');
            return;
        }
        client.join(roomId);
        room.add(client.id);
        this.logger.log(`Client ${client.id} joined room ${roomId}, room now has ${room.size} users`);
        this.logger.log(`Room ${roomId} clients after join:`, Array.from(room));
        if (room.size === 1) {
            this.logger.log(`Client ${client.id} is initiator`);
            client.emit('created');
        }
        else {
            this.logger.log(`Client ${client.id} is not initiator`);
            client.emit('joined');
        }
    }
    handleReady(client, payload) {
        this.logger.log(`Client ${client.id} is ready in room: ${payload.roomId}`);
        this.logger.log(`Broadcasting ready to room ${payload.roomId}`);
        this.logger.log(`Room ${payload.roomId} has clients:`, Array.from(this.rooms.get(payload.roomId) || []));
        const room = this.rooms.get(payload.roomId);
        if (room) {
            const otherClients = Array.from(room).filter(id => id !== client.id);
            this.logger.log(`Broadcasting ready to other clients:`, otherClients);
        }
        client.to(payload.roomId).emit('ready');
        this.logger.log(`Ready event broadcasted to room ${payload.roomId}`);
    }
    handleOffer(client, payload) {
        this.logger.log(`Received offer from client ${client.id} for room: ${payload.roomId}`);
        this.logger.log(`Room ${payload.roomId} has clients:`, Array.from(this.rooms.get(payload.roomId) || []));
        this.logger.log(`Broadcasting offer to room ${payload.roomId}`);
        const room = this.rooms.get(payload.roomId);
        if (room) {
            const otherClients = Array.from(room).filter(id => id !== client.id);
            this.logger.log(`Broadcasting offer to other clients:`, otherClients);
        }
        client.to(payload.roomId).emit('offer', payload.offer);
        this.logger.log(`Offer broadcasted to room ${payload.roomId}`);
    }
    handleAnswer(client, payload) {
        this.logger.log(`Client ${client.id} sending answer to room: ${payload.roomId}`);
        client.to(payload.roomId).emit('answer', payload.answer);
    }
    handleIceCandidate(client, payload) {
        this.logger.log(`Client ${client.id} sending ICE candidate to room: ${payload.roomId}`);
        client.to(payload.roomId).emit('candidate', payload.candidate);
    }
    handleTest(client, message) {
        this.logger.log(`Test message from client ${client.id}: ${message}`);
        client.emit('test-response', `Server received: ${message}`);
    }
};
exports.WebRTCGateway = WebRTCGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebRTCGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-room'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ready'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleReady", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('offer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('answer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('candidate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleIceCandidate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleTest", null);
exports.WebRTCGateway = WebRTCGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
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
], WebRTCGateway);
//# sourceMappingURL=webrtc.gateway.js.map