const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

class User {
  static async findById(id) {
    try {
      const user = await db('users').where('id', id).first();
      if (user) {
        delete user.password_hash;
      }
      return user;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const user = await db('users').where('email', email.toLowerCase()).first();
      return user;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async create(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const [user] = await db('users')
        .insert({
          id: uuidv4(),
          email: userData.email.toLowerCase(),
          password_hash: hashedPassword,
          name: userData.name,
          role: userData.role || 'viewer',
          department: userData.department,
          phone: userData.phone,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      delete user[0].password_hash;
      return user[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      // Remove sensitive fields that shouldn't be updated directly
      const { password_hash, email_verified, email_verified_at, ...safeData } = updateData;
      
      // Hash password if it's being updated
      if (updateData.password) {
        safeData.password_hash = await bcrypt.hash(updateData.password, 12);
        safeData.password_changed_at = new Date();
      }

      safeData.updated_at = new Date();

      const [user] = await db('users')
        .where('id', id)
        .update(safeData)
        .returning('*');

      if (user) {
        delete user.password_hash;
      }
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  static async updateLastLogin(id) {
    try {
      await db('users')
        .where('id', id)
        .update({
          last_login: new Date(),
          updated_at: new Date()
        });
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }

  static async verifyEmail(id) {
    try {
      const [user] = await db('users')
        .where('id', id)
        .update({
          email_verified: true,
          email_verified_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      if (user) {
        delete user.password_hash;
      }
      return user;
    } catch (error) {
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  static async changePassword(id, currentPassword, newPassword) {
    try {
      const user = await db('users').where('id', id).first();
      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      
      await db('users')
        .where('id', id)
        .update({
          password_hash: hashedNewPassword,
          password_changed_at: new Date(),
          updated_at: new Date()
        });

      return true;
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  static async deactivate(id) {
    try {
      await db('users')
        .where('id', id)
        .update({
          is_active: false,
          updated_at: new Date()
        });
      return true;
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  static async activate(id) {
    try {
      await db('users')
        .where('id', id)
        .update({
          is_active: true,
          updated_at: new Date()
        });
      return true;
    } catch (error) {
      logger.error('Error activating user:', error);
      throw error;
    }
  }

  static async validatePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Error validating password:', error);
      return false;
    }
  }

  static generateTokens(user) {
    try {
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      };

      const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      });

      const refreshToken = jwt.sign(
        { id: user.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
      );

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Error generating tokens:', error);
      throw error;
    }
  }

  static async verifyToken(token, secret = process.env.JWT_SECRET) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      logger.error('Error verifying token:', error);
      return null;
    }
  }

  static async findAll(filters = {}) {
    try {
      let query = db('users').select('*');

      if (filters.role) {
        query = query.where('role', filters.role);
      }

      if (filters.department) {
        query = query.where('department', filters.department);
      }

      if (filters.is_active !== undefined) {
        query = query.where('is_active', filters.is_active);
      }

      if (filters.search) {
        query = query.where(function() {
          this.where('name', 'ilike', `%${filters.search}%`)
            .orWhere('email', 'ilike', `%${filters.search}%`);
        });
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const offset = (page - 1) * limit;

      const total = await query.clone().count('* as total').first();
      const users = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Remove password hashes from response
      users.forEach(user => delete user.password_hash);

      return {
        users,
        pagination: {
          page,
          limit,
          total: parseInt(total.total),
          totalPages: Math.ceil(total.total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding users:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const deleted = await db('users').where('id', id).del();
      return deleted > 0;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = User;
