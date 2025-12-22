/**
 * Migration: Add road_name column to aggregated_locations
 * Run: node src/config/add_road_name.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

const migrate = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log("Connected to database...");

  // Add road_name column if it doesn't exist
  try {
    await connection.query("ALTER TABLE aggregated_locations ADD COLUMN road_name VARCHAR(255)");
    console.log("Added road_name column to aggregated_locations");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("road_name column already exists");
    } else {
      throw err;
    }
  }

  // Check work_assignments
  const [assignments] = await connection.query("SELECT * FROM work_assignments");
  console.log(`\nCurrent work_assignments: ${assignments.length}`);
  console.log(assignments);

  // Check aggregated_locations
  const [locations] = await connection.query("SELECT id, status, road_name, latitude, longitude FROM aggregated_locations");
  console.log(`\nCurrent aggregated_locations: ${locations.length}`);
  console.log(locations);

  // Check contractors
  const [contractors] = await connection.query("SELECT * FROM contractors");
  console.log(`\nCurrent contractors: ${contractors.length}`);
  console.log(contractors);

  // If no work assignments exist, create some sample ones
  if (assignments.length === 0) {
    console.log("\nCreating sample work assignments...");
    
    const [adminUsers] = await connection.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const adminId = adminUsers.length > 0 ? adminUsers[0].id : null;
    
    if (contractors.length > 0 && locations.length > 0) {
      // Find assigned location
      const assignedLoc = locations.find(l => l.status === 'assigned');
      if (assignedLoc) {
        await connection.query(`
          INSERT INTO work_assignments (aggregated_location_id, contractor_id, assigned_by, due_date, status, notes)
          VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), 'assigned', 'Road requires attention')
        `, [assignedLoc.id, contractors[0].id, adminId]);
        console.log("Created assignment for assigned location");
      }

      // Find pending_verification location
      const pendingLoc = locations.find(l => l.status === 'pending_verification');
      if (pendingLoc && contractors.length > 1) {
        await connection.query(`
          INSERT INTO work_assignments (aggregated_location_id, contractor_id, assigned_by, due_date, status, completed_at, notes)
          VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 3 DAY), 'pending_verification', NOW(), 'Work completed - awaiting verification')
        `, [pendingLoc.id, contractors[1].id, adminId]);
        console.log("Created assignment for pending_verification location");
      }

      // Find verified locations
      const verifiedLocs = locations.filter(l => l.status === 'verified');
      for (let i = 0; i < verifiedLocs.length && i < contractors.length; i++) {
        await connection.query(`
          INSERT INTO work_assignments (aggregated_location_id, contractor_id, assigned_by, due_date, status, completed_at, notes)
          VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL -5 DAY), 'verified', NOW() - INTERVAL ? DAY, 'Work verified and closed')
        `, [verifiedLocs[i].id, contractors[i].id, adminId, 10 + i * 2]);
        console.log(`Created assignment for verified location ${verifiedLocs[i].id}`);
      }
    }
  }

  // Update road names if empty
  for (const loc of locations) {
    if (!loc.road_name) {
      const roadNames = {
        'Anna Nagar': 'Anna Salai',
        'T. Nagar': 'Mount Road',
        'Mylapore': 'Cathedral Road',
        'Adyar': 'Gandhi Road',
        'Beach Road': 'Beach Road'
      };
      // Use a generic name based on coordinates
      const roadName = `Road at ${loc.latitude}, ${loc.longitude}`;
      await connection.query(
        "UPDATE aggregated_locations SET road_name = ? WHERE id = ?",
        [roadName, loc.id]
      );
      console.log(`Updated road_name for location ${loc.id}`);
    }
  }

  await connection.end();
  console.log("\nMigration complete!");
};

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
