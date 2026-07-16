#!/bin/bash

# Supplier Spot Database Setup Script
# This script creates the PostgreSQL database and user

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-supplier_spot}
DB_USER=${DB_USER:-supplier_spot_user}
DB_PASSWORD=${DB_PASSWORD:-password123}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}

echo -e "${GREEN}🚀 Supplier Spot Database Setup${NC}"
echo "=================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is running
check_postgres() {
    if pg_isready -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Create database user
create_user() {
    print_status "Creating database user: $DB_USER"
    
    psql -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER -c "DO \$\$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';
        RAISE NOTICE 'User $DB_USER created successfully';
    ELSE
        RAISE NOTICE 'User $DB_USER already exists';
    END IF;
END
\$\$;" || {
        print_error "Failed to create database user"
        exit 1
    }
    
    print_status "Database user created/verified successfully"
}

# Create database
create_database() {
    print_status "Creating database: $DB_NAME"
    
    psql -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER -c "DO \$\$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
        CREATE DATABASE $DB_NAME OWNER $DB_USER;
        RAISE NOTICE 'Database $DB_NAME created successfully';
    ELSE
        RAISE NOTICE 'Database $DB_NAME already exists';
    END IF;
END
\$\$;" || {
        print_error "Failed to create database"
        exit 1
    }
    
    print_status "Database created/verified successfully"
}

# Grant privileges
grant_privileges() {
    print_status "Granting privileges to user: $DB_USER"
    
    psql -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER -d $DB_NAME -c "DO \$\$$
BEGIN
    -- Grant all privileges on all tables
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO $DB_USER;
    
    -- Grant usage on schema
    GRANT USAGE ON SCHEMA public TO $DB_USER;
    
    RAISE NOTICE 'Privileges granted successfully';
END
\$\$;" || {
        print_error "Failed to grant privileges"
        exit 1
    }
    
    print_status "Privileges granted successfully"
}

# Run setup SQL script
run_setup_script() {
    print_status "Running database setup script..."
    
    if [ -f "./scripts/setup-database.sql" ]; then
        PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER -d $DB_NAME -f ./scripts/setup-database.sql || {
            print_error "Failed to run setup script"
            exit 1
        }
        print_status "Database setup script completed successfully"
    else
        print_error "Setup script not found at ./scripts/setup-database.sql"
        exit 1
    fi
}

# Verify setup
verify_setup() {
    print_status "Verifying database setup..."
    
    # Check if tables exist
    table_count=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null)
    
    if [ "$table_count" -gt 0 ]; then
        print_status "Database setup verified - $table_count tables found"
    else
        print_error "Database setup verification failed - no tables found"
        exit 1
    fi
    
    # Test connection with application user
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
        print_status "Application user connection verified"
    else
        print_error "Application user connection failed"
        exit 1
    fi
}

# Create sample data (optional)
create_sample_data() {
    if [ "$1" = "--with-sample-data" ]; then
        print_status "Creating sample data..."
        
        # This would run seed files
        npm run seed || {
            print_warning "Sample data creation failed, but database is ready"
        }
    fi
}

# Main execution
main() {
    echo "Database Configuration:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    
    # Check if PostgreSQL is running
    if ! check_postgres; then
        print_error "PostgreSQL is not running or not accessible"
        echo "Please start PostgreSQL service or check connection parameters"
        exit 1
    fi
    
    print_status "PostgreSQL is running and accessible"
    
    # Execute setup steps
    create_user
    create_database
    grant_privileges
    run_setup_script
    verify_setup
    create_sample_data $1
    
    echo ""
    print_status "🎉 Database setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with the database credentials"
    echo "2. Run 'npm run migrate' to apply any pending migrations"
    echo "3. Run 'npm run dev' to start the development server"
    echo ""
    echo "Database connection string for .env:"
    echo "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
}

# Help function
show_help() {
    echo "Supplier Spot Database Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --with-sample-data    Create sample data after setup"
    echo "  --help              Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DB_HOST             PostgreSQL host (default: localhost)"
    echo "  DB_PORT             PostgreSQL port (default: 5432)"
    echo "  DB_NAME             Database name (default: supplier_spot)"
    echo "  DB_USER             Database user (default: supplier_spot_user)"
    echo "  DB_PASSWORD         Database password (default: password123)"
    echo "  POSTGRES_USER       PostgreSQL admin user (default: postgres)"
    echo "  POSTGRES_PASSWORD   PostgreSQL admin password (default: postgres)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Setup with defaults"
    echo "  $0 --with-sample-data                # Setup with sample data"
    echo "  DB_HOST=localhost DB_PORT=5432 $0     # Custom host and port"
}

# Parse command line arguments
case "$1" in
    --help|-h)
        show_help
        exit 0
        ;;
    *)
        main $1
        ;;
esac
