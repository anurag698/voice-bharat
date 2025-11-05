import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  // Encryption configuration
  private readonly algorithm = 'aes-256-ctr';
  private readonly keyLength = 32;
  private readonly ivLength = 16;

  /**
   * Derive encryption key from password using scrypt
   * @param password - Base password/key
   * @param salt - Salt for key derivation
   */
  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    const scryptAsync = promisify(scrypt);
    return (await scryptAsync(password, salt, this.keyLength)) as Buffer;
  }

  /**
   * Encrypt message content using AES-256
   * @param text - Plain text message
   * @param conversationId - Unique conversation identifier
   */
  private async encrypt(text: string, conversationId: string): Promise<string> {
    const iv = randomBytes(this.ivLength);
    const salt = randomBytes(16);
    
    // Use conversation ID as base for encryption key
    const key = await this.deriveKey(conversationId, salt);
    
    const cipher = createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    
    // Format: salt:iv:encryptedData (all in hex)
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypt message content
   * @param encryptedText - Encrypted message format (salt:iv:data)
   * @param conversationId - Unique conversation identifier
   */
  private async decrypt(encryptedText: string, conversationId: string): Promise<string> {
    const [saltHex, ivHex, encryptedHex] = encryptedText.split(':');
    
    if (!saltHex || !ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted message format');
    }
    
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    const key = await this.deriveKey(conversationId, salt);
    
    const decipher = createDecipheriv(this.algorithm, key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Generate unique conversation ID between two users
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   */
  private generateConversationId(userId1: number, userId2: number): string {
    // Always use smaller ID first to ensure consistency
    const [smaller, larger] = [userId1, userId2].sort((a, b) => a - b);
    return `conv_${smaller}_${larger}`;
  }

  /**
   * Send a message to another user
   * @param senderId - ID of user sending message
   * @param receiverId - ID of user receiving message
   * @param content - Message content (will be encrypted)
   * @param attachmentUrl - Optional attachment URL
   */
  async sendMessage(
    senderId: number,
    receiverId: number,
    content: string,
    attachmentUrl?: string,
  ) {
    // Verify both users exist
    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: senderId } }),
      this.prisma.user.findUnique({ where: { id: receiverId } }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('Sender or receiver not found');
    }

    // Generate conversation ID
    const conversationId = this.generateConversationId(senderId, receiverId);

    // Encrypt message content
    const encryptedContent = await this.encrypt(content, conversationId);

    // Create message
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: encryptedContent,
        conversationId,
        attachmentUrl,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePicture: true,
          },
        },
      },
    });

    // Decrypt content for response
    const decryptedMessage = {
      ...message,
      content: await this.decrypt(message.content, conversationId),
    };

    return decryptedMessage;
  }

  /**
   * Get conversation between two users
   * @param userId - Current user ID
   * @param otherUserId - Other user ID
   * @param page - Page number for pagination
   * @param limit - Messages per page
   */
  async getConversation(
    userId: number,
    otherUserId: number,
    page: number = 1,
    limit: number = 50,
  ) {
    const conversationId = this.generateConversationId(userId, otherUserId);

    // Get messages in conversation
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Decrypt all messages
    const decryptedMessages = await Promise.all(
      messages.map(async (message) => ({
        ...message,
        content: await this.decrypt(message.content, conversationId),
      })),
    );

    return decryptedMessages;
  }

  /**
   * Get all conversations for a user
   * @param userId - User ID
   */
  async getConversations(userId: number) {
    // Get all messages where user is sender or receiver
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group messages by conversation and get latest message
    const conversationsMap = new Map();

    for (const message of messages) {
      const otherUser = message.senderId === userId ? message.receiver : message.sender;
      const conversationId = message.conversationId;

      if (!conversationsMap.has(conversationId)) {
        // Decrypt latest message content
        const decryptedContent = await this.decrypt(message.content, conversationId);

        conversationsMap.set(conversationId, {
          conversationId,
          otherUser,
          lastMessage: {
            id: message.id,
            content: decryptedContent,
            createdAt: message.createdAt,
            isRead: message.isRead,
            senderId: message.senderId,
          },
          unreadCount: 0,
        });
      }

      // Count unread messages
      if (message.receiverId === userId && !message.isRead) {
        const conv = conversationsMap.get(conversationId);
        conv.unreadCount++;
      }
    }

    return Array.from(conversationsMap.values());
  }

  /**
   * Mark messages as read
   * @param userId - Current user ID
   * @param otherUserId - Other user ID
   */
  async markAsRead(userId: number, otherUserId: number) {
    const conversationId = this.generateConversationId(userId, otherUserId);

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        senderId: otherUserId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true, message: 'Messages marked as read' };
  }

  /**
   * Delete a message (only sender can delete)
   * @param messageId - Message ID
   * @param userId - User ID attempting to delete
   */
  async deleteMessage(messageId: number, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { success: true, message: 'Message deleted' };
  }

  /**
   * Search messages in a conversation
   * @param userId - Current user ID
   * @param otherUserId - Other user ID
   * @param searchQuery - Search term
   */
  async searchMessages(
    userId: number,
    otherUserId: number,
    searchQuery: string,
  ) {
    const conversationId = this.generateConversationId(userId, otherUserId);

    // Get all messages in conversation
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt and filter messages
    const searchResults = [];
    for (const message of messages) {
      const decryptedContent = await this.decrypt(message.content, conversationId);
      
      if (decryptedContent.toLowerCase().includes(searchQuery.toLowerCase())) {
        searchResults.push({
          ...message,
          content: decryptedContent,
        });
      }
    }

    return searchResults;
  }

  /**
   * Get unread message count for user
   * @param userId - User ID
   */
  async getUnreadCount(userId: number) {
    const count = await this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }
}
