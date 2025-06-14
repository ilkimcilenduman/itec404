const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [elections] = await pool.query(
      `SELECT e.*, c.name as club_name
       FROM elections e
       JOIN clubs c ON e.club_id = c.id
       ORDER BY e.start_date DESC`
    );
    res.json(elections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/club/:clubId', async (req, res) => {
  try {
    const { clubId } = req.params;

    const [elections] = await pool.query(
      `SELECT e.*, c.name as club_name
       FROM elections e
       JOIN clubs c ON e.club_id = c.id
       WHERE e.club_id = ?
       ORDER BY e.start_date DESC`,
      [clubId]
    );

    res.json(elections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [elections] = await pool.query(
      `SELECT e.*, c.name as club_name
       FROM elections e
       JOIN clubs c ON e.club_id = c.id
       WHERE e.id = ?`,
      [id]
    );

    if (elections.length === 0) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const election = elections[0];

    const [candidates] = await pool.query(
      `SELECT ec.*, u.name, u.email, u.student_id
       FROM election_candidates ec
       JOIN users u ON ec.user_id = u.id
       WHERE ec.election_id = ?`,
      [id]
    );

    res.json({
      ...election,
      candidates
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, authorizeRole(['admin', 'club_president']), async (req, res) => {
  try {
    const { club_id, title, description, start_date, end_date } = req.body;

    if (!club_id || !title || !start_date || !end_date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (req.user.role !== 'admin') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [club_id, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'You are not authorized to create elections for this club' });
      }
    }

    const now = new Date();
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    let status = 'upcoming';
    if (now >= startDate && now <= endDate) {
      status = 'active';
    } else if (now > endDate) {
      status = 'completed';
    }

    const [result] = await pool.query(
      'INSERT INTO elections (club_id, title, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [club_id, title, description, start_date, end_date, status]
    );

    res.status(201).json({
      id: result.insertId,
      club_id,
      title,
      description,
      start_date,
      end_date,
      status,
      message: 'Election created successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/roles', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [elections] = await pool.query('SELECT * FROM elections WHERE id = ?', [id]);

    if (elections.length === 0) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const [roles] = await pool.query(
      'SELECT * FROM election_roles WHERE election_id = ? ORDER BY role_name',
      [id]
    );

    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/roles', authenticateToken, authorizeRole(['admin', 'club_president']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role_name, description } = req.body;

    if (!role_name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const [elections] = await pool.query('SELECT club_id, status FROM elections WHERE id = ?', [id]);

    if (elections.length === 0) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const election = elections[0];

    if (req.user.role !== 'admin') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [election.club_id, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'You are not authorized to add roles to this election' });
      }
    }

    const [existingRoles] = await pool.query(
      'SELECT * FROM election_roles WHERE election_id = ? AND role_name = ?',
      [id, role_name]
    );

    if (existingRoles.length > 0) {
      return res.status(400).json({ message: 'This role already exists for this election' });
    }

    const [result] = await pool.query(
      'INSERT INTO election_roles (election_id, role_name, description) VALUES (?, ?, ?)',
      [id, role_name, description || '']
    );

    res.status(201).json({
      id: result.insertId,
      election_id: parseInt(id),
      role_name,
      description: description || ''
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/roles/:roleId', authenticateToken, authorizeRole(['admin', 'club_president']), async (req, res) => {
  try {
    const { id, roleId } = req.params;

    const [elections] = await pool.query('SELECT club_id, status FROM elections WHERE id = ?', [id]);

    if (elections.length === 0) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const election = elections[0];

    if (req.user.role !== 'admin') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [election.club_id, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'You are not authorized to delete roles from this election' });
      }
    }

    const [roles] = await pool.query(
      'SELECT * FROM election_roles WHERE id = ? AND election_id = ?',
      [roleId, id]
    );

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    await pool.query('DELETE FROM election_roles WHERE id = ?', [roleId]);

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/apply', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id, statement } = req.body;
    const user_id = req.user.id;

    if (!role_id) {
      return res.status(400).json({ message: 'Role ID is required' });
    }

    const [elections] = await pool.query('SELECT club_id, status FROM elections WHERE id = ?', [id]);

    if (elections.length === 0) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const election = elections[0];

    if (election.status === 'completed') {
      return res.status(400).json({ message: 'Cannot apply for a completed election' });
    }

    const [roles] = await pool.query(
      'SELECT * FROM election_roles WHERE id = ? AND election_id = ?',
      [role_id, id]
    );

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const [clubMembers] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND status = "approved"',
      [election.club_id, user_id]
    );

    if (clubMembers.length === 0) {
      return res.status(403).json({ message: 'You must be a member of this club to apply for candidacy' });
    }

    const [existingApplications] = await pool.query(
      'SELECT * FROM candidate_applications WHERE election_id = ? AND user_id = ? AND role_id = ?',
      [id, user_id, role_id]
    );

    if (existingApplications.length > 0) {
      return res.status(400).json({ message: 'You have already applied for this role in this election' });
    }

    await pool.query(
      'INSERT INTO candidate_applications (election_id, role_id, user_id, statement, status) VALUES (?, ?, ?, ?, "pending")',
      [id, role_id, user_id, statement || '']
    );

    res.status(201).json({ message: 'Your application has been submitted and is pending approval' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/applications', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [elections] = await pool.query('SELECT club_id FROM elections WHERE id = ?', [id]);

    if (elections.length === 0) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const election = elections[0];

    if (req.user.role !== 'admin') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [election.club_id, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'You are not authorized to view applications for this election' });
      }
    }

    const [applications] = await pool.query(
      `SELECT ca.*, u.name, u.email, u.student_id
       FROM candidate_applications ca
       JOIN users u ON ca.user_id = u.id
       WHERE ca.election_id = ?
       ORDER BY ca.created_at DESC`,
      [id]
    );

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/applications/:applicationId', authenticateToken, authorizeRole(['admin', 'club_president']), async (req, res) => {
  try {
    const { id, applicationId } = req.params;
    const { status } = req.body; 

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ message: 'Status must be either "approved" or "rejected"' });
    }

    const [elections] = await pool.query('SELECT club_id FROM elections WHERE id = ?', [id]);

    if (elections.length === 0) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const election = elections[0];

    if (req.user.role !== 'admin') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [election.club_id, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'You are not authorized to manage applications for this election' });
      }
    }

    const [applications] = await pool.query(
      'SELECT * FROM candidate_applications WHERE id = ? AND election_id = ?',
      [applicationId, id]
    );

    if (applications.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const application = applications[0];

    await pool.query(
      'UPDATE candidate_applications SET status = ? WHERE id = ?',
      [status, applicationId]
    );

    if (status === 'approved') {
      try {
        const [roles] = await pool.query('SELECT * FROM election_roles WHERE id = ?', [application.role_id]);
        const role = roles.length > 0 ? roles[0] : null;

        const [users] = await pool.query('SELECT name FROM users WHERE id = ?', [application.user_id]);
        const user = users.length > 0 ? users[0] : null;

        await pool.query(
          'INSERT INTO election_candidates (election_id, user_id, role_id, position, statement) VALUES (?, ?, ?, ?, ?)',
          [id, application.user_id, application.role_id, role ? role.role_name : 'Candidate', application.statement]
        );
      } catch (dbError) {
        console.error('Error adding candidate:', dbError);
      }
    }

    res.json({ message: `Application ${status}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/candidates', authenticateToken, authorizeRole(['admin', 'club_president']), async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, position, statement } = req.body;

    if (!user_id || !position) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [elections] = await pool.query('SELECT club_id, status FROM elections WHERE id = ?', [id]);

    if (elections.length === 0) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const election = elections[0];

    if (election.status === 'completed') {
      return res.status(400).json({ message: 'Cannot add candidates to a completed election' });
    }

    if (req.user.role !== 'admin') {
      const [clubPresidents] = await pool.query(
        'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president"',
        [election.club_id, req.user.id]
      );

      if (clubPresidents.length === 0) {
        return res.status(403).json({ message: 'You are not authorized to add candidates to this election' });
      }
    }

    const [clubMembers] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND status = "approved"',
      [election.club_id, user_id]
    );

    if (clubMembers.length === 0) {
      return res.status(400).json({ message: 'User is not a member of this club' });
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO election_candidates (election_id, user_id, position, statement) VALUES (?, ?, ?, ?)',
        [id, user_id, position, statement || '']
      );

      res.status(201).json({
        id: result.insertId,
        election_id: id,
        user_id,
        position,
        statement,
        message: 'Candidate added successfully'
      });
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'This user is already a candidate for this position' });
      }
      throw dbError;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/vote', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { candidate_id } = req.body;

    if (!candidate_id) {
      return res.status(400).json({ message: 'Candidate ID is required' });
    }

    const [elections] = await pool.query(
      'SELECT club_id, status FROM elections WHERE id = ?',
      [id]
    );

    if (elections.length === 0) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const election = elections[0];

    if (election.status !== 'active') {
      return res.status(400).json({ message: 'This election is not currently active' });
    }

    const [clubMembers] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND status = "approved"',
      [election.club_id, req.user.id]
    );

    if (clubMembers.length === 0) {
      return res.status(403).json({ message: 'You must be a member of this club to vote' });
    }

    const [candidates] = await pool.query(
      'SELECT * FROM election_candidates WHERE id = ? AND election_id = ?',
      [candidate_id, id]
    );

    if (candidates.length === 0) {
      return res.status(404).json({ message: 'Candidate not found in this election' });
    }

    const [existingVotes] = await pool.query(
      'SELECT * FROM election_votes WHERE election_id = ? AND voter_id = ?',
      [id, req.user.id]
    );

    if (existingVotes.length > 0) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    try {
      await pool.query(
        'INSERT INTO election_votes (election_id, candidate_id, voter_id) VALUES (?, ?, ?)',
        [id, candidate_id, req.user.id]
      );

      res.json({ message: 'Vote recorded successfully' });
    } catch (dbError) {
      console.error('Database error when recording vote:', dbError);
      res.status(500).json({ message: 'Failed to record your vote. Please try again.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;

    const [elections] = await pool.query(
      'SELECT status FROM elections WHERE id = ?',
      [id]
    );

    if (elections.length === 0) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const election = elections[0];

    if (election.status !== 'completed') {
      return res.status(403).json({ message: 'Results are only available for completed elections' });
    }

    const [results] = await pool.query(
      `SELECT ec.id, ec.position, ec.user_id, u.name, COUNT(ev.id) as vote_count
       FROM election_candidates ec
       LEFT JOIN election_votes ev ON ec.id = ev.candidate_id
       JOIN users u ON ec.user_id = u.id
       WHERE ec.election_id = ?
       GROUP BY ec.id
       ORDER BY ec.position, vote_count DESC`,
      [id]
    );

    const [totalVotes] = await pool.query(
      'SELECT COUNT(*) as total FROM election_votes WHERE election_id = ?',
      [id]
    );

    res.json({
      results,
      total_votes: totalVotes[0].total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/has-voted', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [votes] = await pool.query(
      'SELECT * FROM election_votes WHERE election_id = ? AND voter_id = ?',
      [id, req.user.id]
    );

    res.json({ hasVoted: votes.length > 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
