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
let WebRTCGateway = class WebRTCGateway {
    constructor() {
        this.rooms = new Map();
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        this.rooms.forEach((clients, roomId) => {
            if (clients.has(client.id)) {
                clients.delete(client.id);
                if (clients.size === 0) {
                    this.rooms.delete(roomId);
                }
                else {
                    this.server.to(roomId).emit('user-left', client.id);
                }
            }
        });
    }
    handleJoinRoom(client, roomId) {
        client.join(roomId);
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId).add(client.id);
        client.to(roomId).emit('user-joined', client.id);
        const usersInRoom = Array.from(this.rooms.get(roomId))
            .filter(id => id !== client.id);
        client.emit('room-users', usersInRoom);
    }
    handleOffer(client, payload) {
        this.server.to(payload.target).emit('offer', {
            offer: payload.offer,
            from: client.id,
        });
    }
    handleAnswer(client, payload) {
        this.server.to(payload.target).emit('answer', {
            answer: payload.answer,
            from: client.id,
        });
    }
    handleIceCandidate(client, payload) {
        this.server.to(payload.target).emit('ice-candidate', {
            candidate: payload.candidate,
            from: client.id,
        });
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
    (0, websockets_1.SubscribeMessage)('ice-candidate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebRTCGateway.prototype, "handleIceCandidate", null);
exports.WebRTCGateway = WebRTCGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], WebRTCGateway);
//# sourceMappingURL=webrtc.gateway.js.map