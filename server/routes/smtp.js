import express from 'express';

const router = express.Router();

// Get all SMTP configurations
router.get('/', async (req, res) => {
  try {
    const configs = await req.dbManager.getSMTPConfigs();
    // Don't send passwords to frontend
    const safeConfigs = configs.map(config => ({
      ...config,
      password: '***encrypted***'
    }));
    res.json(safeConfigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save SMTP configuration
router.post('/', async (req, res) => {
  try {
    const result = await req.dbManager.saveSMTPConfig(req.body);
    res.json({ success: true, id: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test SMTP connection
router.post('/test', async (req, res) => {
  try {
    const result = await req.emailService.testConnection(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get SMTP config for editing (includes password)
router.get('/:id', async (req, res) => {
  try {
    const config = await req.dbManager.getSMTPConfig(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'SMTP configuration not found' });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;