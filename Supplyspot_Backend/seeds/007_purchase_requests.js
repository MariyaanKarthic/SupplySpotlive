/**
 * Sample purchase requests across every status. Requesters and approvers are taken from existing users,
 * so this works against any database that has at least one user.
 * Run on its own with: npx knex seed:run --specific=007_purchase_requests.js
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('purchase_requests').del();

  const users = await knex('users').whereNot('role', 'supplier').select('id', 'name', 'role');
  if (!users.length) return;
  const approvers = users.filter(u => ['admin', 'procurement_manager'].includes(u.role));
  const approver = approvers[0] || users[0];
  const requester = (i) => users[i % users.length];

  const year = new Date().getFullYear();
  const day = 86400000;
  const daysAgo = (n) => new Date(Date.now() - n * day);
  const dateOnly = (d) => d.toISOString().split('T')[0];
  const stamp = (d) => (d ? d.toISOString().replace('T', ' ').slice(0, 19) : null);
  const entry = (user, action, at, comment) => ({ action, userId: user.id, userName: user.name, at: at.toISOString(), ...(comment ? { comment } : {}) });

  const samples = [
    { title: 'Laptops for new engineering hires', department: 'IT', priority: 'high', status: 'submitted', age: 2, need: 14,
      items: [['Developer laptop, 32GB RAM', 6, 'pcs', 720000, 'IT Hardware'], ['USB-C docking station', 6, 'pcs', 90000, 'IT Hardware']],
      notes: 'Six engineers join on the 1st of next month.' },
    { title: 'Quarterly office supplies', department: 'Admin', priority: 'low', status: 'approved', age: 12, need: 5,
      items: [['A4 paper, 80gsm (box of 5 reams)', 40, 'box', 48000, 'Office Supplies'], ['Whiteboard markers (pack of 12)', 20, 'pack', 6000, 'Office Supplies'], ['Printer toner, black', 8, 'pcs', 36000, 'Office Supplies']] },
    { title: 'Hydraulic oil for press line 2', department: 'Production', priority: 'high', status: 'approved', age: 6, need: 3,
      items: [['ISO VG 46 hydraulic oil, 210L drum', 4, 'drum', 168000, 'MRO']], notes: 'Current stock lasts about 10 days.' },
    { title: 'Annual antivirus renewal', department: 'IT', priority: 'medium', status: 'draft', age: 1, need: 30,
      items: [['Endpoint protection licence, 1 year', 120, 'licence', 240000, 'Software']] },
    { title: 'Safety gear for warehouse team', department: 'Operations', priority: 'high', status: 'submitted', age: 1, need: 7,
      items: [['Safety shoes, steel toe', 25, 'pair', 62500, 'MRO'], ['High-visibility vest', 25, 'pcs', 7500, 'MRO'], ['Hard hat', 25, 'pcs', 12500, 'MRO']] },
    { title: 'Conference room AV upgrade', department: 'Facilities', priority: 'medium', status: 'rejected', age: 20, need: 25,
      items: [['65-inch display', 2, 'pcs', 180000, 'IT Hardware'], ['Video conferencing bar', 2, 'pcs', 160000, 'IT Hardware']],
      reason: 'Not in this quarter\'s budget. Please resubmit in Q1 with two vendor estimates.' },
    { title: 'Steel sheet for bracket order', department: 'Production', priority: 'high', status: 'submitted', age: 3, need: 10,
      items: [['CRCA steel sheet 2mm, 1250x2500', 120, 'sheet', 540000, 'Raw Materials']] },
    { title: 'Trade show booth materials', department: 'Marketing', priority: 'medium', status: 'draft', age: 0, need: 40,
      items: [['Roll-up banner', 4, 'pcs', 16000, 'Marketing'], ['Printed brochures', 2000, 'pcs', 40000, 'Marketing']] },
    { title: 'HVAC preventive maintenance contract', department: 'Facilities', priority: 'medium', status: 'approved', age: 30, need: -5,
      items: [['Quarterly HVAC servicing, 12 months', 4, 'visit', 220000, 'Services']] },
    { title: 'Payroll software add-on', department: 'HR', priority: 'low', status: 'submitted', age: 8, need: 21,
      items: [['Attendance integration module', 1, 'licence', 85000, 'Software']] },
    { title: 'Courier services for Q4 dispatches', department: 'Sales', priority: 'medium', status: 'rejected', age: 15, need: 10,
      items: [['Express courier, domestic', 300, 'shipment', 75000, 'Logistics']],
      reason: 'Use the existing logistics contract instead of a new one.' },
    { title: 'Lab consumables for R&D trials', department: 'R&D', priority: 'medium', status: 'approved', age: 4, need: 12,
      items: [['Nitrile gloves (box of 100)', 30, 'box', 15000, 'Other'], ['Glass beakers set', 5, 'set', 12500, 'Other'], ['pH meter', 2, 'pcs', 24000, 'IT Hardware']] },
  ];

  const rows = samples.map((s, i) => {
    const user = requester(i);
    const created = daysAgo(s.age + 1);
    const items = s.items.map(([description, quantity, unit, budget, category]) => ({ description, quantity, unit, budget, category }));
    const history = [entry(user, 'created', created)];
    let submittedAt = null;
    let decidedAt = null;
    if (s.status !== 'draft') {
      submittedAt = new Date(created.getTime() + 3600000);
      history.push(entry(user, 'submitted', submittedAt));
    }
    if (s.status === 'approved') {
      decidedAt = new Date(submittedAt.getTime() + day);
      history.push(entry(approver, 'approved', decidedAt, i % 2 ? 'Approved within budget.' : undefined));
    }
    if (s.status === 'rejected') {
      decidedAt = new Date(submittedAt.getTime() + day);
      history.push(entry(approver, 'rejected', decidedAt, s.reason));
    }
    return {
      id: `f0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
      pr_number: `PR-${year}-${String(i + 1).padStart(4, '0')}`,
      title: s.title,
      status: s.status,
      requester_id: user.id,
      department: s.department,
      requested_date: dateOnly(new Date(Date.now() + s.need * day)),
      priority: s.priority,
      currency: 'INR',
      budget_total: items.reduce((acc, it) => acc + it.budget, 0),
      items: JSON.stringify(items),
      notes: s.notes || null,
      submitted_at: stamp(submittedAt),
      approval_date: stamp(decidedAt),
      approver_id: decidedAt ? approver.id : null,
      rejection_reason: s.status === 'rejected' ? s.reason : null,
      rfq_id: null,
      history: JSON.stringify(history),
      updated_by: user.id,
      created_at: stamp(created),
      updated_at: stamp(decidedAt || submittedAt || created),
    };
  });

  await knex('purchase_requests').insert(rows);
};
