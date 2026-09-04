// Order Service for Enterprise Restaurant Ecosystem
import { Order, OrderItem, Dish, Table, User, Env } from '../../types/database';
import { DatabaseService } from '../../core/database';
import { CacheService } from '../../core/cache';
import { nanoid } from 'nanoid';

export interface CreateOrderRequest {
  userId?: string;
  tableId?: string;
  items: Array<{
    dishId: string;
    quantity: number;
    specialInstructions?: string;
  }>;
  specialInstructions?: string;
  idempotencyKey?: string;
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'accepted' | 'cooking' | 'ready' | 'completed' | 'cancelled';
  reason?: string;
  estimatedTime?: number;
}

export interface OrderResponse extends Order {
  items: (OrderItem & { dish: Dish })[];
  user?: User;
  table?: Table;
}

export class OrderService {
  private db: DatabaseService;
  private cache: CacheService;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.db = new DatabaseService(env);
    this.cache = new CacheService(env);
  }

  // Create new order
  async createOrder(data: CreateOrderRequest, branchId: string): Promise<OrderResponse> {
    try {
      // Check for idempotency key to prevent duplicates
      if (data.idempotencyKey) {
        const existingOrder = await this.db.queryOne<Order>(
          'SELECT * FROM orders WHERE idempotency_key = ?',
          [data.idempotencyKey]
        );
        if (existingOrder) {
          throw new Error('Duplicate order request');
        }
      }

      // Validate table availability if tableId is provided
      if (data.tableId) {
        const table = await this.db.queryOne<Table>(
          'SELECT * FROM tables WHERE id = ? AND is_active = true',
          [data.tableId]
        );
        if (!table) {
          throw new Error('Table not found or inactive');
        }
      }

      // Calculate order totals
      let subtotal = 0;
      const orderItems: Array<{
        dish_id: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
        special_instructions?: string;
      }> = [];

      for (const item of data.items) {
        const dish = await this.db.queryOne<Dish>(
          'SELECT * FROM dishes WHERE id = ? AND is_available = true',
          [item.dishId]
        );

        if (!dish) {
          throw new Error(`Dish ${item.dishId} not found or unavailable`);
        }

        const itemSubtotal = dish.price * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          dish_id: item.dishId,
          quantity: item.quantity,
          unit_price: dish.price,
          subtotal: itemSubtotal,
          special_instructions: item.specialInstructions
        });
      }

      // Calculate tax and totals (assuming 10% tax rate)
      const taxAmount = subtotal * 0.1;
      const totalAmount = subtotal + taxAmount;

      // Generate order number
      const orderNumber = await this.generateOrderNumber(branchId);

      // Create order
      const order = await this.db.create<Order>('orders', {
        id: nanoid(),
        branch_id: branchId,
        user_id: data.userId,
        table_id: data.tableId,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        total_amount: totalAmount,
        payment_status: 'pending',
        special_instructions: data.specialInstructions,
        idempotency_key: data.idempotencyKey
      });

      // Create order items
      const createdItems: OrderItem[] = [];
      for (const item of orderItems) {
        const orderItem = await this.db.create<OrderItem>('order_items', {
          id: nanoid(),
          order_id: order.id,
          dish_id: item.dish_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          special_instructions: item.special_instructions,
          status: 'pending'
        });
        createdItems.push(orderItem);
      }

      // Get complete order with relations
      const completeOrder = await this.getOrderById(order.id);

      // Cache the order
      await this.cache.set(`order:${order.id}`, completeOrder, { ttl: 3600 });

      // Publish real-time event
      await this.publishOrderEvent('OrderCreated', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableId: data.tableId,
        userId: data.userId,
        totalAmount: totalAmount
      });

      return completeOrder!;
    } catch (error) {
      console.error('Create order error:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<OrderResponse | null> {
    try {
      // Try cache first
      const cached = await this.cache.get<OrderResponse>(`order:${orderId}`);
      if (cached) {
        return cached;
      }

      // Get order
      const order = await this.db.queryOne<Order>(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      if (!order) {
        return null;
      }

      // Get order items with dishes
      const items = await this.db.query<(OrderItem & { dish: Dish })>(`
        SELECT 
          oi.*,
          d.id as dish_id,
          d.name as dish_name,
          d.description as dish_description,
          d.price as dish_price,
          d.image_url as dish_image_url,
          d.preparation_time as dish_preparation_time
        FROM order_items oi
        JOIN dishes d ON oi.dish_id = d.id
        WHERE oi.order_id = ?
      `, [orderId]);

      // Get user and table if they exist
      let user: User | undefined;
      let table: Table | undefined;

      if (order.user_id) {
        user = await this.db.queryOne<User>('SELECT * FROM users WHERE id = ?', [order.user_id]);
      }

      if (order.table_id) {
        table = await this.db.queryOne<Table>('SELECT * FROM tables WHERE id = ?', [order.table_id]);
      }

      const orderResponse: OrderResponse = {
        ...order,
        items,
        user,
        table
      };

      // Cache the result
      await this.cache.set(`order:${orderId}`, orderResponse, { ttl: 3600 });

      return orderResponse;
    } catch (error) {
      console.error('Get order error:', error);
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }

  // Get orders for a branch
  async getOrders(branchId: string, options: {
    status?: string;
    tableId?: string;
    userId?: string;
    date?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    orders: OrderResponse[];
    pagination: any;
  }> {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = ['o.branch_id = ?'];
      const params: any[] = [branchId];

      if (options.status) {
        conditions.push('o.status = ?');
        params.push(options.status);
      }

      if (options.tableId) {
        conditions.push('o.table_id = ?');
        params.push(options.tableId);
      }

      if (options.userId) {
        conditions.push('o.user_id = ?');
        params.push(options.userId);
      }

      if (options.date) {
        conditions.push('DATE(o.created_at) = ?');
        params.push(options.date);
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const total = await this.db.count('orders o', whereClause, params);

      // Get orders
      const orders = await this.db.query<Order>(`
        SELECT o.* FROM orders o
        WHERE ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      // Get full order details for each order
      const fullOrders: OrderResponse[] = [];
      for (const order of orders) {
        const fullOrder = await this.getOrderById(order.id);
        if (fullOrder) {
          fullOrders.push(fullOrder);
        }
      }

      const totalPages = Math.ceil(total / limit);

      return {
        orders: fullOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Get orders error:', error);
      throw new Error(`Failed to get orders: ${error.message}`);
    }
  }

  // Update order status
  async updateOrderStatus(
    orderId: string,
    data: UpdateOrderStatusRequest,
    updatedBy: string
  ): Promise<OrderResponse> {
    try {
      // Get current order
      const currentOrder = await this.db.queryOne<Order>(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      if (!currentOrder) {
        throw new Error('Order not found');
      }

      // Validate status transition
      if (!this.isValidStatusTransition(currentOrder.status, data.status)) {
        throw new Error(`Invalid status transition from ${currentOrder.status} to ${data.status}`);
      }

      // Update order status
      await this.db.execute(`
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [data.status, orderId]);

      // Update item statuses based on order status
      await this.updateOrderItemsStatus(orderId, data.status);

      // Get updated order
      const updatedOrder = await this.getOrderById(orderId);

      // Clear cache
      await this.cache.delete(`order:${orderId}`);

      // Publish real-time event
      await this.publishOrderEvent('OrderStatusChanged', {
        orderId,
        oldStatus: currentOrder.status,
        newStatus: data.status,
        changedBy: updatedBy,
        reason: data.reason,
        estimatedTime: data.estimatedTime
      });

      return updatedOrder!;
    } catch (error) {
      console.error('Update order status error:', error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  // Update payment status
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed',
    paymentMethod?: string
  ): Promise<OrderResponse> {
    try {
      await this.db.execute(`
        UPDATE orders 
        SET payment_status = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [paymentStatus, paymentMethod, orderId]);

      // Clear cache
      await this.cache.delete(`order:${orderId}`);

      // Get updated order
      const updatedOrder = await this.getOrderById(orderId);

      // Publish payment event
      if (paymentStatus === 'paid') {
        await this.publishOrderEvent('OrderPaymentCompleted', {
          orderId,
          paymentMethod,
          amount: updatedOrder?.total_amount
        });
      }

      return updatedOrder!;
    } catch (error) {
      console.error('Update payment status error:', error);
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  // Cancel order
  async cancelOrder(orderId: string, reason: string, cancelledBy: string): Promise<OrderResponse> {
    try {
      const order = await this.db.queryOne<Order>(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'completed' || order.status === 'cancelled') {
        throw new Error('Cannot cancel completed or already cancelled order');
      }

      await this.updateOrderStatus(orderId, {
        status: 'cancelled',
        reason
      }, cancelledBy);

      const cancelledOrder = await this.getOrderById(orderId);
      return cancelledOrder!;
    } catch (error) {
      console.error('Cancel order error:', error);
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  // Get order statistics
  async getOrderStats(branchId: string, options: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
    revenueByDate: Array<{ date: string; revenue: number; orders: number }>;
  }> {
    try {
      const { startDate, endDate } = options;
      
      // Build date filter
      let dateFilter = '';
      const params: any[] = [branchId];
      
      if (startDate && endDate) {
        dateFilter = 'AND DATE(created_at) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      } else if (startDate) {
        dateFilter = 'AND DATE(created_at) >= ?';
        params.push(startDate);
      } else if (endDate) {
        dateFilter = 'AND DATE(created_at) <= ?';
        params.push(endDate);
      }

      // Get basic stats
      const basicStats = await this.db.queryOne<{
        total_orders: number;
        total_revenue: number;
        avg_order_value: number;
      }>(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as avg_order_value
        FROM orders 
        WHERE branch_id = ? AND status = 'completed' ${dateFilter}
      `, params);

      // Get orders by status
      const statusStats = await this.db.query<{ status: string; count: number }>(`
        SELECT status, COUNT(*) as count
        FROM orders 
        WHERE branch_id = ? ${dateFilter}
        GROUP BY status
      `, params);

      const ordersByStatus = statusStats.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {} as Record<string, number>);

      // Get revenue by date
      const revenueByDate = await this.db.query<{ date: string; revenue: number; orders: number }>(`
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*) as orders
        FROM orders 
        WHERE branch_id = ? AND status = 'completed' ${dateFilter}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `, params);

      return {
        totalOrders: basicStats?.total_orders || 0,
        totalRevenue: basicStats?.total_revenue || 0,
        averageOrderValue: basicStats?.avg_order_value || 0,
        ordersByStatus,
        revenueByDate
      };
    } catch (error) {
      console.error('Get order stats error:', error);
      throw new Error(`Failed to get order statistics: ${error.message}`);
    }
  }

  // Private helper methods
  private async generateOrderNumber(branchId: string): Promise<string> {
    try {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `ORD${today}`;
      
      // Get the highest order number for today
      const result = await this.db.queryOne<{ max_number: number }>(`
        SELECT 
          COALESCE(MAX(CAST(SUBSTRING(order_number, 12) AS INTEGER)), 0) as max_number
        FROM orders 
        WHERE branch_id = ? AND order_number LIKE ?
      `, [branchId, `${prefix}%`]);

      const nextNumber = (result?.max_number || 0) + 1;
      return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Generate order number error:', error);
      // Fallback to timestamp-based number
      return `ORD${Date.now()}`;
    }
  }

  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const transitions: Record<string, string[]> = {
      'pending': ['accepted', 'cancelled'],
      'accepted': ['cooking', 'cancelled'],
      'cooking': ['ready', 'cancelled'],
      'ready': ['completed'],
      'completed': [], // No transitions from completed
      'cancelled': [] // No transitions from cancelled
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  }

  private async updateOrderItemsStatus(orderId: string, orderStatus: string): Promise<void> {
    let itemStatus: string;

    switch (orderStatus) {
      case 'accepted':
        itemStatus = 'preparing';
        break;
      case 'cooking':
        itemStatus = 'preparing';
        break;
      case 'ready':
        itemStatus = 'ready';
        break;
      case 'completed':
        itemStatus = 'served';
        break;
      case 'cancelled':
        itemStatus = 'cancelled';
        break;
      default:
        itemStatus = 'pending';
    }

    await this.db.execute(`
      UPDATE order_items 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `, [itemStatus, orderId]);
  }

  private async publishOrderEvent(eventType: string, data: any): Promise<void> {
    try {
      // This would integrate with the real-time system
      // For now, we'll store the event in cache for processing
      const event = {
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
        branch_id: data.branchId || 'unknown'
      };

      await this.cache.set(`event:${nanoid()}`, event, { ttl: 3600 });
      
      console.log('Order event published:', event);
    } catch (error) {
      console.error('Publish order event error:', error);
    }
  }
}
