# Supplier Spot Backend API

A comprehensive REST API for the Supplier Spot supplier management system built with Express.js.

## 🚀 **Features**

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Vendor Management**: Complete vendor lifecycle management
- **Invoice Processing**: Invoice workflow with OCR support
- **Dispute Management**: Full dispute resolution system
- **Real-time Capabilities**: Redis caching and WebSocket support
- **File Management**: Secure file upload with cloud storage
- **Analytics & Reporting**: Comprehensive business insights
- **Security**: Rate limiting, input validation, audit logging
- **API Documentation**: Swagger/OpenAPI documentation

## 🛠️ **Technology Stack**

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: PostgreSQL with Knex.js migrations
- **Cache**: Redis for session management and caching
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 integration
- **Validation**: Express-validator
- **Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston with structured logging

## 📋 **Prerequisites**

- Node.js 18.0.0 or higher
- PostgreSQL 12.0 or higher
- Redis 6.0 or higher
- npm 8.0.0 or higher

## 🚀 **Installation & Setup**

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd supplier-spot-backend
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Database Setup

```bash
# Create database
createdb supplier_spot

# Run migrations
npm run migrate

# (Optional) Seed with sample data
npm run seed
```

### 4. Start Development Server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

## 📁 **Project Structure**

```
backend/
├── config/                 # Configuration files
│   ├── database.js         # Database connection and configuration
│   ├── redis.js           # Redis connection and utilities
│   ├── logger.js          # Winston logging configuration
│   └── swagger.js         # API documentation setup
├── middleware/             # Express middleware
│   ├── auth.js            # Authentication & authorization
│   ├── errorHandler.js    # Global error handling
│   └── notFound.js       # 404 handler
├── migrations/             # Database migrations
│   ├── 001_create_users_table.js
│   ├── 002_create_vendors_table.js
│   ├── 003_create_invoices_table.js
│   └── 004_create_disputes_table.js
├── models/                 # Data models
│   ├── User.js
│   ├── Vendor.js
│   ├── Invoice.js
│   └── Dispute.js
├── routes/                 # API routes
│   ├── auth.js            # Authentication endpoints
│   ├── vendors.js         # Vendor management
│   ├── invoices.js        # Invoice processing
│   ├── disputes.js        # Dispute management
│   └── [other modules...]
├── services/               # Business logic services
│   ├── emailService.js    # Email notifications
│   ├── fileService.js     # File upload/processing
│   └── ocrService.js      # OCR processing
├── utils/                  # Utility functions
│   ├── helpers.js         # Common utilities
│   ├── validators.js      # Custom validators
│   └── constants.js       # Application constants
├── logs/                   # Log files
├── uploads/                 # Temporary file uploads
├── server.js               # Express server entry point
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## 🔐 **Authentication**

The API uses JWT (JSON Web Tokens) for authentication:

### Login Endpoint
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### Using the Token
```http
Authorization: Bearer <access_token>
```

## 📚 **API Documentation**

Once the server is running, visit:
- **API Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## 🔧 **Available Endpoints**

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/change-password` - Change password

### Vendors
- `GET /api/v1/vendors` - List vendors (with pagination/filters)
- `GET /api/v1/vendors/:id` - Get vendor by ID
- `POST /api/v1/vendors` - Create new vendor
- `PUT /api/v1/vendors/:id` - Update vendor
- `DELETE /api/v1/vendors/:id` - Delete vendor

### Invoices
- `GET /api/v1/invoices` - List invoices
- `GET /api/v1/invoices/:id` - Get invoice by ID
- `POST /api/v1/invoices` - Create invoice
- `PUT /api/v1/invoices/:id` - Update invoice
- `POST /api/v1/invoices/:id/approve` - Approve invoice
- `POST /api/v1/invoices/ocr-process` - Process invoice with OCR

### Disputes
- `GET /api/v1/disputes` - List disputes
- `GET /api/v1/disputes/:id` - Get dispute by ID
- `POST /api/v1/disputes` - Create dispute
- `PUT /api/v1/disputes/:id` - Update dispute
- `POST /api/v1/disputes/:id/assign` - Assign dispute
- `POST /api/v1/disputes/:id/resolve` - Resolve dispute

## 🎯 **User Roles & Permissions**

| Role | Description | Permissions |
|------|-------------|--------------|
| `admin` | System administrator | Full access to all features |
| `procurement_manager` | Procurement department | Vendor management, POs, RFQs |
| `finance_manager` | Finance department | Invoices, payments, approvals |
| `ap_clerk` | Accounts payable | Invoice processing, payments |
| `supplier` | External supplier | Limited access to own data |
| `viewer` | Read-only access | View-only permissions |

## 🔍 **Query Parameters**

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

### Filtering
- `search` - Text search across multiple fields
- `status` - Filter by status
- `category` - Filter by category
- `dateFrom` - Filter by start date
- `dateTo` - Filter by end date

### Sorting
- `sortBy` - Field to sort by
- `sortOrder` - Sort order: `asc` or `desc`

## 📊 **Response Format**

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details (development only)
  }
}
```

## 🛡️ **Security Features**

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions by user role
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Proper cross-origin handling
- **Security Headers**: Helmet.js security middleware
- **Audit Logging**: Complete audit trail
- **Password Security**: Bcrypt hashing with salt

## 📝 **Logging**

The application uses Winston for structured logging:

- **Access Logs**: HTTP requests and responses
- **Error Logs**: Application errors and exceptions
- **Security Logs**: Authentication failures, unauthorized access
- **Audit Logs**: Business actions and data changes
- **Performance Logs**: Slow operations and performance metrics

Log files are stored in the `logs/` directory:
- `combined.log` - All log entries
- `error.log` - Error-only entries

## 🚀 **Development**

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Database Migrations
```bash
# Run pending migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Create new migration
npx knex migrate:make migration_name
```

### Seeding Data
```bash
# Run all seed files
npm run seed
```

## 📦 **Deployment**

### Environment Variables
Key environment variables for production:

```bash
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_NAME=supplier_spot
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-super-secret-jwt-key
REDIS_HOST=your-redis-host
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-s3-bucket
```

### PM2 Process Management
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "supplier-spot-api"

# Monitor
pm2 monit

# View logs
pm2 logs supplier-spot-api
```

## 🐛 **Troubleshooting**

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection string in .env
   - Check firewall settings

2. **Redis Connection Failed**
   - Ensure Redis server is running
   - Verify Redis configuration
   - Check network connectivity

3. **JWT Token Invalid**
   - Check JWT_SECRET in .env
   - Verify token format
   - Check token expiration

4. **File Upload Fails**
   - Check upload directory permissions
   - Verify file size limits
   - Check AWS S3 credentials

### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

## 📞 **Support**

For support and questions:
- **Email**: support@supplierspot.com
- **Documentation**: https://docs.supplierspot.com
- **Issues**: https://github.com/supplierspot/backend/issues

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.
