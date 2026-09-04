// Event Types for Enterprise Restaurant Ecosystem

// Base Event Interface
export interface BaseEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  data: any;
  metadata: {
    timestamp: string;
    userId?: string;
    branchId: string;
    version: number;
    correlationId?: string;
    causationId?: string;
  };
}

// Domain Events

// Order Events
export interface OrderCreatedEvent extends BaseEvent {
  type: 'OrderCreated';
  data: {
    orderId: string;
    userId?: string;
    tableId?: string;
    orderNumber: string;
    items: Array<{
      dishId: string;
      quantity: number;
      unitPrice: number;
    }>;
    totalAmount: number;
  };
}

export interface OrderStatusChangedEvent extends BaseEvent {
  type: 'OrderStatusChanged';
  data: {
    orderId: string;
    oldStatus: string;
    newStatus: string;
    changedBy: string;
    reason?: string;
  };
}

export interface OrderPaymentCompletedEvent extends BaseEvent {
  type: 'OrderPaymentCompleted';
  data: {
    orderId: string;
    paymentMethod: string;
    amount: number;
    transactionId: string;
  };
}

// User Events
export interface UserRegisteredEvent extends BaseEvent {
  type: 'UserRegistered';
  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    qrCode: string;
    barcode: string;
  };
}

export interface UserLoggedInEvent extends BaseEvent {
  type: 'UserLoggedIn';
  data: {
    userId: string;
    loginMethod: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

// Loyalty Events
export interface LoyaltyPointsEarnedEvent extends BaseEvent {
  type: 'LoyaltyPointsEarned';
  data: {
    userId: string;
    orderId: string;
    pointsEarned: number;
    newBalance: number;
    reason: string;
  };
}

export interface LoyaltyPointsRedeemedEvent extends BaseEvent {
  type: 'LoyaltyPointsRedeemed';
  data: {
    userId: string;
    pointsRedeemed: number;
    newBalance: number;
    redemptionType: string;
  };
}

// Booking Events
export interface BookingCreatedEvent extends BaseEvent {
  type: 'BookingCreated';
  data: {
    bookingId: string;
    userId: string;
    tableId?: string;
    partySize: number;
    bookingDate: string;
    bookingTime: string;
    duration: number;
  };
}

export interface BookingStatusChangedEvent extends BaseEvent {
  type: 'BookingStatusChanged';
  data: {
    bookingId: string;
    oldStatus: string;
    newStatus: string;
    changedBy: string;
    reason?: string;
  };
}

export interface BookingReminderSentEvent extends BaseEvent {
  type: 'BookingReminderSent';
  data: {
    bookingId: string;
    userId: string;
    reminderType: 'email' | 'sms';
    sentAt: string;
  };
}

// Inventory Events
export interface StockLevelChangedEvent extends BaseEvent {
  type: 'StockLevelChanged';
  data: {
    supplyId: string;
    oldStock: number;
    newStock: number;
    transactionType: string;
    reason: string;
  };
}

export interface LowStockAlertEvent extends BaseEvent {
  type: 'LowStockAlert';
  data: {
    supplyId: string;
    currentStock: number;
    minStockLevel: number;
    supplyName: string;
    urgency: 'low' | 'medium' | 'high';
  };
}

// Rating Events
export interface RatingSubmittedEvent extends BaseEvent {
  type: 'RatingSubmitted';
  data: {
    ratingId: string;
    userId: string;
    orderId?: string;
    rating: number;
    comment?: string;
    isPublic: boolean;
  };
}

// Table Events
export interface TableScannedEvent extends BaseEvent {
  type: 'TableScanned';
  data: {
    tableId: string;
    userId?: string;
    scannedAt: string;
    sessionId: string;
    ipAddress?: string;
  };
}

export interface TableSessionStartedEvent extends BaseEvent {
  type: 'TableSessionStarted';
  data: {
    tableId: string;
    userId?: string;
    sessionId: string;
    startedAt: string;
  };
}

export interface TableSessionEndedEvent extends BaseEvent {
  type: 'TableSessionEnded';
  data: {
    tableId: string;
    sessionId: string;
    endedAt: string;
    duration: number;
    orderId?: string;
  };
}

// Analytics Events
export interface DailySalesCalculatedEvent extends BaseEvent {
  type: 'DailySalesCalculated';
  data: {
    date: string;
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    averageOrderValue: number;
    peakHour: number;
  };
}

export interface DishPerformanceUpdatedEvent extends BaseEvent {
  type: 'DishPerformanceUpdated';
  data: {
    dishId: string;
    date: string;
    timesOrdered: number;
    totalRevenue: number;
    profitMargin: number;
  };
}

// System Events
export interface AdminActionEvent extends BaseEvent {
  type: 'AdminAction';
  data: {
    adminId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface SystemConfigChangedEvent extends BaseEvent {
  type: 'SystemConfigChanged';
  data: {
    configKey: string;
    oldValue: string;
    newValue: string;
    changedBy: string;
    reason?: string;
  };
}

// Integration Events
export interface PaymentProcessedEvent extends BaseEvent {
  type: 'PaymentProcessed';
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    gateway: string;
    gatewayTransactionId: string;
  };
}

export interface EmailSentEvent extends BaseEvent {
  type: 'EmailSent';
  data: {
    to: string;
    subject: string;
    template: string;
    data: any;
    sentAt: string;
    messageId: string;
  };
}

export interface SMSSentEvent extends BaseEvent {
  type: 'SMSSent';
  data: {
    to: string;
    message: string;
    sentAt: string;
    messageId: string;
  };
}

// Real-time Events
export interface RealtimeOrderUpdateEvent extends BaseEvent {
  type: 'RealtimeOrderUpdate';
  data: {
    orderId: string;
    status: string;
    estimatedTime?: number;
    message?: string;
    targets: Array<{
      type: 'user' | 'admin' | 'table' | 'all';
      id?: string;
    }>;
  };
}

export interface RealtimeBookingUpdateEvent extends BaseEvent {
  type: 'RealtimeBookingUpdate';
  data: {
    bookingId: string;
    status: string;
    message?: string;
    targets: Array<{
      type: 'user' | 'admin' | 'all';
      id?: string;
    }>;
  };
}

// Event Union Types
export type DomainEvent = 
  | OrderCreatedEvent
  | OrderStatusChangedEvent
  | OrderPaymentCompletedEvent
  | UserRegisteredEvent
  | UserLoggedInEvent
  | LoyaltyPointsEarnedEvent
  | LoyaltyPointsRedeemedEvent
  | BookingCreatedEvent
  | BookingStatusChangedEvent
  | BookingReminderSentEvent
  | StockLevelChangedEvent
  | LowStockAlertEvent
  | RatingSubmittedEvent
  | TableScannedEvent
  | TableSessionStartedEvent
  | TableSessionEndedEvent
  | DailySalesCalculatedEvent
  | DishPerformanceUpdatedEvent
  | AdminActionEvent
  | SystemConfigChangedEvent
  | PaymentProcessedEvent
  | EmailSentEvent
  | SMSSentEvent
  | RealtimeOrderUpdateEvent
  | RealtimeBookingUpdateEvent;

// Event Handlers
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  eventType: T['type'];
  handler: (event: T) => Promise<void>;
}

// Event Store Interface
export interface EventStore {
  saveEvent(event: DomainEvent): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getEventsByType(eventType: string, limit?: number): Promise<DomainEvent[]>;
  getEventsByDateRange(startDate: string, endDate: string): Promise<DomainEvent[]>;
}

// Event Bus Interface
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): Promise<void>;
  unsubscribe(eventType: string, handler: EventHandler): Promise<void>;
}

// Event Projection Interface
export interface EventProjection {
  project(event: DomainEvent): Promise<void>;
  rebuild(aggregateId?: string): Promise<void>;
}

// Snapshot Interface
export interface EventSnapshot {
  aggregateId: string;
  aggregateType: string;
  data: any;
  version: number;
  timestamp: string;
}

export interface SnapshotStore {
  saveSnapshot(snapshot: EventSnapshot): Promise<void>;
  getSnapshot(aggregateId: string): Promise<EventSnapshot | null>;
  deleteSnapshot(aggregateId: string): Promise<void>;
}
