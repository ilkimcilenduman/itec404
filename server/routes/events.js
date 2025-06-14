const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [events] = await pool.query(
      `SELECT e.*, c.name as club_name
       FROM events e
       JOIN clubs c ON e.club_id = c.id`
    );
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/club/:clubId', async (req, res) => {
  try {
    const [events] = await pool.query(
      `SELECT e.*, c.name as club_name
       FROM events e
       JOIN clubs c ON e.club_id = c.id
       WHERE e.club_id = ?`,
      [req.params.clubId]
    );
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [events] = await pool.query(
      `SELECT e.*, c.name as club_name
       FROM events e
       JOIN clubs c ON e.club_id = c.id
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(events[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('User attempting to create event:', {
      userId: req.user.id,
      userRole: req.user.role
    });

    const { title, description, date, location, club_id } = req.body;

    if (!title || !description || !date || !location || !club_id) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'club_president') {
      console.log('User role not authorized:', req.user.role);
      return res.status(403).json({ message: 'Access denied. Not authorized.' });
    }

    if (req.user.role === 'club_president') {
      console.log('Checking club presidency for club_id:', club_id);
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [club_id, req.user.id]
      );

      console.log('Club presidency check result:', clubPresidents);

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'Not authorized to create events for this club' });
      }
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO events (title, description, date, location, club_id) VALUES (?, ?, ?, ?, ?)',
        [title, description, date, location, club_id]
      );

      res.status(201).json({
        id: result.insertId,
        title,
        description,
        date,
        location,
        club_id
      });
    } catch (dbError) {
      console.error('Database error when creating event:', dbError);
      res.status(500).json({ message: 'Failed to save the event. Please try again.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    const eventId = req.params.id;

    const [events] = await pool.query('SELECT club_id FROM events WHERE id = ?', [eventId]);

    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const clubId = events[0].club_id;

    if (req.user.role !== 'admin' && req.user.role !== 'club_president') {
      return res.status(403).json({ message: 'Access denied. Not authorized.' });
    }

    if (req.user.role === 'club_president') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [clubId, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'Not authorized to update events for this club' });
      }
    }

    await pool.query(
      'UPDATE events SET title = ?, description = ?, date = ?, location = ? WHERE id = ?',
      [title, description, date, location, eventId]
    );

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;

    const [events] = await pool.query('SELECT club_id FROM events WHERE id = ?', [eventId]);

    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const clubId = events[0].club_id;

    if (req.user.role !== 'admin' && req.user.role !== 'club_president') {
      return res.status(403).json({ message: 'Access denied. Not authorized.' });
    }

    if (req.user.role === 'club_president') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [clubId, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'Not authorized to delete events for this club' });
      }
    }

    await pool.query('DELETE FROM events WHERE id = ?', [eventId]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const [existingRegistrations] = await pool.query(
      'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (existingRegistrations.length > 0) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    await pool.query(
      'INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)',
      [eventId, userId]
    );

    res.status(201).json({ message: 'Successfully registered for event' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/registrations', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;

    const [events] = await pool.query('SELECT club_id FROM events WHERE id = ?', [eventId]);

    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const clubId = events[0].club_id;

    if (req.user.role !== 'admin' && req.user.role !== 'club_president') {
      return res.status(403).json({ message: 'Access denied. Not authorized.' });
    }

    if (req.user.role === 'club_president') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [clubId, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'Not authorized to view registrations for this event' });
      }
    }

    const [registrations] = await pool.query(
      `SELECT er.*, u.name, u.email, u.student_id
       FROM event_registrations er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id = ?`,
      [eventId]
    );

    res.json(registrations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
