const fs = require('fs');
const dir = './seeds';
fs.readdirSync(dir).forEach(file => {
  const p = dir + '/' + file;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/knex\.raw\('gen_random_uuid\(\)'\)/g, 'require("uuid").v4()');
  fs.writeFileSync(p, c);
});
console.log('done');
