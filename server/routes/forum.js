const express = require('express');
const router = express.Router();
const pool = require('../config/database').pool;
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/club/:clubId', async (req, res) => {
  try {
    const { clubId } = req.params;

    const [posts] = await pool.query(
      `SELECT fp.*, u.name as author_name, u.profile_image, 
       (SELECT COUNT(*) FROM forum_comments WHERE post_id = fp.post_id) as comment_count
       FROM forum_posts fp
       JOIN users u ON fp.user_id = u.id
       WHERE fp.club_id = ?
       ORDER BY fp.forum_timestamp DESC`,
      [clubId]
    );

    const postsWithImageUrl = posts.map(post => {
      if (post.profile_image) {
        post.profile_image_url = `${req.protocol}://${req.get('host')}/uploads/${post.profile_image}`;
      }
      return post;
    });

    res.json(postsWithImageUrl);
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const [posts] = await pool.query(
      `SELECT fp.*, u.name as author_name, u.profile_image
       FROM forum_posts fp
       JOIN users u ON fp.user_id = u.id
       WHERE fp.post_id = ?`,
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[0];
    if (post.profile_image) {
      post.profile_image_url = `${req.protocol}://${req.get('host')}/uploads/${post.profile_image}`;
    }

    const [comments] = await pool.query(
      `SELECT fc.*, u.name as author_name, u.profile_image
       FROM forum_comments fc
       JOIN users u ON fc.user_id = u.id
       WHERE fc.post_id = ?
       ORDER BY fc.comment_timestamp ASC`,
      [postId]
    );

    const commentsWithImageUrl = comments.map(comment => {
      if (comment.profile_image) {
        comment.profile_image_url = `${req.protocol}://${req.get('host')}/uploads/${comment.profile_image}`;
      }
      return comment;
    });

    res.json({
      post,
      comments: commentsWithImageUrl
    });
  } catch (error) {
    console.error('Error fetching forum post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { club_id, forum_title, forum_content } = req.body;

    if (!club_id || !forum_title || !forum_content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [membership] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND status = "approved"',
      [club_id, req.user.id]
    );

    if (membership.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You must be a member of this club to create a post' });
    }

    const [result] = await pool.query(
      'INSERT INTO forum_posts (club_id, user_id, forum_title, forum_content) VALUES (?, ?, ?, ?)',
      [club_id, req.user.id, forum_title, forum_content]
    );

    const [newPost] = await pool.query(
      `SELECT fp.*, u.name as author_name, u.profile_image
       FROM forum_posts fp
       JOIN users u ON fp.user_id = u.id
       WHERE fp.post_id = ?`,
      [result.insertId]
    );

    if (newPost[0].profile_image) {
      newPost[0].profile_image_url = `${req.protocol}://${req.get('host')}/uploads/${newPost[0].profile_image}`;
    }

    res.status(201).json({
      message: 'Forum post created successfully',
      post: newPost[0]
    });
  } catch (error) {
    console.error('Error creating forum post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment_content } = req.body;

    if (!comment_content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const [posts] = await pool.query('SELECT * FROM forum_posts WHERE post_id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const [membership] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND status = "approved"',
      [posts[0].club_id, req.user.id]
    );

    if (membership.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You must be a member of this club to comment' });
    }

    const [result] = await pool.query(
      'INSERT INTO forum_comments (post_id, user_id, comment_content) VALUES (?, ?, ?)',
      [postId, req.user.id, comment_content]
    );

    const [newComment] = await pool.query(
      `SELECT fc.*, u.name as author_name, u.profile_image
       FROM forum_comments fc
       JOIN users u ON fc.user_id = u.id
       WHERE fc.comment_id = ?`,
      [result.insertId]
    );

    if (newComment[0].profile_image) {
      newComment[0].profile_image_url = `${req.protocol}://${req.get('host')}/uploads/${newComment[0].profile_image}`;
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment[0]
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const [posts] = await pool.query('SELECT * FROM forum_posts WHERE post_id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[0];
    const isAuthor = post.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    const [clubPresidents] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president" AND status = "approved"',
      [post.club_id, req.user.id]
    );
    const isClubPresident = clubPresidents.length > 0;

    if (!isAuthor && !isAdmin && !isClubPresident) {
      return res.status(403).json({ message: 'You do not have permission to delete this post' });
    }

    await pool.query('DELETE FROM forum_posts WHERE post_id = ?', [postId]);

    res.json({ message: 'Forum post deleted successfully' });
  } catch (error) {
    console.error('Error deleting forum post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const [comments] = await pool.query(
      'SELECT * FROM forum_comments WHERE comment_id = ? AND post_id = ?',
      [commentId, postId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = comments[0];
    const isAuthor = comment.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    const [posts] = await pool.query('SELECT * FROM forum_posts WHERE post_id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const [clubPresidents] = await pool.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ? AND role = "president" AND status = "approved"',
      [posts[0].club_id, req.user.id]
    );
    const isClubPresident = clubPresidents.length > 0;

    if (!isAuthor && !isAdmin && !isClubPresident) {
      return res.status(403).json({ message: 'You do not have permission to delete this comment' });
    }

    await pool.query('DELETE FROM forum_comments WHERE comment_id = ?', [commentId]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
