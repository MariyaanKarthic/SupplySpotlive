/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('invoices').del();

  // Insert sample invoices
  await knex('invoices').insert([
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      invoice_number: 'INV-2024-0001',
      vendor_id: 'b0000000-0000-0000-0000-000000000001',
      amount: 12500.00,
      tax_amount: 1250.00,
      net_amount: 13750.00,
      due_date: new Date('2024-02-15'),
      issue_date: new Date('2024-01-15'),
      payment_date: new Date('2024-02-10'),
      status: 'paid',
      description: 'Software licensing Q4 2023',
      category: 'Technology',
      submission_method: 'e_invoice',
      po_number: 'PO-2024-001',
      grn_number: 'GRN-2024-001',
      matching_status: 'Matched',
      ocr_confidence: 98,
      extracted_data: true,
      line_items: JSON.stringify([
        {
          description: 'Enterprise Software License - Annual',
          quantity: 1,
          unitPrice: 10000.00,
          amount: 10000.00
        },
        {
          description: 'Technical Support Services',
          quantity: 12,
          unitPrice: 208.33,
          amount: 2500.00
        }
      ]),
      approved_by: 'a0000000-0000-0000-0000-000000000003',
      created_by: 'a0000000-0000-0000-0000-000000000004',
      updated_by: 'a0000000-0000-0000-0000-000000000004',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-02-10')
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      invoice_number: 'INV-2024-0002',
      vendor_id: 'b0000000-0000-0000-0000-000000000002',
      amount: 89000.00,
      tax_amount: 8900.00,
      net_amount: 97900.00,
      due_date: new Date('2024-03-20'),
      issue_date: new Date('2024-02-20'),
      status: 'approved',
      description: 'Industrial components bulk order',
      category: 'Manufacturing',
      submission_method: 'manual_entry',
      po_number: 'PO-2024-002',
      grn_number: 'GRN-2024-002',
      matching_status: 'Matched',
      ocr_confidence: 95,
      extracted_data: true,
      line_items: JSON.stringify([
        {
          description: 'Steel Components - Type A',
          quantity: 1000,
          unitPrice: 50.00,
          amount: 50000.00
        },
        {
          description: 'Assembly Parts - Type B',
          quantity: 500,
          unitPrice: 78.00,
          amount: 39000.00
        }
      ]),
      approved_by: 'a0000000-0000-0000-0000-000000000003',
      created_by: 'a0000000-0000-0000-0000-000000000004',
      updated_by: 'a0000000-0000-0000-0000-000000000003',
      created_at: new Date('2024-02-20'),
      updated_at: new Date('2024-02-25')
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      invoice_number: 'INV-2024-0003',
      vendor_id: 'b0000000-0000-0000-0000-000000000003',
      amount: 45000.00,
      tax_amount: 4500.00,
      net_amount: 49500.00,
      due_date: new Date('2024-04-10'),
      issue_date: new Date('2024-03-10'),
      status: 'pending_approval',
      description: 'Business consulting services Q1 2024',
      category: 'Services',
      submission_method: 'email',
      po_number: 'PO-2024-003',
      grn_number: null,
      matching_status: 'Partial Match',
      ocr_confidence: 88,
      extracted_data: true,
      line_items: JSON.stringify([
        {
          description: 'Strategic Planning Consulting',
          quantity: 40,
          unitPrice: 500.00,
          amount: 20000.00
        },
        {
          description: 'Process Optimization Services',
          quantity: 50,
          unitPrice: 500.00,
          amount: 25000.00
        }
      ]),
      approved_by: null,
      created_by: 'a0000000-0000-0000-0000-000000000004',
      updated_by: 'a0000000-0000-0000-0000-000000000004',
      created_at: new Date('2024-03-10'),
      updated_at: new Date('2024-03-10')
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      invoice_number: 'INV-2024-0004',
      vendor_id: 'b0000000-0000-0000-0000-000000000005',
      amount: 67000.00,
      tax_amount: 6700.00,
      net_amount: 73700.00,
      due_date: new Date('2024-01-12'),
      issue_date: new Date('2023-12-12'),
      status: 'overdue',
      description: 'Logistics and transportation services',
      category: 'Logistics',
      submission_method: 'portal',
      po_number: 'PO-2024-004',
      grn_number: 'GRN-2024-003',
      matching_status: 'Matched',
      ocr_confidence: 92,
      extracted_data: true,
      line_items: JSON.stringify([
        {
          description: 'International Freight Services',
          quantity: 10,
          unitPrice: 3000.00,
          amount: 30000.00
        },
        {
          description: 'Local Transportation Services',
          quantity: 50,
          unitPrice: 740.00,
          amount: 37000.00
        }
      ]),
      approved_by: 'a0000000-0000-0000-0000-000000000003',
      created_by: 'a0000000-0000-0000-0000-000000000004',
      updated_by: 'a0000000-0000-0000-0000-000000000004',
      created_at: new Date('2023-12-12'),
      updated_at: new Date('2024-01-15')
    },
    {
      id: 'c0000000-0000-0000-0000-000000000005',
      invoice_number: 'INV-2024-0005',
      vendor_id: 'b0000000-0000-0000-0000-000000000001',
      amount: 25000.00,
      tax_amount: 2500.00,
      net_amount: 27500.00,
      due_date: new Date('2024-04-25'),
      issue_date: new Date('2024-03-25'),
      status: 'submitted',
      description: 'Cloud infrastructure services Q1 2024',
      category: 'Technology',
      submission_method: 'ocr_scan',
      po_number: 'PO-2024-005',
      grn_number: null,
      matching_status: 'Pending Match',
      ocr_confidence: 85,
      extracted_data: true,
      line_items: JSON.stringify([
        {
          description: 'Cloud Storage Services',
          quantity: 1,
          unitPrice: 15000.00,
          amount: 15000.00
        },
        {
          description: 'Cloud Computing Resources',
          quantity: 1,
          unitPrice: 10000.00,
          amount: 10000.00
        }
      ]),
      approved_by: null,
      created_by: 'a0000000-0000-0000-0000-000000000004',
      updated_by: 'a0000000-0000-0000-0000-000000000004',
      created_at: new Date('2024-03-25'),
      updated_at: new Date('2024-03-25')
    }
  ]);
};
