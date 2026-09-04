// Order Controller for Enterprise Restaurant Ecosystem
import { Hono } from 'hono';
import { z } from 'zod';
import { OrderService } from '../services/orderService';
import { AuthService } from '../../auth/services/authService';
import { ApiResponse } from '../../../types/api';

const createOrderSchema = z.object({
  userId: z.string().optional(),
  tableId: z.string().optional(),
  items: z.array(z.object({
    dishId: z.string(),
    quantity: z.number().min(1),
    specialInstructions: z.string().optional()
  })).min(1),
  specialInstructions: z.string().optional(),
  idempotencyKey: z.string().optional()
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'cooking', 'ready', 'completed', 'cancelled']),
  reason: z.string().optional(),
  estimatedTime: z.number().optional()
});

export class OrderController {
  private orderService: OrderService;
  private authService: AuthService;

  constructor(env: any) {
    this.orderService = new OrderService(env);
    this.authService = new AuthService(env);
  }

  // Register routes
  registerRoutes(app: Hono): void {
    // Public routes (for customers)
    app.post('/api/orders', this.createOrder.bind(this));
    app.get('/api/orders/:id', this.getOrder.bind(this));
    app.get('/api/orders/my', this.getMyOrders.bind(this));

    // Admin routes
    app.get('/api/admin/orders', this.getAllOrders.bind(this));
    app.put('/api/admin/orders/:id/status', this.updateOrderStatus.bind(this));
    app.put('/api/admin/orders/:id/payment', this.updatePaymentStatus.bind(this));
    app.delete('/api/admin/orders/:id', this.cancelOrder.bind(this));
    app.get('/api/admin/orders/stats', this.getOrderStats.bind(this));
  }

  // Create new order
  private async createOrder(c: any): Promise<Response> {
    try {
      const body = await c.req.json();
      const validatedData = createOrderSchema.parse(body);

      // Get branch ID from authenticated user or default
      const branchId = c.get('branchId') || 'default-branch';

      const order = await this.orderService.createOrder(validatedData, branchId);

      const response: ApiResponse = {
        success: true,
        data: order,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      return c.json(response, 201);
    } catch (error) {
      console.error('Create order controller error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CREATE_ORDER_ERROR',
          message: error.message || 'Failed to create order'
        }
      };

      return c.json(response, 400);
    }
  }

  // Get order by ID
  private async getOrder(c: any): Promise<Response> {
    try {
      const orderId = c.req.param('id');
      const user = c.get('user');
      const admin = c.get('admin');

      if (!orderId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MISSING_ORDER_ID',
            message: 'Order ID is required'
          }
        };
        return c.json(response, 400);
      }

      const order = await this.orderService.getOrderById(orderId);

      if (!order) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found'
          }
        };
        return c.json(response, 404);
      }

      // Authorization check
      if (user && order.user_id !== user.id) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Access denied'
          }
        };
        return c.json(response, 403);
      }

      const response: ApiResponse = {
        success: true,
        data: order,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      return c.json(response);
    } catch (error) {
      console.error('Get order controller error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'GET_ORDER_ERROR',
          message: error.message || 'Failed to get order'
        }
      };

      return c.json(response, 500);
    }
  }

  // Get current user's orders
  private async getMyOrders(c: any): Promise<Response> {
    try {
      const user = c.get('user');
      
      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        };
        return c.json(response, 401);
      }

      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '10');
      const status = c.req.query('status');

      const result = await this.orderService.getOrders(user.branch_id, {
        userId: user.id,
        status,
        page,
        limit
      });

      const response: ApiResponse = {
        success: true,
        data: result.orders,
        meta: {
          pagination: result.pagination,
          timestamp: new Date().toISOString()
        }
      };

      return c.json(response);
    } catch (error) {
      console.error('Get my orders controller error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'GET_MY_ORDERS_ERROR',
          message: error.message || 'Failed to get orders'
        }
      };

      return c.json(response, 500);
    }
  }

  // Get all orders (admin)
  private async getAllOrders(c: any): Promise<Response> {
    try {
      const admin = c.get('admin');
      
      if (!admin) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'ADMIN_REQUIRED',
            message: 'Admin access required'
          }
        };
        return c.json(response, 401);
      }

      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const status = c.req.query('status');
      const tableId = c.req.query('tableId');
      const userId = c.req.query('userId');
      const date = c.req.query('date');

      const result = await this.orderService.getOrders(admin.branch_id, {
        status,
        tableId,
        userId,
        date,
        page,
        limit
      });

      const response: ApiResponse = {
        success: true,
        data: result.orders,
        meta: {
          pagination: result.pagination,
          timestamp: new Date().toISOString()
        }
      };

      return c.json(response);
    } catch (error) {
      console.error('Get all orders controller error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'GET_ALL_ORDERS_ERROR',
          message: error.message || 'Failed to get orders'
        }
      };

      return c.json(response, 500);
    }
  }

  // Update order status (admin)
  private async updateOrderStatus(c: any): Promise<Response> {
    try {
      const admin = c.get('admin');
      
      if (!admin) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'ADMIN_REQUIRED',
            message: 'Admin access required'
          }
        };
        return c.json(response, 401);
      }

      const orderId = c.req.param('id');
      const body = await c.req.json();
      const validatedData = updateOrderStatusSchema.parse(body);

      if (!orderId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MISSING_ORDER_ID',
            message: 'Order ID is required'
          }
        };
        return c.json(response, 400);
      }

      const order = await this.orderService.updateOrderStatus(
        orderId,
        validatedData,
        admin.id
      );

      const response: ApiResponse = {
        success: true,
        data: order,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      return c.json(response);
    } catch (error) {
      console.error('Update order status controller error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UPDATE_ORDER_STATUS_ERROR',
          message: error.message || 'Failed to update order status'
        }
      };

      return c.json(response, 400);
    }
  }

  // Update payment status (admin)
  private async updatePaymentStatus(c: any): Promise<Response> {
    try {
      const admin = c.get('admin');
      
      if (!admin) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'ADMIN_REQUIRED',
            message: 'Admin access required'
          }
        };
        return c.json(response, 401);
      }

      const orderId = c.req.param('id');
      const body = await c.req.json();
      
      const { paymentStatus, paymentMethod } = body;

      if (!orderId || !paymentStatus) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Order ID and payment status are required'
          }
        };
        return c.json(response, 400);
      }

      const order = await this.orderService.updatePaymentStatus(
        orderId,
        paymentStatus,
        paymentMethod
      );

      const response: ApiResponse = {
        success: true,
        data: order,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      return c.json(response);
    } catch (error) {
      console.error('Update payment status controller error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UPDATE_PAYMENT_STATUS_ERROR',
          message: error.message || 'Failed to update payment status'
        }
      };

      return c.json(response, 400);
    }
  }

  // Cancel order (admin)
  private async cancelOrder(c: any): Promise<Response> {
    try {
      const admin = c.get('admin');
      
      if (!admin) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'ADMIN_REQUIRED',
            message: 'Admin access required'
          }
        };
        return c.json(response, 401);
      }

      const orderId = c.req.param('id');
      const body = await c.req.json();
      const { reason } = body;

      if (!orderId || !reason) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Order ID and cancellation reason are required'
          }
        };
        return c.json(response, 400);
      }

      const order = await this.orderService.cancelOrder(orderId, reason, admin.id);

      const response: ApiResponse = {
        success: true,
        data: order,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      return c.json(response);
    } catch (error) {
      console.error('Cancel order controller error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CANCEL_ORDER_ERROR',
          message: error.message || 'Failed to cancel order'
        }
      };

      return c.json(response, 400);
    }
  }

  // Get order statistics (admin)
  private async getOrderStats(c: any): Promise<Response> {
    try {
      const admin = c.get('admin');
      
      if (!admin) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'ADMIN_REQUIRED',
            message: 'Admin access required'
          }
        };
        return c.json(response, 401);
      }

      const startDate = c.req.query('startDate');
      const endDate = c.req.query('endDate');

      const stats = await this.orderService.getOrderStats(admin.branch_id, {
        startDate,
        endDate
      });

      const response: ApiResponse = {
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      return c.json(response);
    } catch (error) {
      console.error('Get order stats controller error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'GET_ORDER_STATS_ERROR',
          message: error.message || 'Failed to get order statistics'
        }
      };

      return c.json(response, 500);
    }
  }
}
