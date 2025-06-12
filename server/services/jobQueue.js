export class JobQueue {
  constructor(emailService) {
    this.emailService = emailService;
    this.jobs = new Map();
    this.isProcessing = false;
  }

  async addCampaignJob(campaign, contacts, smtpConfig) {
    const jobId = `campaign-${campaign.id}`;
    
    const job = {
      id: jobId,
      campaignId: campaign.id,
      campaign,
      contacts,
      smtpConfig,
      status: 'queued',
      sentCount: 0,
      totalCount: contacts.length,
      errors: [],
      createdAt: new Date(),
      rateLimit: campaign.rate_limit || 10,
      rateInterval: (campaign.rate_interval || 60) * 1000, // Convert to milliseconds
    };

    this.jobs.set(jobId, job);
    
    if (!this.isProcessing) {
      this.processJobs();
    }

    return jobId;
  }

  async processJobs() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    while (this.jobs.size > 0) {
      const queuedJobs = Array.from(this.jobs.values()).filter(job => job.status === 'queued');
      
      if (queuedJobs.length === 0) {
        break;
      }

      const job = queuedJobs[0];
      await this.processJob(job);
    }

    this.isProcessing = false;
  }

  async processJob(job) {
    try {
      job.status = 'processing';
      await this.emailService.dbManager.updateCampaignStatus(job.campaignId, 'sending');

      const batchSize = job.rateLimit;
      const batchDelay = job.rateInterval;

      for (let i = 0; i < job.contacts.length; i += batchSize) {
        const batch = job.contacts.slice(i, i + batchSize);
        
        // Process batch
        for (const contact of batch) {
          try {
            const result = await this.emailService.sendEmail(
              job.smtpConfig,
              contact.email,
              job.campaign.subject,
              job.campaign.content
            );

            if (result.success) {
              job.sentCount++;
              await this.emailService.dbManager.logCampaignSend(
                job.campaignId,
                contact.email,
                'sent'
              );
            } else {
              job.errors.push({
                email: contact.email,
                error: result.error
              });
              await this.emailService.dbManager.logCampaignSend(
                job.campaignId,
                contact.email,
                'failed',
                result.error
              );
            }

            await this.emailService.dbManager.updateCampaignStatus(
              job.campaignId,
              'sending',
              job.sentCount
            );

          } catch (error) {
            job.errors.push({
              email: contact.email,
              error: error.message
            });
          }
        }

        // Rate limiting delay between batches
        if (i + batchSize < job.contacts.length) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      }

      job.status = 'completed';
      await this.emailService.dbManager.updateCampaignStatus(job.campaignId, 'completed');
      
      // Clean up completed job after 1 hour
      setTimeout(() => {
        this.jobs.delete(job.id);
      }, 3600000);

    } catch (error) {
      job.status = 'failed';
      job.errors.push({ error: error.message });
      await this.emailService.dbManager.updateCampaignStatus(job.campaignId, 'failed');
    }
  }

  getJobStatus(jobId) {
    return this.jobs.get(jobId);
  }

  getAllJobStatuses() {
    return Array.from(this.jobs.values());
  }
}