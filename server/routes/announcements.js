const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/club/:clubId', async (req, res) => {
  try {
    const { clubId } = req.params;

    const [announcements] = await pool.query(
      `SELECT a.*, u.name as sender_name, c.name as club_name
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       JOIN clubs c ON a.club_id = c.id
       WHERE a.club_id = ? AND (a.status = 'published' OR (a.status = 'scheduled' AND a.scheduled_date <= NOW()))
       ORDER BY a.created_at DESC`,
      [clubId]
    );

    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [memberships] = await pool.query(
      'SELECT club_id FROM club_members WHERE user_id = ? AND status = "approved"',
      [req.user.id]
    );

    if (memberships.length === 0) {
      return res.json([]);
    }

    const clubIds = memberships.map(m => m.club_id);

    const [announcements] = await pool.query(
      `SELECT a.*, u.name as sender_name, c.name as club_name
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       JOIN clubs c ON a.club_id = c.id
       WHERE a.club_id IN (?) AND (a.status = 'published' OR (a.status = 'scheduled' AND a.scheduled_date <= NOW()))
       ORDER BY a.created_at DESC`,
      [clubIds]
    );

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching user announcements:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me/new', authenticateToken, async (req, res) => {
  try {
    const { since } = req.query;

    if (!since) {
      return res.status(400).json({ message: 'Missing since parameter' });
    }

    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format for since parameter' });
    }

    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [memberships] = await pool.query(
      'SELECT club_id FROM club_members WHERE user_id = ? AND status = "approved"',
      [req.user.id]
    );

    if (memberships.length === 0) {
      return res.json([]);
    }

    const clubIds = memberships.map(m => m.club_id);

    const formattedDate = sinceDate.toISOString().slice(0, 19).replace('T', ' ');

    const [announcements] = await pool.query(
      `SELECT a.*, u.name as sender_name, c.name as club_name
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       JOIN clubs c ON a.club_id = c.id
       WHERE a.club_id IN (?) AND a.created_at > ? AND (a.status = 'published' OR (a.status = 'scheduled' AND a.scheduled_date <= NOW()))
       ORDER BY a.created_at DESC`,
      [clubIds, formattedDate]
    );

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching new announcements:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [announcements] = await pool.query(
      `SELECT a.*, u.name as sender_name, c.name as club_name
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       JOIN clubs c ON a.club_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json(announcements[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { club_id, title, content, scheduled_date } = req.body;

    if (!club_id || !title || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let status = 'published';
    let scheduledDate = null;

    if (scheduled_date) {
      const scheduledDateTime = new Date(scheduled_date);
      const now = new Date();

      if (scheduledDateTime <= now) {
        status = 'published';
      } else {
        status = 'scheduled';
        scheduledDate = scheduledDateTime;
      }
    }

    const [clubs] = await pool.query('SELECT * FROM clubs WHERE id = ?', [club_id]);
    if (clubs.length === 0) {
      return res.status(404).json({ message: 'Club not found' });
    }

    const [membership] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president" AND status = "approved"',
      [club_id, req.user.id]
    );

    const isAdmin = req.user.role === 'admin';
    const isPresident = membership.length > 0;

    if (!isAdmin && !isPresident) {
      return res.status(403).json({ message: 'Not authorized to create announcements for this club' });
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO announcements (club_id, created_by, title, content, scheduled_date, status) VALUES (?, ?, ?, ?, ?, ?)',
        [club_id, req.user.id, title, content, scheduledDate, status]
      );

      const [announcement] = await pool.query(
        `SELECT a.*, u.name as sender_name, c.name as club_name
         FROM announcements a
         JOIN users u ON a.created_by = u.id
         JOIN clubs c ON a.club_id = c.id
         WHERE a.id = ?`,
        [result.insertId]
      );

      const successMessage = status === 'scheduled'
        ? 'Announcement scheduled successfully'
        : 'Announcement created successfully';

      res.status(201).json({
        message: successMessage,
        announcement: announcement[0]
      });
    } catch (dbError) {
      console.error('Database error when creating announcement:', dbError);
      res.status(500).json({ message: 'Failed to create announcement. Please try again.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [announcements] = await pool.query(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const announcement = announcements[0];

    const [membership] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president" AND status = "approved"',
      [announcement.club_id, req.user.id]
    );

    const isAdmin = req.user.role === 'admin';
    const isPresident = membership.length > 0;
    const isSender = announcement.created_by === req.user.id;

    if (!isAdmin && !isPresident && !isSender) {
      return res.status(403).json({ message: 'Not authorized to delete this announcement' });
    }

    await pool.query('DELETE FROM announcements WHERE id = ?', [id]);

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me/unread-count', authenticateToken, async (req, res) => {
  try {
    const [memberships] = await pool.query(
      'SELECT club_id FROM club_members WHERE user_id = ? AND status = "approved"',
      [req.user.id]
    );

    if (memberships.length === 0) {
      return res.json({ count: 0 });
    }

    const clubIds = memberships.map(m => m.club_id);

    const placeholders = clubIds.map(() => '?').join(', ');

    const [result] = await pool.query(
      `SELECT COUNT(*) as count FROM announcements
       WHERE club_id IN (${placeholders}) AND (status = 'published' OR (status = 'scheduled' AND scheduled_date <= NOW()))`,
      [...clubIds]
    );

    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/club/:clubId/scheduled', authenticateToken, async (req, res) => {
  try {
    const { clubId } = req.params;

    const [membership] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president" AND status = "approved"',
      [clubId, req.user.id]
    );

    const isAdmin = req.user.role === 'admin';
    const isPresident = membership.length > 0;

    if (!isAdmin && !isPresident) {
      return res.status(403).json({ message: 'Not authorized to view scheduled announcements for this club' });
    }

    const [announcements] = await pool.query(
      `SELECT a.*, u.name as sender_name, c.name as club_name
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       JOIN clubs c ON a.club_id = c.id
       WHERE a.club_id = ? AND a.status = 'scheduled' AND a.scheduled_date > NOW()
       ORDER BY a.scheduled_date ASC`,
      [clubId]
    );

    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [announcements] = await pool.query(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const announcement = announcements[0];

    if (announcement.status !== 'scheduled') {
      return res.status(400).json({ message: 'Only scheduled announcements can be published' });
    }

    const [membership] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president" AND status = "approved"',
      [announcement.club_id, req.user.id]
    );

    const isAdmin = req.user.role === 'admin';
    const isPresident = membership.length > 0;
    const isCreator = announcement.created_by === req.user.id;

    if (!isAdmin && !isPresident && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to publish this announcement' });
    }

    await pool.query(
      'UPDATE announcements SET status = "published", scheduled_date = NULL WHERE id = ?',
      [id]
    );

    const [updatedAnnouncement] = await pool.query(
      `SELECT a.*, u.name as sender_name, c.name as club_name
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       JOIN clubs c ON a.club_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    res.json({
      message: 'Announcement published successfully',
      announcement: updatedAnnouncement[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
