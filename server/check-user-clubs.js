const mysql = require('mysql2/promise');

async function checkUserClubs() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'club_management'
    });
    
    console.log('Connected to database');
    
    console.log('\nChecking club presidents...');
    const [presidents] = await connection.query(`
      SELECT cm.*, u.name as user_name, u.email, u.role as user_role, c.name as club_name
      FROM club_members cm
      JOIN users u ON cm.user_id = u.id
      JOIN clubs c ON cm.club_id = c.id
      WHERE cm.role = 'president'
    `);
    
    console.log('Club presidents:', JSON.stringify(presidents, null, 2));
    
    console.log('\nChecking users with club_president role...');
    const [clubPresidents] = await connection.query(`
      SELECT u.*, COUNT(cm.id) as president_count
      FROM users u
      LEFT JOIN club_members cm ON u.id = cm.user_id AND cm.role = 'president'
      WHERE u.role = 'club_president'
      GROUP BY u.id
    `);
    
    console.log('Users with club_president role:', JSON.stringify(clubPresidents, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConnection closed');
    }
  }
}

checkUserClubs();
