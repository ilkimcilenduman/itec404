const mysql = require('mysql2/promise');

async function checkDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'club_management'
    });
    
    console.log('Connected to database');
    
    console.log('\nChecking club_members table...');
    const [members] = await connection.query('SELECT * FROM club_members WHERE role = "president"');
    console.log('Club presidents:', members);
    
    console.log('\nChecking users table...');
    const [users] = await connection.query('SELECT id, name, email, role FROM users WHERE role = "club_president"');
    console.log('Club president users:', users);
    
    if (users.length > 0) {
      console.log('\nChecking for mismatches...');
      for (const user of users) {
        const [userClubs] = await connection.query(
          'SELECT * FROM club_members WHERE user_id = ? AND role = "president"',
          [user.id]
        );
        console.log(`User ${user.id} (${user.name}) is president of ${userClubs.length} clubs:`, userClubs);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConnection closed');
    }
  }
}

checkDatabase();
