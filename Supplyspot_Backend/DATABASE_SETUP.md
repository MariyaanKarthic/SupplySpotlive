# Database Setup Instructions

## 🚀 **Quick Setup Guide**

### **Prerequisites**
- PostgreSQL 12+ installed and running
- Node.js 18+ installed
- Redis (optional, for caching)

### **Step 1: Database Creation**

#### **Option A: Using PostgreSQL CLI**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE supplier_spot;

-- Create user
CREATE USER supplier_spot_user WITH PASSWORD 'password123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE supplier_spot TO supplier_spot_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supplier_spot_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supplier_spot_user;

-- Exit
\q
```

#### **Option B: Using Setup Script (Linux/Mac)**
```bash
# Make script executable
chmod +x scripts/create-database.sh

# Run setup script
./scripts/create-database.sh --with-sample-data
```

#### **Option C: Using pgAdmin**
1. Open pgAdmin
2. Create new database: `supplier_spot`
3. Create new login role: `supplier_spot_user` with password `password123`
4. Grant all privileges to the user

### **Step 2: Run Migrations**

```bash
# Navigate to backend directory
cd backend

# Run database migrations
npx knex migrate:latest

# Run seed data (optional)
npx knex seed:run
```

### **Step 3: Verify Setup**

```bash
# Test database connection
npx knex raw:select 1

# Check tables
npx knex raw:SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
```

### **Step 4: Start Development Server**

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

## 🔧 **Configuration**

### **Environment Variables**
Update your `.env` file with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=supplier_spot
DB_USER=supplier_spot_user
DB_PASSWORD=password123
SSL=false
```

### **Connection String**
```
postgresql://supplier_spot_user:password123@localhost:5432/supplier_spot
```

## 📊 **Database Schema**

### **Core Tables**
- **users** - User accounts and authentication
- **vendors** - Vendor information and profiles
- **invoices** - Invoice management
- **disputes** - Dispute resolution tracking
- **purchase_orders** - Purchase order management
- **payments** - Payment processing
- **documents** - Document storage and metadata

### **Supporting Tables**
- **audit_logs** - Audit trail for compliance
- **notifications** - System notifications
- **settings** - Application configuration

## 🛠️ **Database Features**

### **Extensions**
- `uuid-ossp` - UUID generation
- `pg_trgm` - Trigram similarity for search
- `btree_gin` - GIN index improvements

### **Functions**
- `generate_dispute_number()` - Auto-generate dispute numbers
- `generate_invoice_number()` - Auto-generate invoice numbers
- `calculate_vendor_risk()` - Calculate vendor risk scores
- `get_vendor_statistics()` - Get vendor performance metrics

### **Views**
- `vendor_summary` - Vendor performance overview
- `active_disputes` - Currently active disputes
- `invoice_aging_report` - Invoice aging analysis

### **Indexes**
- Performance indexes on frequently queried columns
- Full-text search indexes for vendor names and descriptions
- Composite indexes for complex queries

## 🔄 **Migration Management**

### **Create New Migration**
```bash
npx knex migrate:make create_new_table
```

### **Rollback Migration**
```bash
npx knex migrate:rollback
```

### **List Migrations**
```bash
npx knex migrate:list
```

### **Reset Database**
```bash
npx knex migrate:rollback:all
npx knex migrate:latest
npx knex seed:run
```

## 🌱 **Seed Data**

### **Available Seeds**
- `001_users.js` - Sample users with different roles
- `002_vendors.js` - Sample vendor data
- `003_invoices.js` - Sample invoice records
- `004_disputes.js` - Sample dispute cases

### **Run Seeds**
```bash
# Run all seeds
npx knex seed:run

# Run specific seed
npx knex seed:run --specific=001_users.js
```

### **Default Users**
All sample users have password: `password123`

- **admin@supplierspot.com** - System Administrator
- **procurement.manager@supplierspot.com** - Procurement Manager
- **finance.manager@supplierspot.com** - Finance Manager
- **ap.clerk@supplierspot.com** - Accounts Payable Clerk
- **supplier@techcorp.com** - Supplier Representative
- **viewer@supplierspot.com** - Read-only User

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Connection Refused**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL service (Linux/Mac)
sudo systemctl start postgresql

# Start PostgreSQL service (Windows)
net start postgresql-x64-14
```

#### **Permission Denied**
```sql
-- Grant proper permissions
GRANT ALL PRIVILEGES ON DATABASE supplier_spot TO supplier_spot_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supplier_spot_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supplier_spot_user;
```

#### **Migration Errors**
```bash
# Check current migration status
npx knex migrate:list

# Rollback and retry
npx knex migrate:rollback
npx knex migrate:latest
```

#### **Seed Errors**
```bash
# Clear tables and reseed
npx knex seed:run --env=development
```

### **Database Health Check**

```sql
-- Check table counts
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check data counts
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'vendors' as table_name, COUNT(*) as record_count FROM vendors
UNION ALL
SELECT 'invoices' as table_name, COUNT(*) as record_count FROM invoices
UNION ALL
SELECT 'disputes' as table_name, COUNT(*) as record_count FROM disputes;
```

## 📈 **Performance Optimization**

### **Recommended Settings**
```sql
-- PostgreSQL performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();
```

### **Index Analysis**
```sql
-- Check unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename, indexname;
```

## 🔒 **Security Considerations**

### **Best Practices**
1. Use strong passwords for database users
2. Enable SSL connections in production
3. Regular database backups
4. Limit database user permissions
5. Enable PostgreSQL logging
6. Monitor database connections

### **Backup Strategy**
```bash
# Create backup
pg_dump -h localhost -U supplier_spot_user supplier_spot > backup.sql

# Restore backup
psql -h localhost -U supplier_spot_user supplier_spot < backup.sql
```

## 📞 **Support**

If you encounter issues:

1. Check PostgreSQL service status
2. Verify connection parameters in `.env`
3. Review migration logs
4. Check database permissions
5. Consult troubleshooting section above

For additional support, refer to:
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Knex.js documentation: https://knexjs.org/
- Application logs in `logs/` directory
