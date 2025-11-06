import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('NotificationGateway');
  private connectedUsers: Map<number, string> = new Map(); // userId -> socketId

  afterInit(server: Server) {
    this.logger.log('Notification Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Remove user from connected users map
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
        break;
      }
    }
  }

  /**
   * Register user connection
   */
  @SubscribeMessage('register')
  handleRegister(client: Socket, userId: number) {
    this.connectedUsers.set(userId, client.id);
    this.logger.log(`User ${userId} registered with socket ${client.id}`);
    return { success: true, message: 'Registered successfully' };
  }

  /**
   * Send notification to a specific user
   */
  sendNotificationToUser(userId: number, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
      this.logger.log(`Sent notification to user ${userId}`);
      return true;
    }
    
    this.logger.warn(`User ${userId} is not connected`);
    return false;
  }

  /**
   * Send notification to multiple users
   */
  sendNotificationToUsers(userIds: number[], notification: any) {
    let sentCount = 0;
    
    for (const userId of userIds) {
      if (this.sendNotificationToUser(userId, notification)) {
        sentCount++;
      }
    }
    
    this.logger.log(
      `Sent notification to ${sentCount}/${userIds.length} users`,
    );
    return sentCount;
  }

  /**
   * Broadcast notification to all connected users
   */
  broadcastNotification(notification: any) {
    this.server.emit('notification', notification);
    this.logger.log('Broadcast notification to all users');
  }

  /**
   * Send typing indicator
   */
  @SubscribeMessage('typing')
  handleTyping(client: Socket, data: { recipientId: number; isTyping: boolean }) {
    const recipientSocketId = this.connectedUsers.get(data.recipientId);
    
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('typing', {
        isTyping: data.isTyping,
      });
    }
  }

  /**
   * Send online/offline status
   */
  sendUserStatus(userId: number, isOnline: boolean) {
    // Broadcast to all connected users that follow this user
    this.server.emit('userStatus', {
      userId,
      isOnline,
      timestamp: new Date(),
    });
  }

  /**
   * Get number of connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }
}
