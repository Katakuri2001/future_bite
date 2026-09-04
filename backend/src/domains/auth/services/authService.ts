// Authentication Service for Enterprise Restaurant Ecosystem
import { User, Admin, Env } from '../../types/database';
import { JWTPayload } from '../../types/database';
import { DatabaseService } from '../../core/database';
import { CacheService } from '../../core/cache';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  branchId: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
  branchId: string;
}

export interface AdminAuthResponse {
  admin: Omit<Admin, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private db: DatabaseService;
  private cache: CacheService;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.db = new DatabaseService(env);
    this.cache = new CacheService(env);
  }

  // User Registration
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.db.queryOne<User>(
        'SELECT * FROM users WHERE email = ? OR phone = ?',
        [data.email, data.phone]
      );

      if (existingUser) {
        throw new Error('User with this email or phone already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Generate unique QR code and barcode
      const qrCode = await this.generateQRCode();
      const barcode = await this.generateBarcode();

      // Create user
      const user = await this.db.create<User>('users', {
        id: nanoid(),
        branch_id: data.branchId,
        email: data.email,
        phone: data.phone,
        password_hash: passwordHash,
        first_name: data.firstName,
        last_name: data.lastName,
        qr_code: qrCode,
        barcode: barcode,
        points: 0,
        is_verified: false,
        is_suspended: false
      });

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Cache user session
      await this.cacheUserSession(user.id, {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken
      });

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 // 15 minutes
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // User Login
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user
      const user = await this.db.queryOne<User>(
        'SELECT * FROM users WHERE email = ? AND is_suspended = false',
        [data.email]
      );

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await this.db.execute(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Cache user session
      await this.cacheUserSession(user.id, {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken
      });

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 // 15 minutes
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Admin Login
  async adminLogin(data: AdminLoginRequest): Promise<AdminAuthResponse> {
    try {
      // Find admin
      const admin = await this.db.queryOne<Admin>(
        'SELECT * FROM admins WHERE email = ? AND branch_id = ? AND is_active = true',
        [data.email, data.branchId]
      );

      if (!admin) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, admin.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await this.db.execute(
        'UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
        [admin.id]
      );

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateAdminTokens(admin);

      // Cache admin session
      await this.cacheAdminSession(admin.id, {
        admin: this.sanitizeAdmin(admin),
        accessToken,
        refreshToken
      });

      return {
        admin: this.sanitizeAdmin(admin),
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 // 15 minutes
      };
    } catch (error) {
      console.error('Admin login error:', error);
      throw new Error(`Admin login failed: ${error.message}`);
    }
  }

  // Refresh Token
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      // Verify refresh token
      const { payload } = await jwtVerify(
        refreshToken,
        new TextEncoder().encode(this.env.JWT_REFRESH_SECRET)
      );

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user/admin from cache or database
      let user: User | null = null;
      let admin: Admin | null = null;

      if (payload.role === 'customer') {
        user = await this.getUserFromCache(payload.sub as string) || 
               await this.db.queryOne<User>('SELECT * FROM users WHERE id = ?', [payload.sub]);
      } else {
        admin = await this.getAdminFromCache(payload.sub as string) || 
                await this.db.queryOne<Admin>('SELECT * FROM admins WHERE id = ?', [payload.sub]);
      }

      if (!user && !admin) {
        throw new Error('User not found');
      }

      // Generate new tokens
      if (user) {
        const tokens = await this.generateTokens(user);
        await this.cacheUserSession(user.id, {
          user: this.sanitizeUser(user),
          ...tokens
        });
        return { ...tokens, expiresIn: 15 * 60 };
      } else {
        const tokens = await this.generateAdminTokens(admin!);
        await this.cacheAdminSession(admin!.id, {
          admin: this.sanitizeAdmin(admin!),
          ...tokens
        });
        return { ...tokens, expiresIn: 15 * 60 };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  // Logout
  async logout(token: string): Promise<void> {
    try {
      // Verify token and get user ID
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(this.env.JWT_SECRET)
      );

      // Remove from cache
      if (payload.role === 'customer') {
        await this.cache.delete(`user_session:${payload.sub}`);
      } else {
        await this.cache.delete(`admin_session:${payload.sub}`);
      }

      // Add token to blacklist (optional)
      await this.cache.set(`blacklist:${token}`, true, { ttl: 15 * 60 });
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  // Verify Token
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.cache.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new Error('Token is blacklisted');
      }

      // Verify token
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(this.env.JWT_SECRET)
      );

      return payload as JWTPayload;
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // Get User Profile
  async getUserProfile(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    try {
      const user = await this.getUserFromCache(userId) || 
                   await this.db.queryOne<User>('SELECT * FROM users WHERE id = ?', [userId]);
      
      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  // Get Admin Profile
  async getAdminProfile(adminId: string): Promise<Omit<Admin, 'password_hash'> | null> {
    try {
      const admin = await this.getAdminFromCache(adminId) || 
                    await this.db.queryOne<Admin>('SELECT * FROM admins WHERE id = ?', [adminId]);
      
      return admin ? this.sanitizeAdmin(admin) : null;
    } catch (error) {
      console.error('Get admin profile error:', error);
      throw new Error(`Failed to get admin profile: ${error.message}`);
    }
  }

  // Change Password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user
      const user = await this.db.queryOne<User>('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await this.db.execute(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPasswordHash, userId]
      );

      // Invalidate all sessions for this user
      await this.cache.delete(`user_session:${userId}`);
    } catch (error) {
      console.error('Change password error:', error);
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  // Private helper methods
  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const now = Math.floor(Date.now() / 1000);
    
    const accessToken = await new SignJWT({
      sub: user.id,
      type: 'access',
      role: 'customer',
      branch_id: user.branch_id,
      permissions: []
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + 15 * 60) // 15 minutes
      .sign(new TextEncoder().encode(this.env.JWT_SECRET));

    const refreshToken = await new SignJWT({
      sub: user.id,
      type: 'refresh',
      role: 'customer',
      branch_id: user.branch_id,
      permissions: []
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + 7 * 24 * 60 * 60) // 7 days
      .sign(new TextEncoder().encode(this.env.JWT_REFRESH_SECRET));

    return { accessToken, refreshToken };
  }

  private async generateAdminTokens(admin: Admin): Promise<{ accessToken: string; refreshToken: string }> {
    const now = Math.floor(Date.now() / 1000);
    
    const accessToken = await new SignJWT({
      sub: admin.id,
      type: 'access',
      role: admin.role,
      branch_id: admin.branch_id,
      permissions: admin.permissions ? Object.keys(admin.permissions).filter(key => admin.permissions![key]) : []
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + 15 * 60) // 15 minutes
      .sign(new TextEncoder().encode(this.env.JWT_SECRET));

    const refreshToken = await new SignJWT({
      sub: admin.id,
      type: 'refresh',
      role: admin.role,
      branch_id: admin.branch_id,
      permissions: admin.permissions ? Object.keys(admin.permissions).filter(key => admin.permissions![key]) : []
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + 7 * 24 * 60 * 60) // 7 days
      .sign(new TextEncoder().encode(this.env.JWT_REFRESH_SECRET));

    return { accessToken, refreshToken };
  }

  private async generateQRCode(): Promise<string> {
    // Generate encrypted QR code data
    const qrData = {
      type: 'user',
      id: nanoid(),
      timestamp: Date.now()
    };
    
    // For now, return a simple unique identifier
    // In production, this should be encrypted
    return `qr_${nanoid()}`;
  }

  private async generateBarcode(): Promise<string> {
    // Generate unique barcode
    return `bc_${nanoid()}`;
  }

  private sanitizeUser(user: User): Omit<User, 'password_hash'> {
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private sanitizeAdmin(admin: Admin): Omit<Admin, 'password_hash'> {
    const { password_hash, ...sanitizedAdmin } = admin;
    return sanitizedAdmin;
  }

  private async cacheUserSession(userId: string, session: any): Promise<void> {
    await this.cache.set(`user_session:${userId}`, session, { ttl: 7 * 24 * 60 * 60 });
  }

  private async cacheAdminSession(adminId: string, session: any): Promise<void> {
    await this.cache.set(`admin_session:${adminId}`, session, { ttl: 7 * 24 * 60 * 60 });
  }

  private async getUserFromCache(userId: string): Promise<User | null> {
    const session = await this.cache.get(`user_session:${userId}`);
    return session?.user || null;
  }

  private async getAdminFromCache(adminId: string): Promise<Admin | null> {
    const session = await this.cache.get(`admin_session:${adminId}`);
    return session?.admin || null;
  }
}
