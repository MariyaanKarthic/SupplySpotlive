import sqlite3, json, random, uuid, sys
from datetime import date, datetime, timedelta, time
random.seed(20261008)
DB = sys.argv[1]
c = sqlite3.connect(DB)
admin = c.execute("select id from users where role='admin' limit 1").fetchone()[0]
vendors = {r[0]: (r[1], r[2], r[3]) for r in c.execute("select name,id,category,status from vendors")}
TODAY = date(2026, 10, 8)

CATALOG = {
  'technology': [('Dell Latitude 7450 laptop', 92000), ('27" 4K monitor', 28500), ('Cisco Catalyst 9200 switch', 185000), ('Microsoft 365 E3 licence (12 mo)', 21600), ('UPS 3kVA online', 64000), ('Cat6 patch cable (box of 50)', 4200), ('Server rack 42U', 78000), ('Wireless access point', 18500)],
  'manufacturing': [('MS steel plate 10mm (tonne)', 68000), ('Hex bolt M12 (box of 500)', 5400), ('CNC machined flange', 3200), ('Copper cable 4 sq mm (100 m)', 9800), ('Industrial cotton fabric (100 m)', 14500), ('Control panel enclosure', 26500), ('Bearing 6205-2RS', 340), ('Stainless fastener kit', 2100)],
  'materials': [('OPC 53 cement (50 kg bag)', 395), ('Corrugated carton 5-ply', 38), ('Toughened glass sheet 8mm (sq m)', 2450), ('HDPE granules (25 kg)', 3150), ('Industrial solvent (200 L drum)', 18400), ('Stretch wrap roll', 620)],
  'logistics': [('FTL transport Chennai-Bengaluru', 42000), ('Warehousing (pallet / month)', 950), ('Container freight 20ft (Kochi-Dubai)', 118000), ('Last-mile delivery (per drop)', 180), ('Cold-chain van (per day)', 7500)],
  'services': [('Facility housekeeping (monthly)', 145000), ('Security guard services (monthly)', 98000), ('Contract staffing - 10 FTE (monthly)', 420000), ('Hazardous waste disposal (tonne)', 12500), ('Pantry and cafeteria service (monthly)', 86000)],
  'consulting': [('Statutory audit FY26', 650000), ('Process re-engineering workshop', 280000), ('Legal retainer (quarterly)', 360000), ('Supply chain strategy assessment', 520000)],
  'other': [('Safety helmet ISI', 450), ('Office stationery kit', 1250), ('Organic fertiliser (50 kg)', 1100), ('Safety shoes', 1650)],
}
SITES = ['Plant 1, Plot 18, SIPCOT Industrial Park, Hosur, Tamil Nadu 635126',
         'Central Warehouse, Bhiwandi Logistics Park, Thane, Maharashtra 421302',
         'Head Office, 5th Floor, Prestige Tech Park, Bengaluru 560103',
         'R&D Centre, HITEC City, Hyderabad, Telangana 500081',
         'Site B (expansion project), Sanand GIDC, Ahmedabad, Gujarat 382110']
TERMS = ['Net 30', 'Net 45', 'Net 60', '50% advance, 50% on delivery', 'Net 15', '2/10 Net 30']
NOTES = ['', 'Deliver between 9 AM and 5 PM on weekdays. Call the stores team 30 minutes before arrival.',
         'Material test certificates must accompany every consignment.', 'Invoice must quote the PO number and GSTIN.',
         'Partial deliveries accepted. Pack on pallets, max 1.2 m high.', 'Urgent: required for line shutdown maintenance.',
         'Include installation and on-site training for 2 operators.', '']

# (vendor, status, priority, issue days ago, delivery days after issue, lines, currency)
PLAN = [
 ('Nexora Technologies Pvt Ltd','new','high',1,14,3,'INR'), ('Shakti Steel Fabricators','new','medium',2,30,2,'INR'),
 ('Pinnacle Facility Services','new','low',0,25,1,'INR'), ('Zenith Cloud Networks','new','medium',4,21,2,'USD'),
 ('Quantum Circuits India','pending_approval','high',3,18,4,'INR'), ('Veritas Consulting Group','pending_approval','medium',5,40,1,'INR'),
 ('Himalaya Cement Works','pending_approval','high',2,10,2,'INR'), ('Brightpath HR Services','pending_approval','low',6,30,1,'INR'),
 ('Orion Data Systems','approved','medium',7,20,3,'INR'), ('Ironclad Fasteners','approved','high',4,12,3,'INR'),
 ('BlueRiver Logistics','approved','low',8,15,2,'INR'),
 ('Vertex Robotics','sent','high',12,25,2,'USD'), ('Silverline Glass Industries','sent','medium',10,21,2,'INR'),
 ('Swift Cargo Movers','sent','medium',20,10,2,'INR'), ('Bharat Electricals','sent','low',6,30,3,'INR'),
 ('Royal Textiles Mills','acknowledged','medium',18,30,3,'INR'), ('Shakti Steel Fabricators','acknowledged','high',30,21,2,'INR'),
 ('Northstar Warehousing','acknowledged','low',25,20,1,'INR'), ('Nexora Technologies Pvt Ltd','acknowledged','medium',14,28,4,'INR'),
 ('Ironclad Fasteners','partially_received','high',35,20,3,'INR'), ('Quantum Circuits India','partially_received','medium',22,30,3,'INR'),
 ('Himalaya Cement Works','partially_received','medium',28,14,2,'INR'),
 ('Orion Data Systems','received','medium',40,20,2,'INR'), ('CleanWave Environmental','received','low',33,15,1,'INR'),
 ('Sterling Audit Partners','received','high',45,30,1,'INR'),
 ('Zenith Cloud Networks','closed','medium',95,21,3,'USD'), ('Royal Textiles Mills','closed','low',80,30,2,'INR'),
 ('Saffron Office Supplies','closed','low',120,10,3,'INR'),
 ('Deccan Polymers Ltd','cancelled','medium',60,30,2,'INR'), ('Tranquil Catering Co','cancelled','high',15,7,1,'INR'),
]
INR_PER_USD = 84
plans = sorted(PLAN, key=lambda p: -p[3])
existing = c.execute("select count(*) from purchase_orders").fetchone()[0]
rows = []
for n, (vname, status, prio, ago, lead, nlines, cur) in enumerate(plans, start=existing + 1):
    vid, cat, _ = vendors[vname]
    issue = TODAY - timedelta(days=ago)
    expected = issue + timedelta(days=lead)
    items = []
    for name, price in random.sample(CATALOG[cat], min(nlines, len(CATALOG[cat]))):
        unit = round(price / INR_PER_USD, 2) if cur == 'USD' else price
        qty = random.choice([1, 2, 5, 10, 20, 50, 100, 250]) if price < 5000 else random.choice([1, 1, 2, 3, 5, 10])
        if price > 200000: qty = 1
        received = 0
        if status in ('received', 'closed'): received = qty
        elif status == 'partially_received': received = random.choice([0, qty, max(1, qty // 2)])
        items.append({'description': name, 'quantity': qty, 'unitPrice': unit, 'totalAmount': round(qty * unit, 2),
                      'deliveryDate': None, 'receivedQuantity': received})
    if status == 'partially_received' and all(i['receivedQuantity'] in (0,) for i in items):
        items[0]['receivedQuantity'] = max(1, items[0]['quantity'] // 2)
    if status == 'partially_received' and all(i['receivedQuantity'] == i['quantity'] for i in items):
        items[-1]['receivedQuantity'] = items[-1]['quantity'] // 2
    total = round(sum(i['totalAmount'] for i in items), 2)
    acked = status in ('acknowledged', 'partially_received', 'received', 'closed')
    ack_date = (issue + timedelta(days=random.randint(1, 3))).isoformat() if acked else None
    created = datetime.combine(issue, time(random.randint(9, 17), random.randint(0, 59), random.randint(0, 59)))
    updated = min(datetime.combine(TODAY, time(9, 0)), created + timedelta(days=min(ago, random.randint(0, 6)), hours=random.randint(1, 6)))
    rows.append((str(uuid.uuid4()), f'PO-2026-{n:04d}', None, vid, total, cur, status, prio,
                 'acknowledged' if acked else 'pending', ack_date, issue.isoformat(), expected.isoformat(),
                 random.choice(SITES), random.choice(TERMS), random.choice(NOTES), json.dumps(items),
                 json.dumps([{'name': f'PO-2026-{n:04d}.pdf', 'size': random.randint(90, 600) * 1000}] if status not in ('new',) else []),
                 admin, admin, created.strftime('%Y-%m-%d %H:%M:%S'), updated.strftime('%Y-%m-%d %H:%M:%S')))
c.executemany("""insert into purchase_orders (id,po_number,rfq_id,vendor_id,total_amount,currency,status,priority,acknowledgment_status,
  acknowledgment_date,issue_date,expected_delivery_date,delivery_address,terms,notes,line_items,attachments,created_by,updated_by,created_at,updated_at)
  values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", rows)
c.commit()
print('inserted', len(rows))
for r in c.execute("select status,count(*),round(sum(total_amount)) from purchase_orders group by status order by 2 desc"): print(r)
print('overdue', c.execute("select po_number,status,expected_delivery_date from purchase_orders where expected_delivery_date < '2026-10-08' and status in ('sent','acknowledged','partially_received')").fetchall())
