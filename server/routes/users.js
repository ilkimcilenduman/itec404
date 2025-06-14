const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, student_id, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me/clubs', authenticateToken, async (req, res) => {
  try {
    console.log('Getting clubs for user:', req.user.id, 'with role:', req.user.role);

    const [clubs] = await pool.query(
      `SELECT c.*, cm.role as member_role, cm.status as member_status
       FROM clubs c
       JOIN club_members cm ON c.id = cm.club_id
       WHERE cm.user_id = ?`,
      [req.user.id]
    );

    console.log('User clubs found:', clubs);

    res.json(clubs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me/club-presidency', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    const [memberships] = await pool.query(
      `SELECT cm.*, c.name as club_name
       FROM club_members cm
       JOIN clubs c ON cm.club_id = c.id
       WHERE cm.user_id = ? AND cm.role = 'president'`,
      [req.user.id]
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      presidencies: memberships
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }

});

router.get('/me/events', authenticateToken, async (req, res) => {
  try {
    const [events] = await pool.query(
      `SELECT e.*, c.name as club_name
       FROM events e
       JOIN event_registrations er ON e.id = er.event_id
       JOIN clubs c ON e.club_id = c.id
       WHERE er.user_id = ?`,
      [req.user.id]
    );

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    await pool.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, student_id, role FROM users'
    );

    const userIds = users.map(user => user.id);

    if (userIds.length > 0) {
      const [memberships] = await pool.query(
        `SELECT cm.user_id, cm.club_id, cm.role as member_role, c.name as club_name
         FROM club_members cm
         JOIN clubs c ON cm.club_id = c.id
         WHERE cm.user_id IN (?) AND cm.status = 'approved'`,
        [userIds]
      );

      const membershipsByUser = {};
      memberships.forEach(membership => {
        if (!membershipsByUser[membership.user_id]) {
          membershipsByUser[membership.user_id] = [];
        }
        membershipsByUser[membership.user_id].push({
          club_id: membership.club_id,
          club_name: membership.club_name,
          member_role: membership.member_role
        });
      });

      users.forEach(user => {
        user.clubs = membershipsByUser[user.id] || [];
        const presidentClub = user.clubs.find(club => club.member_role === 'president');
        user.president_of = presidentClub ? {
          club_id: presidentClub.club_id,
          club_name: presidentClub.club_name
        } : null;
      });
    }

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/role', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { role, clubId, removeFromClubs } = req.body;
    const userId = req.params.id;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, userId]
      );

      if (role === 'club_president' && clubId) {
        const [existingMembership] = await connection.query(
          'SELECT * FROM club_members WHERE user_id = ? AND club_id = ?',
          [userId, clubId]
        );

        if (existingMembership.length > 0) {
          await connection.query(
            'UPDATE club_members SET role = ?, status = ? WHERE user_id = ? AND club_id = ?',
            ['president', 'approved', userId, clubId]
          );
        } else {
          await connection.query(
            'INSERT INTO club_members (user_id, club_id, role, status) VALUES (?, ?, ?, ?)',
            [userId, clubId, 'president', 'approved']
          );
        }

        await connection.query(
          'UPDATE club_members SET role = ? WHERE club_id = ? AND user_id != ? AND role = ?',
          ['member', clubId, userId, 'president']
        );
      }

      if (role === 'student' && removeFromClubs) {
        await connection.query(
          'UPDATE club_members SET role = ? WHERE user_id = ? AND role = ?',
          ['member', userId, 'president']
        );
      }

      await connection.commit();

      res.json({ message: 'User role updated successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:userId/clubs/:clubId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { userId, clubId } = req.params;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [membership] = await connection.query(
        'SELECT * FROM club_members WHERE user_id = ? AND club_id = ?',
        [userId, clubId]
      );

      if (membership.length === 0) {
        return res.status(404).json({ message: 'User is not a member of this club' });
      }

      await connection.query(
        'DELETE FROM club_members WHERE user_id = ? AND club_id = ?',
        [userId, clubId]
      );

      if (membership[0].role === 'president') {
        const [otherPresidencies] = await connection.query(
          'SELECT * FROM club_members WHERE user_id = ? AND role = ?',
          [userId, 'president']
        );

        if (otherPresidencies.length === 0) {
          const [userInfo] = await connection.query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
          );

          if (userInfo.length > 0 && userInfo[0].role === 'club_president') {
            await connection.query(
              'UPDATE users SET role = ? WHERE id = ?',
              ['student', userId]
            );
          }
        }
      }

      await connection.commit();

      res.json({ message: 'User removed from club successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
