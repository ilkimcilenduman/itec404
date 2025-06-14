const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [clubs] = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM club_members WHERE club_id = c.id AND status = 'approved') as member_count
      FROM clubs c
    `);

    res.json(clubs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [clubs] = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM club_members WHERE club_id = c.id AND status = 'approved') as member_count
      FROM clubs c
      WHERE c.id = ?`,
      [req.params.id]
    );

    if (clubs.length === 0) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.json(clubs[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { name, description, category } = req.body;

    const [result] = await pool.query(
      'INSERT INTO clubs (name, description, category) VALUES (?, ?, ?)',
      [name, description, category]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authenticateToken, authorizeRole(['admin', 'club_president']), async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (req.user.role === 'club_president') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [req.params.id, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'Not authorized to update this club' });
      }
    }

    try {
      if (!name || !description || !category) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      await pool.query(
        'UPDATE clubs SET name = ?, description = ?, category = ? WHERE id = ?',
        [name, description, category, req.params.id]
      );

      res.json({ message: 'Club updated successfully' });
    } catch (dbError) {
      console.error('Database error when updating club details:', dbError);
      res.status(500).json({ message: 'Failed to save changes. Please try again.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    await pool.query('DELETE FROM clubs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Club deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.user.id;

    const [existingMembers] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );

    if (existingMembers.length > 0) {
      return res.status(400).json({ message: 'Already a member of this club' });
    }

    await pool.query(
      'INSERT INTO club_members (club_id, user_id, role, status) VALUES (?, ?, ?, ?)',
      [clubId, userId, 'member', 'pending']
    );

    res.status(201).json({ message: 'Club join request submitted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/members/:userId', authenticateToken, authorizeRole(['club_president', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const clubId = req.params.id;
    const memberId = req.params.userId;

    if (req.user.role === 'club_president') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [clubId, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'Not authorized to manage this club' });
      }
    }

    try {
      await pool.query(
        'UPDATE club_members SET status = ? WHERE club_id = ? AND user_id = ?',
        [status, clubId, memberId]
      );

      res.json({ message: 'Membership status updated' });
    } catch (dbError) {
      console.error('Database error when updating membership status:', dbError);
      res.status(500).json({ message: 'Failed to process the membership decision. Please try again.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const [members] = await pool.query(
      `SELECT cm.*, u.name, u.email, u.student_id, u.profile_image
       FROM club_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.club_id = ?`,
      [req.params.id]
    );

    const membersWithImageUrl = members.map(member => {
      if (member.profile_image) {
        member.profile_image_url = `${req.protocol}://${req.get('host')}/uploads/${member.profile_image}`;
      }
      return member;
    });

    res.json(membersWithImageUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/members/:userId/role', authenticateToken, authorizeRole(['club_president', 'admin']), async (req, res) => {
  try {
    const { role } = req.body;
    const clubId = req.params.id;
    const memberId = req.params.userId;

    const validRoles = ['member', 'vice_president', 'secretary', 'treasurer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (req.user.role === 'club_president') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [clubId, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'Not authorized to manage this club' });
      }
    }

    const [memberCheck] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND status = "approved"',
      [clubId, memberId]
    );

    if (memberCheck.length === 0) {
      return res.status(404).json({ message: 'Member not found or not approved' });
    }

    if (memberCheck[0].role === 'president') {
      return res.status(403).json({ message: 'Cannot change role of club president' });
    }

    await pool.query(
      'UPDATE club_members SET role = ? WHERE club_id = ? AND user_id = ?',
      [role, clubId, memberId]
    );

    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/members/:userId', authenticateToken, authorizeRole(['club_president', 'admin']), async (req, res) => {
  try {
    const clubId = req.params.id;
    const memberId = req.params.userId;

    if (req.user.role === 'club_president') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [clubId, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'Not authorized to manage this club' });
      }
    }

    const [memberCheck] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, memberId]
    );

    if (memberCheck.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (memberCheck[0].role === 'president') {
      return res.status(403).json({ message: 'Cannot remove club president' });
    }

    await pool.query(
      'DELETE FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, memberId]
    );

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:clubId/membership', authenticateToken, async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const [membership] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );

    if (membership.length === 0) {
      return res.json({ isMember: false, status: null, role: null });
    }

    res.json({
      isMember: true,
      status: membership[0].status,
      role: membership[0].role
    });
  } catch (error) {
    console.error('Error checking membership:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
