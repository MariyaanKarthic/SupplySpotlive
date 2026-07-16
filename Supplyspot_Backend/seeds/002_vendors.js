/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('vendors').del();

  // Insert sample vendors
  await knex('vendors').insert([
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      name: 'TechCorp Solutions',
      category: 'technology',
      tax_id: '12-3456789',
      registration_number: 'REG-TECH-2023-001',
      website: 'https://techcorp.com',
      description: 'Leading technology solutions provider specializing in enterprise software and cloud services.',
      status: 'active',
      total_spend: 125000.00,
      rating: 4.8,
      contracts_count: 3,
      onboard_date: new Date('2023-01-15'),
      contact_info: JSON.stringify({
        email: 'contact@techcorp.com',
        phone: '+1-555-1001',
        address: '123 Tech Street, San Francisco, CA 94105',
        website: 'https://techcorp.com'
      }),
      bank_details: JSON.stringify({
        bankName: 'Tech Bank',
        accountNumber: '123456789',
        routingNumber: '021000021',
        accountType: 'checking'
      }),
      compliance_info: JSON.stringify({
        taxCertificate: true,
        businessLicense: true,
        insurance: true,
        w9Form: true,
        lastVerified: new Date('2023-12-01')
      }),
      is_active: true,
      created_by: knex.raw("(SELECT id FROM users WHERE email = 'admin@supplierspot.com')"),
      updated_by: knex.raw("(SELECT id FROM users WHERE email = 'admin@supplierspot.com')"),
      created_at: new Date('2023-01-15'),
      updated_at: new Date()
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      name: 'Global Manufacturing Co.',
      category: 'manufacturing',
      tax_id: '45-6789012',
      registration_number: 'REG-MFG-2023-002',
      website: 'https://globalmfg.com',
      description: 'Industrial manufacturing company providing high-quality components and assemblies.',
      status: 'active',
      total_spend: 89000.00,
      rating: 4.2,
      contracts_count: 2,
      onboard_date: new Date('2023-02-20'),
      contact_info: JSON.stringify({
        email: 'orders@globalmfg.com',
        phone: '+1-555-1002',
        address: '456 Industrial Ave, Detroit, MI 48201',
        website: 'https://globalmfg.com'
      }),
      bank_details: JSON.stringify({
        bankName: 'Manufacturing Bank',
        accountNumber: '987654321',
        routingNumber: '021000022',
        accountType: 'checking'
      }),
      compliance_info: JSON.stringify({
        taxCertificate: true,
        businessLicense: true,
        insurance: true,
        w9Form: true,
        lastVerified: new Date('2023-11-15')
      }),
      is_active: true,
      created_by: knex.raw("(SELECT id FROM users WHERE email = 'admin@supplierspot.com')"),
      updated_by: knex.raw("(SELECT id FROM users WHERE email = 'procurement.manager@supplierspot.com')"),
      created_at: new Date('2023-02-20'),
      updated_at: new Date()
    },
    {
      id: 'b0000000-0000-0000-0000-000000000003',
      name: 'Professional Services Ltd.',
      category: 'services',
      tax_id: '78-9012345',
      registration_number: 'REG-SVC-2023-003',
      website: 'https://proservices.com',
      description: 'Professional consulting firm specializing in business process optimization and strategy.',
      status: 'active',
      total_spend: 45000.00,
      rating: 4.6,
      contracts_count: 1,
      onboard_date: new Date('2023-03-10'),
      contact_info: JSON.stringify({
        email: 'info@proservices.com',
        phone: '+1-555-1003',
        address: '789 Business Blvd, New York, NY 10001',
        website: 'https://proservices.com'
      }),
      bank_details: JSON.stringify({
        bankName: 'Business Bank',
        accountNumber: '456789123',
        routingNumber: '021000023',
        accountType: 'checking'
      }),
      compliance_info: JSON.stringify({
        taxCertificate: true,
        businessLicense: true,
        insurance: false,
        w9Form: true,
        lastVerified: new Date('2023-10-20')
      }),
      is_active: true,
      created_by: knex.raw("(SELECT id FROM users WHERE email = 'admin@supplierspot.com')"),
      updated_by: knex.raw("(SELECT id FROM users WHERE email = 'procurement.manager@supplierspot.com')"),
      created_at: new Date('2023-03-10'),
      updated_at: new Date()
    },
    {
      id: 'b0000000-0000-0000-0000-000000000004',
      name: 'Raw Materials Supply Co.',
      category: 'materials',
      tax_id: '23-4567890',
      registration_number: 'REG-MAT-2023-004',
      website: 'https://rawmaterials.com',
      description: 'Supplier of industrial raw materials and components for manufacturing.',
      status: 'under_review',
      total_spend: 0.00,
      rating: 0.0,
      contracts_count: 0,
      onboard_date: new Date('2024-01-05'),
      contact_info: JSON.stringify({
        email: 'sales@rawmaterials.com',
        phone: '+1-555-1004',
        address: '321 Material Way, Houston, TX 77001',
        website: 'https://rawmaterials.com'
      }),
      bank_details: JSON.stringify({
        bankName: 'Materials Bank',
        accountNumber: '789123456',
        routingNumber: '021000024',
        accountType: 'checking'
      }),
      compliance_info: JSON.stringify({
        taxCertificate: true,
        businessLicense: true,
        insurance: false,
        w9Form: false,
        lastVerified: new Date('2024-01-05')
      }),
      is_active: true,
      created_by: knex.raw("(SELECT id FROM users WHERE email = 'procurement.manager@supplierspot.com')"),
      updated_by: knex.raw("(SELECT id FROM users WHERE email = 'procurement.manager@supplierspot.com')"),
      created_at: new Date('2024-01-05'),
      updated_at: new Date()
    },
    {
      id: 'b0000000-0000-0000-0000-000000000005',
      name: 'Logistics Plus Inc.',
      category: 'logistics',
      tax_id: '56-7890123',
      registration_number: 'REG-LOG-2023-005',
      website: 'https://logisticsplus.com',
      description: 'Full-service logistics and transportation company with global reach.',
      status: 'active',
      total_spend: 67000.00,
      rating: 4.4,
      contracts_count: 2,
      onboard_date: new Date('2023-04-12'),
      contact_info: JSON.stringify({
        email: 'dispatch@logisticsplus.com',
        phone: '+1-555-1005',
        address: '654 Transport Rd, Chicago, IL 60601',
        website: 'https://logisticsplus.com'
      }),
      bank_details: JSON.stringify({
        bankName: 'Transport Bank',
        accountNumber: '321654987',
        routingNumber: '021000025',
        accountType: 'checking'
      }),
      compliance_info: JSON.stringify({
        taxCertificate: true,
        businessLicense: true,
        insurance: true,
        w9Form: true,
        lastVerified: new Date('2023-12-10')
      }),
      is_active: true,
      created_by: knex.raw("(SELECT id FROM users WHERE email = 'admin@supplierspot.com')"),
      updated_by: knex.raw("(SELECT id FROM users WHERE email = 'finance.manager@supplierspot.com')"),
      created_at: new Date('2023-04-12'),
      updated_at: new Date()
    }
  ]);
};
