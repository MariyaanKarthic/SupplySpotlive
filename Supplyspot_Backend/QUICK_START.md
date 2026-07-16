# 🚀 Quick Start Guide

## Database Setup Options

### **Option 1: Docker (Easiest)**

1. **Install Docker** if not already installed
2. **Start database services**:
   ```bash
   docker-compose up -d
   ```
3. **Run migrations**:
   ```bash
   npx knex migrate:latest
   npx knex seed:run
   ```
4. **Start backend**:
   ```bash
   npm run dev
   ```

### **Option 2: Install PostgreSQL**

#### **Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Install with password: `postgres`
3. After installation, run:
   ```bash
   cd "C:\Program Files\PostgreSQL\16\bin"
   psql -U postgres -c "CREATE DATABASE supplier_spot;"
   psql -U postgres -c "CREATE USER supplier_spot_user WITH PASSWORD 'password123';"
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE supplier_spot TO supplier_spot_user;"
   ```

#### **Alternative: Use Online Database**
- ElephantSQL (free PostgreSQL): https://www.elephantsql.com/
- Supabase (free PostgreSQL): https://supabase.com/
- Get connection string and update `.env`

## After Database Setup

1. **Update .env** (if using external database):
   ```env
   DB_HOST=your-host
   DB_PORT=5432
   DB_NAME=supplier_spot
   DB_USER=supplier_spot_user
   DB_PASSWORD=password123
   ```

2. **Run migrations**:
   ```bash
   npx knex migrate:latest
   ```

3. **Seed data**:
   ```bash
   npx knex seed:run
   ```

4. **Start server**:
   ```bash
   npm run dev
   ```

## Default Users (password: `password123`)

- admin@supplierspot.com (Admin)
- procurement.manager@supplierspot.com (Procurement)
- finance.manager@supplierspot.com (Finance)
- ap.clerk@supplierspot.com (AP Clerk)
- supplier@techcorp.com (Supplier)
- viewer@supplierspot.com (Viewer)

## API Endpoints

- **Server**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/api-docs
- **Login**: POST http://localhost:3000/api/v1/auth/login
