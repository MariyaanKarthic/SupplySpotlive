-- Supplier Spot Database Setup Script
-- PostgreSQL 12+ required

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE supplier_spot'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'supplier_spot')\gexec

-- Connect to the database
\c supplier_spot

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin',
        'procurement_manager', 
        'finance_manager', 
        'ap_clerk', 
        'supplier', 
        'viewer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vendor_status AS ENUM (
        'active',
        'under_review',
        'rejected',
        'inactive',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM (
        'draft',
        'submitted',
        'pending_approval',
        'approved',
        'rejected',
        'paid',
        'overdue'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_status AS ENUM (
        'submitted',
        'assigned',
        'investigating',
        'pending_supplier',
        'pending_internal',
        'resolved',
        'closed',
        'escalated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_priority AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vendor_category AS ENUM (
        'technology',
        'manufacturing',
        'services',
        'materials',
        'logistics',
        'consulting',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_category AS ENUM (
        'invoice_discrepancy',
        'payment_delay',
        'delivery_issue',
        'quality_issue',
        'po_issue',
        'contract_dispute',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'scheduled',
        'processing',
        'processed',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_method AS ENUM (
        'e_invoice',
        'ocr_scan',
        'manual_entry',
        'email',
        'portal'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON vendors(created_at);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_po_number ON invoices(po_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

CREATE INDEX IF NOT EXISTS idx_disputes_number ON disputes(dispute_number);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_category ON disputes(category);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes(priority);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_vendors_name_fts ON vendors USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_vendors_description_fts ON vendors USING gin(to_tsvector('english', COALESCE(description, '')));

-- Create trigger functions for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs(table_name, operation, user_id, old_data, new_data, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.created_by, NULL, row_to_json(NEW), CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs(table_name, operation, user_id, old_data, new_data, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.updated_by, row_to_json(OLD), row_to_json(NEW), CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs(table_name, operation, user_id, old_data, new_data, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.updated_by, row_to_json(OLD), NULL, CURRENT_TIMESTAMP);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create user-defined functions for common operations

-- Function to generate dispute numbers
CREATE OR REPLACE FUNCTION generate_dispute_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(dispute_number FROM 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM disputes
    WHERE dispute_number LIKE 'DISP-' || year_part || '%';
    
    RETURN 'DISP-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_part || '%';
    
    RETURN 'INV-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 4) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM purchase_orders
    WHERE po_number LIKE 'PO-' || year_part || '%';
    
    RETURN 'PO-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate vendor risk score
CREATE OR REPLACE FUNCTION calculate_vendor_risk(vendor_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    risk_score DECIMAL(3,2);
    dispute_count INTEGER;
    total_disputes INTEGER;
    avg_resolution_time DECIMAL;
BEGIN
    -- Count disputes for this vendor
    SELECT COUNT(*), AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)
    INTO dispute_count, avg_resolution_time
    FROM disputes
    WHERE submitted_by->>'id' = vendor_uuid::TEXT
    AND resolved_at IS NOT NULL;
    
    -- Get total disputes for comparison
    SELECT COUNT(*)
    INTO total_disputes
    FROM disputes;
    
    -- Calculate risk score (0-100, lower is better)
    risk_score := CASE 
        WHEN total_disputes = 0 THEN 0
        ELSE (dispute_count::DECIMAL / total_disputes::DECIMAL) * 50 + 
             COALESCE(avg_resolution_time, 0) / 24 * 50 -- 24 hours = max score
    END;
    
    RETURN LEAST(risk_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to get vendor statistics
CREATE OR REPLACE FUNCTION get_vendor_statistics(vendor_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_invoices', (SELECT COUNT(*) FROM invoices WHERE vendor_id = vendor_uuid),
        'total_amount', (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE vendor_id = vendor_uuid),
        'paid_invoices', (SELECT COUNT(*) FROM invoices WHERE vendor_id = vendor_uuid AND status = 'paid'),
        'pending_invoices', (SELECT COUNT(*) FROM invoices WHERE vendor_id = vendor_uuid AND status IN ('submitted', 'pending_approval')),
        'overdue_invoices', (SELECT COUNT(*) FROM invoices WHERE vendor_id = vendor_uuid AND due_date < CURRENT_DATE AND status != 'paid'),
        'dispute_count', (SELECT COUNT(*) FROM disputes WHERE submitted_by->>'id' = vendor_uuid::TEXT),
        'risk_score', calculate_vendor_risk(vendor_uuid)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create views for common queries

-- Vendor summary view
CREATE OR REPLACE VIEW vendor_summary AS
SELECT 
    v.id,
    v.name,
    v.category,
    v.status,
    v.total_spend,
    v.rating,
    v.onboard_date,
    COALESCE(inv_stats.total_invoices, 0) as total_invoices,
    COALESCE(inv_stats.total_amount, 0) as total_invoice_amount,
    COALESCE(inv_stats.paid_invoices, 0) as paid_invoices,
    COALESCE(inv_stats.pending_invoices, 0) as pending_invoices,
    COALESCE(inv_stats.overdue_invoices, 0) as overdue_invoices,
    COALESCE(dispute_stats.dispute_count, 0) as dispute_count,
    calculate_vendor_risk(v.id) as risk_score
FROM vendors v
LEFT JOIN (
    SELECT 
        vendor_id,
        COUNT(*) as total_invoices,
        SUM(amount) as total_amount,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
        COUNT(*) FILTER (WHERE status IN ('submitted', 'pending_approval')) as pending_invoices,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'paid') as overdue_invoices
    FROM invoices
    GROUP BY vendor_id
) inv_stats ON v.id = inv_stats.vendor_id
LEFT JOIN (
    SELECT 
        submitted_by->>'id'::UUID as vendor_id,
        COUNT(*) as dispute_count
    FROM disputes
    WHERE submitted_by->>'id' IS NOT NULL
    GROUP BY submitted_by->>'id'
) dispute_stats ON v.id = dispute_stats.vendor_id;

-- Active disputes view
CREATE OR REPLACE VIEW active_disputes AS
SELECT 
    d.*,
    CASE 
        WHEN d.sla_details->>'targetResolution'::TIMESTAMP < CURRENT_TIMESTAMP THEN true
        ELSE false
    END as is_overdue,
    EXTRACT(EPOCH FROM (d.sla_details->>'targetResolution'::TIMESTAMP - CURRENT_TIMESTAMP))/3600 as hours_remaining
FROM disputes d
WHERE d.status NOT IN ('resolved', 'closed');

-- Invoice aging report view
CREATE OR REPLACE VIEW invoice_aging_report AS
SELECT 
    i.id,
    i.invoice_number,
    i.vendor_id,
    v.name as vendor_name,
    i.amount,
    i.due_date,
    i.status,
    CASE 
        WHEN i.due_date < CURRENT_DATE THEN 
            EXTRACT(DAYS FROM CURRENT_DATE - i.due_date)
        ELSE 0
    END as days_overdue,
    CASE 
        WHEN i.due_date < CURRENT_DATE AND i.status != 'paid' THEN 'Overdue'
        WHEN i.status = 'paid' THEN 'Paid'
        WHEN i.due_date >= CURRENT_DATE AND i.status IN ('submitted', 'pending_approval') THEN 'Pending'
        ELSE 'Other'
    END as aging_status
FROM invoices i
JOIN vendors v ON i.vendor_id = v.id
WHERE i.status != 'draft';

-- Grant permissions (adjust as needed for your setup)
-- These would typically be run by a database administrator
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supplier_spot_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supplier_spot_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO supplier_spot_user;

COMMIT;
