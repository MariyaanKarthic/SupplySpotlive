const fs = require('fs');
const path = require('path');

const SEEDS_DIR = path.join(__dirname, '../seeds');

// Map of placeholder strings to valid UUIDs
const uuidMap = {
  // Users
  'admin-uuid-1234': 'a0000000-0000-0000-0000-000000000001',
  'manager-uuid-1234': 'a0000000-0000-0000-0000-000000000002',
  'finance-uuid-1234': 'a0000000-0000-0000-0000-000000000003',
  'ap-clerk-uuid-1234': 'a0000000-0000-0000-0000-000000000004',

  // Vendors
  'vendor-uuid-001': 'b0000000-0000-0000-0000-000000000001',
  'vendor-uuid-002': 'b0000000-0000-0000-0000-000000000002',
  'vendor-uuid-003': 'b0000000-0000-0000-0000-000000000003',
  'vendor-uuid-004': 'b0000000-0000-0000-0000-000000000004',
  'vendor-uuid-005': 'b0000000-0000-0000-0000-000000000005',

  // Invoices
  'invoice-uuid-001': 'c0000000-0000-0000-0000-000000000001',
  'invoice-uuid-002': 'c0000000-0000-0000-0000-000000000002',
  'invoice-uuid-003': 'c0000000-0000-0000-0000-000000000003',
  'invoice-uuid-004': 'c0000000-0000-0000-0000-000000000004',
  'invoice-uuid-005': 'c0000000-0000-0000-0000-000000000005',

  // Disputes
  'dispute-uuid-001': 'd0000000-0000-0000-0000-000000000001',
  'dispute-uuid-002': 'd0000000-0000-0000-0000-000000000002',
  'dispute-uuid-003': 'd0000000-0000-0000-0000-000000000003',
  'dispute-uuid-004': 'd0000000-0000-0000-0000-000000000004',
  'dispute-uuid-005': 'd0000000-0000-0000-0000-000000000005',
};

// 1. Process 001_users.js to replace dynamic UUID generation with static valid UUIDs
function patchUsers() {
  const file = path.join(SEEDS_DIR, '001_users.js');
  let content = fs.readFileSync(file, 'utf8');
  
  const userUUIDs = [
    'a0000000-0000-0000-0000-000000000001', // admin
    'a0000000-0000-0000-0000-000000000002', // procurement manager
    'a0000000-0000-0000-0000-000000000003', // finance manager
    'a0000000-0000-0000-0000-000000000004', // ap clerk
    'a0000000-0000-0000-0000-000000000005', // supplier
    'a0000000-0000-0000-0000-000000000006'  // viewer
  ];

  let i = 0;
  content = content.replace(/id:\s*require\("uuid"\)\.v4\(\)/g, () => {
    return `id: '${userUUIDs[i++]}'`;
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log('Patched 001_users.js with static UUIDs');
}

// 2. Process 002_vendors.js to replace dynamic UUID generation with static valid UUIDs and fix knex.raw quotes
function patchVendors() {
  const file = path.join(SEEDS_DIR, '002_vendors.js');
  let content = fs.readFileSync(file, 'utf8');
  
  const vendorUUIDs = [
    'b0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000005'
  ];

  let i = 0;
  content = content.replace(/id:\s*require\("uuid"\)\.v4\(\)/g, () => {
    return `id: '${vendorUUIDs[i++]}'`;
  });

  // Fix knex.raw sql quotes for PG (matching double quotes inside the single-quoted raw SQL)
  content = content.replace(/created_by: knex\.raw\('\(SELECT id FROM users WHERE email = \\"([^"]+)\\"\)'\)/g, 'created_by: knex.raw("(SELECT id FROM users WHERE email = \'$1\')")');
  content = content.replace(/updated_by: knex\.raw\('\(SELECT id FROM users WHERE email = \\"([^"]+)\\"\)'\)/g, 'updated_by: knex.raw("(SELECT id FROM users WHERE email = \'$1\')")');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Patched 002_vendors.js with static UUIDs and valid SQL quoting');
}

// 3. Process all seed files to apply the string replacements from uuidMap
function replacePlaceholderStrings() {
  fs.readdirSync(SEEDS_DIR).forEach(fileName => {
    const file = path.join(SEEDS_DIR, fileName);
    let content = fs.readFileSync(file, 'utf8');
    
    let updated = false;
    for (const [placeholder, uuid] of Object.entries(uuidMap)) {
      if (content.includes(placeholder)) {
        content = content.split(placeholder).join(uuid);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Replaced placeholders in ${fileName}`);
    }
  });
}

// 4. Stringify tags array in 004_disputes.js for Postgres JSONB compatibility and fix created_by/updated_by foreign keys
function patchDisputes() {
  const file = path.join(SEEDS_DIR, '004_disputes.js');
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace tags: [ ... ] with tags: JSON.stringify([ ... ])
  content = content.replace(/tags:\s*(\[[^\]]*\])/g, 'tags: JSON.stringify($1)');
  
  // Fix foreign key violations where vendor IDs were assigned to created_by/updated_by columns which reference users
  content = content.replace(/created_by: 'b0000000-0000-0000-0000-000000000001'/g, "created_by: 'a0000000-0000-0000-0000-000000000005'");
  content = content.replace(/updated_by: 'b0000000-0000-0000-0000-000000000001'/g, "updated_by: 'a0000000-0000-0000-0000-000000000005'");
  content = content.replace(/created_by: 'b0000000-0000-0000-0000-000000000005'/g, "created_by: 'a0000000-0000-0000-0000-000000000005'");
  content = content.replace(/updated_by: 'b0000000-0000-0000-0000-000000000005'/g, "updated_by: 'a0000000-0000-0000-0000-000000000005'");

  fs.writeFileSync(file, content, 'utf8');
  console.log('Patched 004_disputes.js tags and user foreign keys');
}

patchUsers();
patchVendors();
replacePlaceholderStrings();
patchDisputes();
console.log('All seeds patched successfully for PostgreSQL compatibility!');
