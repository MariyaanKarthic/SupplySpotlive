/**
 * Sample compliance data for 20 of the sample vendors (seed 002): certification status, certificates (some expired,
 * some expiring within 30 days), 8 audits, 4 vendors overdue for an audit, and 6 compliance-related disputes.
 * Dates are relative to the day the seed runs. Run it on its own:
 *   npx knex seed:run --specific=011_compliance.js
 * Re-running it replaces every certificate and audit, and the CMP- disputes; other disputes are left alone.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const { v4: uuidv4 } = require('uuid');

const DAY = 86400000;
const dateIn = (days) => new Date(Date.now() + days * DAY).toISOString().split('T')[0];
const sqlTime = (days, hour = 10) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString().replace('T', ' ').slice(0, 19);
};
const parse = (v) => {
  if (typeof v !== 'string') return v || {};
  try { return JSON.parse(v || '{}') || {}; } catch { return {}; }
};

// [vendor, certification status, certificates [type, issuing body, issued (days from today), expires (days), record status],
//  days since last audit when there is no audit row below (null keeps the date already on the vendor)]
const VENDORS = [
  ['Nexora Technologies Pvt Ltd', 'certified', [['ISO 9001', 'TÜV SÜD', -600, 495, 'verified'], ['ISO 27001', 'BSI', -1077, 18, 'verified']]],
  ['BlueRiver Logistics', 'certified', [['ISO 9001', 'Bureau Veritas', -400, 695, 'verified']]],
  ['Veritas Consulting Group', 'certified', [['ISO 9001', 'Intertek', -300, 795, 'verified']]],
  ['Quantum Circuits India', 'certified', [['ISO 9001', 'TÜV SÜD', -500, 595, 'verified'], ['RoHS Compliance', 'SGS', -356, 9, 'verified']]],
  ['Swift Cargo Movers', 'certified', [['ISO 9001', 'DNV', -200, 895, 'verified']]],
  ['Orion Data Systems', 'certified', [['ISO 27001', 'BSI', -150, 945, 'verified']]],
  ['Himalaya Cement Works', 'certified', [['ISO 9001', 'BIS', -700, 395, 'verified'], ['ISO 14001', 'BIS', -250, 845, 'verified'], ['BIS Product Licence', 'BIS', -320, 45, 'verified']]],
  ['Vertex Robotics', 'certified', [['ISO 9001', 'TÜV Rheinland', -450, 645, 'verified'], ['CE Marking', 'TÜV Rheinland', -340, 25, 'verified']]],
  ['Zenith Cloud Networks', 'certified', [['ISO 27001', 'BSI', -90, 1005, 'verified'], ['SOC 2 Type II', 'Deloitte', -120, 245, 'verified']]],
  ['Bharat Electricals', 'certified', [['ISO 9001', 'Intertek', -260, 835, 'verified'], ['BIS Product Licence', 'BIS', -180, 185, 'verified']]],
  ['Shakti Steel Fabricators', 'certified', [['BIS Product Licence', 'BIS', -380, 350, 'verified']], 420],
  ['Northstar Warehousing', 'certified', [['ISO 9001', 'DNV', -800, 295, 'verified']], 390],
  ['GreenLeaf Packaging Solutions', 'pending', [['FSC Chain of Custody', 'SCS Global', -20, 1805, 'pending_verification']]],
  ['Apex Precision Engineering', 'pending', [['ISO 9001', 'TÜV SÜD', -30, 1065, 'pending_verification']]],
  ['Coastal Marine Shipping', 'pending', [['ISO 9001', 'Bureau Veritas', -1115, -20, 'verified']]],
  ['Eastern Chemicals Corp', 'pending', [['ISO 14001', 'SGS', -15, 1080, 'pending_verification'], ['Pollution Control Consent', 'State PCB', -340, 25, 'verified']]],
  ['Brightpath HR Services', 'pending', [], 380],
  ['Kaveri Agro Inputs', 'non_compliant', [['FSSAI Licence', 'FSSAI', -775, -45, 'verified']], 500],
  ['Tranquil Catering Co', 'non_compliant', [['FSSAI Licence', 'FSSAI', -820, -90, 'verified']]],
  ['Deccan Polymers Ltd', 'non_compliant', [['ISO 9001', 'Intertek', -1160, -65, 'verified']]],
];

// [vendor, days ago, type, auditor, result, score, findings, next audit due (days from today)]
const AUDITS = [
  ['Nexora Technologies Pvt Ltd', 30, 'routine', 'Meera Krishnan', 'passed', 92, 'Quality records and change control in good order.', 335],
  ['Tranquil Catering Co', 60, 'surprise', 'Rahul Verma', 'failed', 41, 'FSSAI licence lapsed; kitchen hygiene logs incomplete for 3 weeks.', 30],
  ['Deccan Polymers Ltd', 100, 'certification', 'Meera Krishnan', 'failed', 52, 'ISO 9001 surveillance not renewed; batch traceability gaps.', 20],
  ['Himalaya Cement Works', 15, 'routine', 'Anil Joshi', 'passed', 88, 'Emissions monitoring current; minor housekeeping note.', 350],
  ['Apex Precision Engineering', 45, 'certification', 'Anil Joshi', 'passed_with_observations', 74, 'Calibration certificates for 2 gauges overdue; ISO 9001 audit pending with TÜV.', 135],
  ['Quantum Circuits India', 120, 'routine', 'Rahul Verma', 'passed', 90, 'RoHS declarations on file for all active parts.', 245],
  ['BlueRiver Logistics', 75, 'routine', 'Meera Krishnan', 'passed_with_observations', 79, 'Driver licence register not updated for two new hires.', 290],
  ['Coastal Marine Shipping', 10, 'follow_up', 'Anil Joshi', 'passed_with_observations', 68, 'ISO 9001 certificate expired; renewal audit booked. Marine insurance certificate requested.', 60],
];

// [number, vendor, category, priority, status, days ago, title, description, resolved days ago]
const DISPUTES = [
  ['CMP-0001', 'Shakti Steel Fabricators', 'quality', 'high', 'investigating', 12, 'Weld defects on structural steel batch',
    'Incoming inspection rejected 14 of 60 fabricated frames for porosity in welds. Vendor to submit NCR and corrective action.'],
  ['CMP-0002', 'Coastal Marine Shipping', 'documentation', 'medium', 'submitted', 5, 'Marine insurance certificate missing',
    'Vendor has not provided a current marine cargo insurance certificate required by the master service agreement.'],
  ['CMP-0003', 'Tranquil Catering Co', 'regulatory', 'critical', 'escalated', 20, 'Catering continued after FSSAI licence lapsed',
    'FSSAI licence expired three months ago; vendor continued to serve the canteen. Service suspended pending renewal.'],
  ['CMP-0004', 'Swift Cargo Movers', 'delivery', 'high', 'assigned', 8, 'Repeated late deliveries to Pune plant',
    'Four of the last six consignments arrived more than 48 hours late, breaching the delivery SLA.'],
  ['CMP-0005', 'Kaveri Agro Inputs', 'payment', 'high', 'pending_supplier', 30, 'Advance paid against lapsed licence',
    'A 30% advance was released while the vendor\'s FSSAI licence had lapsed. Vendor to refund or provide renewed licence.'],
  ['CMP-0006', 'Quantum Circuits India', 'quality', 'medium', 'resolved', 55, 'Missing RoHS declaration for PCB lot',
    'Lot QC-2291 shipped without a RoHS declaration. Vendor supplied the declaration and test report.', 40],
];

exports.seed = async function(knex) {
  const admin = await knex('users').where('role', 'admin').first();
  if (!admin) throw new Error('Seed users first (001_users.js)');
  const adminName = admin.name || admin.email;

  const vendors = await knex('vendors').select('id', 'name', 'compliance_info');
  const byName = new Map(vendors.map((v) => [v.name, v]));
  const need = (name) => {
    const v = byName.get(name);
    if (!v) throw new Error(`Vendor "${name}" not found; run 002_vendors.js first`);
    return v;
  };

  await knex('vendor_audits').del();
  await knex('vendor_certifications').del();
  await knex('disputes').where('dispute_number', 'like', 'CMP-%').del();

  const latestAudit = new Map();
  for (const [name, daysAgo] of AUDITS) {
    if (!latestAudit.has(name) || latestAudit.get(name) > daysAgo) latestAudit.set(name, daysAgo);
  }

  for (const [name, status, certs, auditDaysAgo = null] of VENDORS) {
    const v = need(name);
    const info = parse(v.compliance_info);
    const patch = { certification_status: status };
    const daysAgo = latestAudit.has(name) ? latestAudit.get(name) : auditDaysAgo;
    if (daysAgo !== null) {
      patch.last_audit_date = dateIn(-daysAgo);
      patch.compliance_info = JSON.stringify({ ...info, lastAuditDate: patch.last_audit_date });
    }
    if (latestAudit.has(name)) patch.audit_notes = AUDITS.find((a) => a[0] === name && a[1] === daysAgo)[6];
    await knex('vendors').where('id', v.id).update(patch);

    let n = 0;
    for (const [type, body, issued, expires, recordStatus] of certs) {
      n += 1;
      await knex('vendor_certifications').insert({
        id: uuidv4(),
        vendor_id: v.id,
        cert_type: type,
        certificate_number: `${type.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase()}-${String(v.id).slice(0, 4).toUpperCase()}${n}`,
        issuing_body: body,
        issue_date: dateIn(issued),
        expiry_date: dateIn(expires),
        status: recordStatus,
        verified_by: recordStatus === 'verified' ? adminName : null,
        verified_at: recordStatus === 'verified' ? sqlTime(issued + 7) : null,
        created_by: admin.id,
        updated_by: admin.id,
        created_at: sqlTime(issued + 7),
        updated_at: sqlTime(issued + 7),
      });
    }
  }

  for (const [name, daysAgo, type, auditor, result, score, findings, nextDue] of AUDITS) {
    await knex('vendor_audits').insert({
      id: uuidv4(),
      vendor_id: need(name).id,
      audit_date: dateIn(-daysAgo),
      audit_type: type,
      auditor,
      result,
      score,
      findings,
      next_audit_due: dateIn(nextDue),
      created_by: admin.id,
      created_at: sqlTime(-daysAgo, 16),
      updated_at: sqlTime(-daysAgo, 16),
    });
  }

  for (const [number, name, category, priority, status, daysAgo, title, description, resolvedDaysAgo] of DISPUTES) {
    const v = need(name);
    await knex('disputes').insert({
      id: uuidv4(),
      dispute_number: number,
      title,
      description,
      category,
      priority,
      status,
      vendor_id: v.id,
      submitted_by: JSON.stringify({ id: admin.id, name: adminName, email: admin.email, type: 'internal' }),
      assigned_to: status === 'submitted' ? null : JSON.stringify({ id: admin.id, name: adminName, email: admin.email, type: 'internal' }),
      related_documents: JSON.stringify([]),
      sla_details: JSON.stringify({}),
      tags: JSON.stringify(['compliance', category]),
      resolution_details: resolvedDaysAgo ? 'Vendor supplied the missing declaration and test report.' : null,
      resolved_at: resolvedDaysAgo ? sqlTime(-resolvedDaysAgo) : null,
      created_by: admin.id,
      updated_by: admin.id,
      created_at: sqlTime(-daysAgo, 9),
      updated_at: sqlTime(-(resolvedDaysAgo || daysAgo), 9),
    });
  }
};
