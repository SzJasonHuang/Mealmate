const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const connection = getConnection();
    const [favorites] = await connection.execute(
      'SELECT recipe_id, recipe_title, recipe_image, created_at FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json({ favorites });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Add recipe to favorites
router.post('/favorites', authenticateToken, [
  body('recipeId').isInt().withMessage('Recipe ID must be an integer'),
  body('recipeTitle').notEmpty().withMessage('Recipe title is required'),
  body('recipeImage').optional().isURL().withMessage('Recipe image must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { recipeId, recipeTitle, recipeImage } = req.body;
    const connection = getConnection();

    // Check if already favorited
    const [existing] = await connection.execute(
      'SELECT id FROM user_favorites WHERE user_id = ? AND recipe_id = ?',
      [req.user.userId, recipeId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Recipe already in favorites' });
    }

    // Add to favorites
    await connection.execute(
      'INSERT INTO user_favorites (user_id, recipe_id, recipe_title, recipe_image) VALUES (?, ?, ?, ?)',
      [req.user.userId, recipeId, recipeTitle, recipeImage || null]
    );

    res.status(201).json({ message: 'Recipe added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove recipe from favorites
router.delete('/favorites/:recipeId', authenticateToken, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const connection = getConnection();

    const [result] = await connection.execute(
      'DELETE FROM user_favorites WHERE user_id = ? AND recipe_id = ?',
      [req.user.userId, recipeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Recipe removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// Get user search history
router.get('/search-history', authenticateToken, async (req, res) => {
  try {
    const connection = getConnection();
    const [history] = await connection.execute(
      'SELECT DISTINCT search_query, MAX(created_at) as last_searched FROM user_search_history WHERE user_id = ? GROUP BY search_query ORDER BY last_searched DESC LIMIT 20',
      [req.user.userId]
    );

    res.json({ history });
  } catch (error) {
    console.error('Fetch search history error:', error);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

// Add search query to history
router.post('/search-history', authenticateToken, [
  body('query').notEmpty().withMessage('Search query is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { query } = req.body;
    const connection = getConnection();

    await connection.execute(
      'INSERT INTO user_search_history (user_id, search_query) VALUES (?, ?)',
      [req.user.userId, query]
    );

    res.status(201).json({ message: 'Search query saved' });
  } catch (error) {
    console.error('Save search history error:', error);
    res.status(500).json({ error: 'Failed to save search history' });
  }
});

// Clear search history
router.delete('/search-history', authenticateToken, async (req, res) => {
  try {
    const connection = getConnection();
    await connection.execute(
      'DELETE FROM user_search_history WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({ message: 'Search history cleared' });
  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({ error: 'Failed to clear search history' });
  }
});

module.exports = router;