/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('disputes').del();

  // Insert sample disputes
  await knex('disputes').insert([
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      dispute_number: 'DISP-2024-0001',
      title: 'Invoice Amount Mismatch - Unauthorized $750 Freight Charge',
      description: 'Invoice INV-2024-0001 shows total of $12,750 but PO-2024-001 was approved for $12,000. Invoice includes $750 freight charge not specified in original purchase order.',
      category: 'invoice_discrepancy',
      priority: 'high',
      status: 'submitted',
      submitted_by: JSON.stringify({
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'TechCorp Solutions',
        email: 'billing@techcorp.com',
        type: 'supplier',
        company: 'TechCorp Solutions',
        role: 'Billing Manager'
      }),
      assigned_to: JSON.stringify({
        id: 'a0000000-0000-0000-0000-000000000003',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@supplierspot.com',
        type: 'internal',
        department: 'finance'
      }),
      related_documents: JSON.stringify([
        {
          type: 'po',
          number: 'PO-2024-001',
          amount: 12000,
          currency: 'USD'
        },
        {
          type: 'invoice',
          number: 'INV-2024-0001',
          amount: 12750,
          currency: 'USD'
        }
      ]),
      sla_details: JSON.stringify({
        targetResolution: new Date('2024-02-02T17:00:00'),
        escalationDate: new Date('2024-01-30T17:00:00'),
        isOverdue: false,
        hoursRemaining: 48
      }),
      tags: JSON.stringify(['amount-mismatch', 'unauthorized-charges', 'freight-costs', 'urgent']),
      resolution_details: null,
      resolved_at: null,
      created_by: 'a0000000-0000-0000-0000-000000000005',
      updated_by: 'a0000000-0000-0000-0000-000000000005',
      created_at: new Date('2024-01-22T08:15:00'),
      updated_at: new Date('2024-01-22T08:15:00')
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      dispute_number: 'DISP-2024-0002',
      title: 'Payment Delay - Invoice Overdue by 15 Days',
      description: 'Invoice INV-2024-0004 was due on January 12, 2024 but remains unpaid as of January 27, 2024. This is affecting our cash flow and vendor relationship.',
      category: 'payment_delay',
      priority: 'critical',
      status: 'investigating',
      submitted_by: JSON.stringify({
        id: 'b0000000-0000-0000-0000-000000000005',
        name: 'Logistics Plus Inc.',
        email: 'accounts.receivable@logisticsplus.com',
        type: 'supplier',
        company: 'Logistics Plus Inc.',
        role: 'Accounts Receivable Manager'
      }),
      assigned_to: JSON.stringify({
        id: 'a0000000-0000-0000-0000-000000000004',
        name: 'Mike Wilson',
        email: 'mike.wilson@supplierspot.com',
        type: 'internal',
        department: 'ap'
      }),
      related_documents: JSON.stringify([
        {
          type: 'invoice',
          number: 'INV-2024-0004',
          amount: 73700,
          currency: 'USD'
        },
        {
          type: 'po',
          number: 'PO-2024-004',
          amount: 67000,
          currency: 'USD'
        }
      ]),
      sla_details: JSON.stringify({
        targetResolution: new Date('2024-01-31T17:00:00'),
        escalationDate: new Date('2024-01-28T17:00:00'),
        isOverdue: false,
        hoursRemaining: 24
      }),
      tags: JSON.stringify(['payment-delay', 'overdue', 'cash-flow', 'critical']),
      resolution_details: null,
      resolved_at: null,
      created_by: 'a0000000-0000-0000-0000-000000000005',
      updated_by: 'a0000000-0000-0000-0000-000000000004',
      created_at: new Date('2024-01-27T10:30:00'),
      updated_at: new Date('2024-01-28T09:00:00')
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      dispute_number: 'DISP-2024-0003',
      title: 'Quality Issue - Defective Components Received',
      description: 'Received 100 units of steel components from Global Manufacturing Co. with 15% defect rate. Components do not meet quality specifications agreed in contract.',
      category: 'quality_issue',
      priority: 'high',
      status: 'pending_supplier',
      submitted_by: JSON.stringify({
        id: 'a0000000-0000-0000-0000-000000000002',
        name: 'John Smith',
        email: 'john.smith@supplierspot.com',
        type: 'internal',
        company: 'Supplier Spot',
        role: 'Procurement Manager'
      }),
      assigned_to: JSON.stringify({
        id: 'a0000000-0000-0000-0000-000000000002',
        name: 'John Smith',
        email: 'john.smith@supplierspot.com',
        type: 'internal',
        department: 'procurement'
      }),
      related_documents: JSON.stringify([
        {
          type: 'po',
          number: 'PO-2024-002',
          amount: 97900,
          currency: 'USD'
        },
        {
          type: 'grn',
          number: 'GRN-2024-002',
          amount: 89000,
          currency: 'USD'
        }
      ]),
      sla_details: JSON.stringify({
        targetResolution: new Date('2024-02-15T17:00:00'),
        escalationDate: new Date('2024-02-10T17:00:00'),
        isOverdue: false,
        hoursRemaining: 120
      }),
      tags: JSON.stringify(['quality-issue', 'defective-goods', 'return-request', 'high-priority']),
      resolution_details: null,
      resolved_at: null,
      created_by: 'a0000000-0000-0000-0000-000000000002',
      updated_by: 'a0000000-0000-0000-0000-000000000002',
      created_at: new Date('2024-02-05T14:20:00'),
      updated_at: new Date('2024-02-08T11:45:00')
    },
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      dispute_number: 'DISP-2024-0004',
      title: 'Delivery Issue - Late Shipment by 10 Days',
      description: 'Professional Services Ltd. delivered consulting reports 10 days after the agreed deadline. This has impacted our project timeline.',
      category: 'delivery_issue',
      priority: 'medium',
      status: 'resolved',
      submitted_by: JSON.stringify({
        id: 'a0000000-0000-0000-0000-000000000002',
        name: 'John Smith',
        email: 'john.smith@supplierspot.com',
        type: 'internal',
        company: 'Supplier Spot',
        role: 'Procurement Manager'
      }),
      assigned_to: JSON.stringify({
        id: 'a0000000-0000-0000-0000-000000000002',
        name: 'John Smith',
        email: 'john.smith@supplierspot.com',
        type: 'internal',
        department: 'procurement'
      }),
      related_documents: JSON.stringify([
        {
          type: 'po',
          number: 'PO-2024-003',
          amount: 49500,
          currency: 'USD'
        }
      ]),
      sla_details: JSON.stringify({
        targetResolution: new Date('2024-03-20T17:00:00'),
        escalationDate: new Date('2024-03-15T17:00:00'),
        isOverdue: false,
        hoursRemaining: 72
      }),
      tags: JSON.stringify(['delivery-delay', 'timeline-impact', 'project-delay']),
      resolution_details: 'Vendor agreed to provide 15% discount on next invoice and expedited delivery for future projects.',
      resolved_at: new Date('2024-03-18T16:30:00'),
      created_by: 'a0000000-0000-0000-0000-000000000002',
      updated_by: 'a0000000-0000-0000-0000-000000000002',
      created_at: new Date('2024-03-12T09:15:00'),
      updated_at: new Date('2024-03-18T16:30:00')
    },
    {
      id: 'd0000000-0000-0000-0000-000000000005',
      dispute_number: 'DISP-2024-0005',
      title: 'Contract Dispute - Service Level Agreement Violation',
      description: 'TechCorp Solutions failed to meet 99.9% uptime SLA for cloud services. Uptime was only 97.5% in January 2024, causing business disruptions.',
      category: 'contract_dispute',
      priority: 'high',
      status: 'escalated',
      submitted_by: JSON.stringify({
        id: 'a0000000-0000-0000-0000-000000000003',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@supplierspot.com',
        type: 'internal',
        company: 'Supplier Spot',
        role: 'Finance Manager'
      }),
      assigned_to: JSON.stringify({
        id: 'a0000000-0000-0000-0000-000000000001',
        name: 'System Administrator',
        email: 'admin@supplierspot.com',
        type: 'internal',
        department: 'IT'
      }),
      related_documents: JSON.stringify([
        {
          type: 'contract',
          number: 'CONTRACT-TECH-2023',
          amount: 150000,
          currency: 'USD'
        },
        {
          type: 'invoice',
          number: 'INV-2024-0005',
          amount: 27500,
          currency: 'USD'
        }
      ]),
      sla_details: JSON.stringify({
        targetResolution: new Date('2024-04-05T17:00:00'),
        escalationDate: new Date('2024-03-25T17:00:00'),
        isOverdue: true,
        hoursRemaining: -48
      }),
      tags: JSON.stringify(['sla-violation', 'service-disruption', 'contract-breach', 'escalated']),
      resolution_details: null,
      resolved_at: null,
      created_by: 'a0000000-0000-0000-0000-000000000003',
      updated_by: 'a0000000-0000-0000-0000-000000000001',
      created_at: new Date('2024-03-20T13:45:00'),
      updated_at: new Date('2024-03-27T10:00:00')
    }
  ]);
};
