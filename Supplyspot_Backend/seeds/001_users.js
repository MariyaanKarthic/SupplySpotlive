const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();

  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  // Insert sample users
  await knex('users').insert([
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'admin@supplierspot.com',
      password_hash: defaultPasswordHash, // password123
      name: 'System Administrator',
      role: 'admin',
      department: 'IT',
      phone: '+1-555-0100',
      is_active: true,
      email_verified: true,
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      email: 'procurement.manager@supplierspot.com',
      password_hash: defaultPasswordHash, // password123
      name: 'John Smith',
      role: 'procurement_manager',
      department: 'Procurement',
      phone: '+1-555-0101',
      is_active: true,
      email_verified: true,
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      email: 'finance.manager@supplierspot.com',
      password_hash: defaultPasswordHash, // password123
      name: 'Sarah Johnson',
      role: 'finance_manager',
      department: 'Finance',
      phone: '+1-555-0102',
      is_active: true,
      email_verified: true,
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000004',
      email: 'ap.clerk@supplierspot.com',
      password_hash: defaultPasswordHash, // password123
      name: 'Mike Wilson',
      role: 'ap_clerk',
      department: 'Accounts Payable',
      phone: '+1-555-0103',
      is_active: true,
      email_verified: true,
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000005',
      email: 'supplier@techcorp.com',
      password_hash: defaultPasswordHash, // password123
      name: 'TechCorp Representative',
      role: 'supplier',
      department: 'External',
      phone: '+1-555-0104',
      is_active: true,
      email_verified: true,
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000006',
      email: 'viewer@supplierspot.com',
      password_hash: defaultPasswordHash, // password123
      name: 'Jane Doe',
      role: 'viewer',
      department: 'Management',
      phone: '+1-555-0105',
      is_active: true,
      email_verified: true,
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};

