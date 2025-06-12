import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseManager } from './database/manager.js';
import { EmailService } from './services/emailService.js';
import { JobQueue } from './services/jobQueue.js';
import smtpRoutes from './routes/smtp.js';
import contactRoutes from './routes/contacts.js';
import campaignRoutes from './routes/campaigns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const dbManager = new DatabaseManager();
const emailService = new EmailService(dbManager);
const jobQueue = new JobQueue(emailService);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Make services available to routes
app.use((req, res, next) => {
  req.dbManager = dbManager;
  req.emailService = emailService;
  req.jobQueue = jobQueue;
  next();
});

// Routes
app.use('/api/smtp', smtpRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/campaigns', campaignRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    await dbManager.initialize();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Simple Sender running on http://localhost:${PORT}`);
      console.log('📧 Ready to send emails with your private SMTP servers');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();