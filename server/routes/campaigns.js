import express from 'express';

const router = express.Router();

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await req.dbManager.getCampaigns();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new campaign
router.post('/', async (req, res) => {
  try {
    const result = await req.dbManager.createCampaign(req.body);
    res.json({ success: true, id: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start campaign
router.post('/:id/start', async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    // Get campaign details
    const campaigns = await req.dbManager.getCampaigns();
    const campaign = campaigns.find(c => c.id == campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get contacts and SMTP config
    const contacts = await req.dbManager.getContactsFromList(campaign.list_id);
    const smtpConfig = await req.dbManager.getSMTPConfig(campaign.smtp_config_id);

    if (!smtpConfig) {
      return res.status(400).json({ error: 'SMTP configuration not found' });
    }

    // Update total count
    await req.dbManager.runQuery(
      'UPDATE campaigns SET total_count = ? WHERE id = ?',
      [contacts.length, campaignId]
    );

    // Add to job queue
    const jobId = await req.jobQueue.addCampaignJob(campaign, contacts, smtpConfig);
    
    res.json({ success: true, jobId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign status
router.get('/:id/status', async (req, res) => {
  try {
    const jobId = `campaign-${req.params.id}`;
    const jobStatus = req.jobQueue.getJobStatus(jobId);
    
    if (!jobStatus) {
      // Get from database if not in queue
      const campaigns = await req.dbManager.getCampaigns();
      const campaign = campaigns.find(c => c.id == req.params.id);
      
      if (campaign) {
        return res.json({
          status: campaign.status,
          sentCount: campaign.sent_count,
          totalCount: campaign.total_count
        });
      }
      
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({
      status: jobStatus.status,
      sentCount: jobStatus.sentCount,
      totalCount: jobStatus.totalCount,
      errors: jobStatus.errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;