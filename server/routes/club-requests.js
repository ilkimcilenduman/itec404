const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  try {
    const [requests] = await pool.query(
      `SELECT cr.*, u.name as requester_name, u.email as requester_email
       FROM club_requests cr
       JOIN users u ON cr.requester_id = u.id
       ORDER BY cr.created_at DESC`
    );
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/status/:status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  try {
    const { status } = req.params;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [requests] = await pool.query(
      `SELECT cr.*, u.name as requester_name, u.email as requester_email
       FROM club_requests cr
       JOIN users u ON cr.requester_id = u.id
       WHERE cr.status = ?
       ORDER BY cr.created_at DESC`,
      [status]
    );
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [requests] = await pool.query(
      `SELECT cr.*, u.name as requester_name, u.email as requester_email
       FROM club_requests cr
       JOIN users u ON cr.requester_id = u.id
       WHERE cr.id = ?`,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Club request not found' });
    }

    const request = requests[0];

    if (req.user.role !== 'admin' && req.user.id !== request.requester_id) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user/me', authenticateToken, async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT * FROM club_requests WHERE requester_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Club name is required' });
    }

    const [existingClubs] = await pool.query(
      'SELECT * FROM clubs WHERE name = ?',
      [name]
    );

    if (existingClubs.length > 0) {
      return res.status(400).json({ message: 'A club with this name already exists' });
    }

    const [existingRequests] = await pool.query(
      'SELECT * FROM club_requests WHERE name = ? AND status = "pending"',
      [name]
    );

    if (existingRequests.length > 0) {
      return res.status(400).json({ message: 'A pending request for this club name already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO club_requests (name, description, category, requester_id) VALUES (?, ?, ?, ?)',
      [name, description || '', category || '', req.user.id]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      category,
      requester_id: req.user.id,
      status: 'pending',
      message: 'Club request submitted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Club name is required' });
    }

    const [requests] = await pool.query(
      'SELECT * FROM club_requests WHERE id = ?',
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Club request not found' });
    }

    const request = requests[0];

    if (req.user.id !== request.requester_id) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update a request that has already been processed' });
    }

    if (name !== request.name) {
      const [existingClubs] = await pool.query(
        'SELECT * FROM clubs WHERE name = ?',
        [name]
      );

      if (existingClubs.length > 0) {
        return res.status(400).json({ message: 'A club with this name already exists' });
      }

      const [existingRequests] = await pool.query(
        'SELECT * FROM club_requests WHERE name = ? AND status = "pending" AND id != ?',
        [name, id]
      );

      if (existingRequests.length > 0) {
        return res.status(400).json({ message: 'A pending request for this club name already exists' });
      }
    }

    await pool.query(
      'UPDATE club_requests SET name = ?, description = ?, category = ? WHERE id = ?',
      [name, description || '', category || '', id]
    );

    res.json({
      id: parseInt(id),
      name,
      description,
      category,
      requester_id: req.user.id,
      status: 'pending',
      message: 'Club request updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/process', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_feedback } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either approved or rejected' });
    }

    const [requests] = await pool.query(
      'SELECT * FROM club_requests WHERE id = ?',
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Club request not found' });
    }

    const request = requests[0];

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        'UPDATE club_requests SET status = ?, admin_feedback = ? WHERE id = ?',
        [status, admin_feedback || '', id]
      );

      if (status === 'approved') {
        const [existingClubs] = await connection.query(
          'SELECT * FROM clubs WHERE name = ?',
          [request.name]
        );

        if (existingClubs.length > 0) {
          await connection.rollback();
          return res.status(400).json({ message: 'A club with this name already exists' });
        }

        const [clubResult] = await connection.query(
          'INSERT INTO clubs (name, description, category) VALUES (?, ?, ?)',
          [request.name, request.description, request.category]
        );

        const clubId = clubResult.insertId;

        await connection.query(
          'INSERT INTO club_members (club_id, user_id, role, status) VALUES (?, ?, ?, ?)',
          [clubId, request.requester_id, 'president', 'approved']
        );

        const [userInfo] = await connection.query(
          'SELECT role FROM users WHERE id = ?',
          [request.requester_id]
        );

        if (userInfo.length > 0 && userInfo[0].role === 'student') {
          await connection.query(
            'UPDATE users SET role = ? WHERE id = ?',
            ['club_president', request.requester_id]
          );
        }
      }

      await connection.commit();

      res.json({
        id: parseInt(id),
        status,
        admin_feedback,
        message: `Club request ${status === 'approved' ? 'approved' : 'rejected'} successfully`
      });
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

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [requests] = await pool.query(
      'SELECT * FROM club_requests WHERE id = ?',
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Club request not found' });
    }

    const request = requests[0];

    if (req.user.id !== request.requester_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    if (req.user.role !== 'admin' && request.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete a request that has already been processed' });
    }

    await pool.query(
      'DELETE FROM club_requests WHERE id = ?',
      [id]
    );

    res.json({ message: 'Club request deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
