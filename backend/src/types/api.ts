// API Types for Enterprise Restaurant Ecosystem

// HTTP Methods
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API Route Configuration
export interface APIRoute {
  path: string;
  method: HTTPMethod;
  handler: string;
  middleware?: string[];
  permissions?: string[];
}

// Request/Response Types
export interface RequestContext {
  env: any;
  user?: any;
  admin?: any;
  branch_id: string;
  ip?: string;
  user_agent?: string;
}

export interface ValidationSchema {
  body?: any;
  query?: any;
  params?: any;
}

// Error Types
export interface APIError {
  code: string;
  message: string;
  status: number;
  details?: any;
}

export class ValidationError extends Error {
  public code: string;
  public details: any;

  constructor(message: string, code: string = 'VALIDATION_ERROR', details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  public code: string;

  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = 'AUTHENTICATION_ERROR';
  }
}

export class AuthorizationError extends Error {
  public code: string;

  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'AUTHORIZATION_ERROR';
  }
}

export class NotFoundError extends Error {
  public code: string;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND_ERROR';
  }
}

export class ConflictError extends Error {
  public code: string;

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.code = 'CONFLICT_ERROR';
  }
}

export class RateLimitError extends Error {
  public code: string;

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
    this.code = 'RATE_LIMIT_ERROR';
  }
}

// Middleware Types
export interface Middleware {
  name: string;
  execute: (context: RequestContext, next: () => Promise<any>) => Promise<any>;
}

export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (context: RequestContext) => string;
}

// Event Types
export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  data: any;
  timestamp: string;
  version: number;
}

export interface EventHandler {
  eventType: string;
  handler: (event: DomainEvent) => Promise<void>;
}

// Service Types
export interface ServiceOptions {
  env: any;
  logger?: any;
}

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: any): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  count(filters?: any): Promise<number>;
}

// Cache Types
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  key?: string;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(tags?: string[]): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// Queue Types
export interface QueueMessage {
  id: string;
  type: string;
  data: any;
  attempts: number;
  maxAttempts: number;
  delayUntil?: string;
}

export interface QueueService {
  enqueue(message: Omit<QueueMessage, 'id' | 'attempts'>): Promise<void>;
  dequeue(): Promise<QueueMessage | null>;
  complete(messageId: string): Promise<void>;
  fail(messageId: string, error: string): Promise<void>;
}

// File Upload Types
export interface FileUpload {
  name: string;
  type: string;
  size: number;
  buffer: ArrayBuffer;
  lastModified: number;
}

export interface UploadOptions {
  bucket?: string;
  path?: string;
  public?: boolean;
  metadata?: Record<string, string>;
}

// Export/Import Types
export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  filters?: Record<string, any>;
  fields?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// Webhook Types
export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  signature: string;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  retryAttempts: number;
}

// Search Types
export interface SearchQuery {
  text?: string;
  filters?: Record<string, any>;
  sort?: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'webhook';
  config: Record<string, any>;
}

// Analytics Types
export interface Metric {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

// Health Check Types
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
  details?: any;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: HealthCheck[];
}
