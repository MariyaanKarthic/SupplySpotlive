/**
 * Vendor compliance: certification status and audit dates on vendors, plus one row per certification and per audit.
 *
 * - vendors.certification_status: certified | pending | non_compliant (set by compliance staff, or when an audit is recorded).
 * - vendors.last_audit_date / audit_notes: the latest audit, kept in step with vendor_audits. Backfilled from
 *   compliance_info.lastAuditDate, which vendor performance still reads (recording an audit updates both).
 * - vendor_certifications: ISO, GST, FSSAI etc. Expiry (expired / expiring within 30 days) is computed from expiry_date,
 *   not stored; status is the verification state (verified | pending_verification | rejected).
 * - vendor_audits: audit history. result: passed | passed_with_observations | failed.
 * - disputes.vendor_id: which vendor a dispute is about, so compliance issues can be counted per vendor.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('vendors', function(table) {
    table.string('certification_status').defaultTo('pending');
    table.date('last_audit_date').nullable();
    table.text('audit_notes');
    table.index(['certification_status']);
    table.index(['last_audit_date']);
  });

  await knex.schema.createTable('vendor_certifications', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('vendor_id').references('id').inTable('vendors').onDelete('CASCADE').notNullable();
    table.string('cert_type').notNullable(); // e.g. ISO 9001, ISO 14001, GST Registration, FSSAI
    table.string('certificate_number');
    table.string('issuing_body');
    table.date('issue_date');
    table.date('expiry_date');
    table.string('status').defaultTo('pending_verification');
    table.string('verified_by');
    table.timestamp('verified_at').nullable();
    table.text('notes');
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.timestamps(true, true);
    table.index(['vendor_id']);
    table.index(['expiry_date']);
  });

  await knex.schema.createTable('vendor_audits', function(table) {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('vendor_id').references('id').inTable('vendors').onDelete('CASCADE').notNullable();
    table.date('audit_date').notNullable();
    table.string('audit_type').defaultTo('routine'); // routine | certification | follow_up | surprise
    table.string('auditor');
    table.string('result').notNullable();
    table.integer('score').nullable(); // 0–100
    table.text('findings');
    table.date('next_audit_due').nullable();
    table.uuid('created_by').nullable();
    table.timestamps(true, true);
    table.index(['vendor_id']);
    table.index(['audit_date']);
  });

  await knex.schema.alterTable('disputes', function(table) {
    table.uuid('vendor_id').references('id').inTable('vendors').nullable();
    table.index(['vendor_id']);
  });

  // Backfill the audit date from the JSON the vendor form already stores.
  const vendors = await knex('vendors').select('id', 'compliance_info');
  for (const v of vendors) {
    let info = v.compliance_info;
    if (typeof info === 'string') {
      try { info = JSON.parse(info); } catch { info = null; }
    }
    const date = info && typeof info.lastAuditDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(info.lastAuditDate)
      ? info.lastAuditDate.slice(0, 10) : null;
    if (date) await knex('vendors').where('id', v.id).update({ last_audit_date: date });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('disputes', function(table) {
    table.dropIndex(['vendor_id']);
    table.dropColumn('vendor_id');
  });
  await knex.schema.dropTableIfExists('vendor_audits');
  await knex.schema.dropTableIfExists('vendor_certifications');
  await knex.schema.alterTable('vendors', function(table) {
    table.dropIndex(['certification_status']);
    table.dropIndex(['last_audit_date']);
    table.dropColumn('certification_status');
    table.dropColumn('last_audit_date');
    table.dropColumn('audit_notes');
  });
};
