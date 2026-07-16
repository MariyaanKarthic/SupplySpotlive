# 🌐 Online Database Setup (No Installation Required)

## Option 1: ElephantSQL (Recommended)

1. **Sign up**: https://www.elephantsql.com/
2. **Create new database**:
   - Click "Create New Instance"
   - Choose "Tiny Turtle" (free plan)
   - Select region closest to you
   - Name: `supplier-spot`
3. **Get connection details**:
   - Go to your database instance
   - Click "Details"
   - Copy the connection URL

4. **Update .env file**:
   ```env
   # Replace with your ElephantSQL URL
   DB_HOST=your-host.elephantsql.com
   DB_PORT=5432
   DB_NAME=your-db-name
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   SSL=true
   ```

## Option 2: Supabase

1. **Sign up**: https://supabase.com/
2. **Create new project**:
   - Click "New Project"
   - Organization: Your name
   - Project: `supplier-spot`
   - Database Password: Create a strong password
3. **Get connection details**:
   - Go to Settings → Database
   - Copy connection string
   - Format: `postgresql://[user]:[password]@[host]:[port]/[dbname]`

4. **Update .env file**:
   ```env
   # Extract from Supabase connection string
   DB_HOST=your-project.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your-password
   SSL=true
   ```

## Option 3: Neon (Modern PostgreSQL)

1. **Sign up**: https://neon.tech/
2. **Create new project**:
   - Click "New Project"
   - Name: `supplier-spot`
   - Region: Choose nearest
3. **Get connection string**:
   - Copy the connection string from dashboard

## After Setup

1. **Test connection**:
   ```bash
   npx knex migrate:latest
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

## Quick Test

After setting up your online database, test the connection:

```bash
# In backend directory
npx knex raw:select 1
```

If successful, you'll see:
```
┌─────────┐
│ ?column? │
├─────────┤
│       1 │
└─────────┘
```
