// Real-time Order Manager Durable Object
import { DurableObject } from 'cloudflare:workers';

export interface OrderState {
  id: string;
  status: 'pending' | 'accepted' | 'cooking' | 'ready' | 'completed' | 'cancelled';
  items: Array<{
    id: string;
    dishId: string;
    quantity: number;
    status: string;
  }>;
  tableId?: string;
  userId?: string;
  estimatedTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  target?: string;
}

export class OrderManager implements DurableObject {
  private state: DurableObjectState;
  private env: any;
  private sessions: Map<string, WebSocket>; // Connected WebSocket sessions
  private orders: Map<string, OrderState>; // Active orders

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.orders = new Map();
  }

  // Handle WebSocket connections
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/ws') {
      return this.handleWebSocket(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair();
    
    // Accept the WebSocket connection
    server.accept();
    
    // Generate session ID
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, server);
    
    // Handle WebSocket messages
    server.addEventListener('message', (event) => {
      this.handleMessage(sessionId, event.data as string);
    });
    
    // Handle WebSocket close
    server.addEventListener('close', () => {
      this.sessions.delete(sessionId);
    });
    
    // Send welcome message
    this.sendToSession(sessionId, {
      type: 'connected',
      data: { sessionId },
      timestamp: new Date().toISOString()
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  private async handleMessage(sessionId: string, data: string): Promise<void> {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      switch (message.type) {
        case 'subscribe':
          await this.handleSubscribe(sessionId, message.data);
          break;
        case 'order_update':
          await this.handleOrderUpdate(sessionId, message.data);
          break;
        case 'join_table':
          await this.handleJoinTable(sessionId, message.data);
          break;
        case 'leave_table':
          await this.handleLeaveTable(sessionId, message.data);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendToSession(sessionId, {
        type: 'error',
        data: { message: 'Invalid message format' },
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleSubscribe(sessionId: string, data: any): Promise<void> {
    const { orderId, branchId, role } = data;
    
    // Store subscription info in session metadata
    const session = this.sessions.get(sessionId);
    if (session) {
      (session as any).subscriptions = {
        orderId,
        branchId,
        role // 'customer', 'admin', 'kitchen'
      };
    }
    
    // Send current order state if subscribing to specific order
    if (orderId && this.orders.has(orderId)) {
      this.sendToSession(sessionId, {
        type: 'order_state',
        data: this.orders.get(orderId),
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleOrderUpdate(sessionId: string, data: any): Promise<void> {
    const { orderId, status, estimatedTime, updatedBy } = data;
    
    // Update order state
    if (this.orders.has(orderId)) {
      const order = this.orders.get(orderId)!;
      order.status = status;
      order.estimatedTime = estimatedTime;
      order.updatedAt = new Date().toISOString();
      
      // Persist to durable storage
      await this.state.storage.put(`order:${orderId}`, order);
      
      // Broadcast to all relevant sessions
      await this.broadcastToOrderSubscribers(orderId, {
        type: 'order_status_changed',
        data: {
          orderId,
          status,
          estimatedTime,
          updatedBy,
          timestamp: order.updatedAt
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleJoinTable(sessionId: string, data: any): Promise<void> {
    const { tableId, userId } = data;
    
    // Update session metadata
    const session = this.sessions.get(sessionId);
    if (session) {
      (session as any).tableId = tableId;
      (session as any).userId = userId;
    }
    
    // Notify other sessions at the table
    await this.broadcastToTable(tableId, {
      type: 'user_joined_table',
      data: { tableId, userId, sessionId },
      timestamp: new Date().toISOString()
    }, sessionId);
  }

  private async handleLeaveTable(sessionId: string, data: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session && (session as any).tableId) {
      const tableId = (session as any).tableId;
      const userId = (session as any).userId;
      
      // Clear session metadata
      delete (session as any).tableId;
      delete (session as any).userId;
      
      // Notify other sessions at the table
      await this.broadcastToTable(tableId, {
        type: 'user_left_table',
        data: { tableId, userId, sessionId },
        timestamp: new Date().toISOString()
      }, sessionId);
    }
  }

  private sendToSession(sessionId: string, message: WebSocketMessage): void {
    const session = this.sessions.get(sessionId);
    if (session && session.readyState === WebSocket.OPEN) {
      session.send(JSON.stringify(message));
    }
  }

  private async broadcastToOrderSubscribers(orderId: string, message: WebSocketMessage, excludeSessionId?: string): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [sessionId, session] of this.sessions) {
      if (sessionId !== excludeSessionId && session.readyState === WebSocket.OPEN) {
        const subscriptions = (session as any).subscriptions;
        if (subscriptions && subscriptions.orderId === orderId) {
          promises.push(
            new Promise<void>((resolve) => {
              session.send(JSON.stringify(message));
              resolve();
            })
          );
        }
      }
    }
    
    await Promise.all(promises);
  }

  private async broadcastToTable(tableId: string, message: WebSocketMessage, excludeSessionId?: string): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [sessionId, session] of this.sessions) {
      if (sessionId !== excludeSessionId && session.readyState === WebSocket.OPEN) {
        const sessionTableId = (session as any).tableId;
        if (sessionTableId === tableId) {
          promises.push(
            new Promise<void>((resolve) => {
              session.send(JSON.stringify(message));
              resolve();
            })
          );
        }
      }
    }
    
    await Promise.all(promises);
  }

  private async broadcastToBranch(branchId: string, message: WebSocketMessage, excludeSessionId?: string): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [sessionId, session] of this.sessions) {
      if (sessionId !== excludeSessionId && session.readyState === WebSocket.OPEN) {
        const subscriptions = (session as any).subscriptions;
        if (subscriptions && subscriptions.branchId === branchId) {
          promises.push(
            new Promise<void>((resolve) => {
              session.send(JSON.stringify(message));
              resolve();
            })
          );
        }
      }
    }
    
    await Promise.all(promises);
  }

  // Public methods for external calls
  async createOrder(orderData: OrderState): Promise<void> {
    this.orders.set(orderData.id, orderData);
    await this.state.storage.put(`order:${orderData.id}`, orderData);
    
    // Broadcast to all admin sessions in the branch
    await this.broadcastToBranch(orderData.branchId || 'default', {
      type: 'order_created',
      data: orderData,
      timestamp: new Date().toISOString()
    });
  }

  async updateOrderStatus(orderId: string, status: string, updatedBy: string, estimatedTime?: number): Promise<void> {
    if (this.orders.has(orderId)) {
      const order = this.orders.get(orderId)!;
      order.status = status;
      order.estimatedTime = estimatedTime;
      order.updatedAt = new Date().toISOString();
      
      await this.state.storage.put(`order:${orderId}`, order);
      
      await this.broadcastToOrderSubscribers(orderId, {
        type: 'order_status_changed',
        data: {
          orderId,
          status,
          estimatedTime,
          updatedBy,
          timestamp: order.updatedAt
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getOrder(orderId: string): Promise<OrderState | null> {
    if (this.orders.has(orderId)) {
      return this.orders.get(orderId)!;
    }
    
    // Try to load from storage
    const stored = await this.state.storage.get(`order:${orderId}`);
    if (stored) {
      this.orders.set(orderId, stored as OrderState);
      return stored as OrderState;
    }
    
    return null;
  }

  async getActiveOrders(branchId?: string): Promise<OrderState[]> {
    const orders: OrderState[] = [];
    
    for (const order of this.orders.values()) {
      if (!branchId || order.branchId === branchId) {
        orders.push(order);
      }
    }
    
    return orders;
  }

  async cleanupOldOrders(): Promise<void> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // Remove orders older than 24 hours
    
    for (const [orderId, order] of this.orders) {
      const orderTime = new Date(order.updatedAt);
      if (orderTime < cutoffTime && (order.status === 'completed' || order.status === 'cancelled')) {
        this.orders.delete(orderId);
        await this.state.storage.delete(`order:${orderId}`);
      }
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; sessions: number; orders: number }> {
    return {
      status: 'healthy',
      sessions: this.sessions.size,
      orders: this.orders.size
    };
  }
}
