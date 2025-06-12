import nodemailer from 'nodemailer';

export class EmailService {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.transporters = new Map();
  }

  async createTransporter(smtpConfig) {
    const key = `${smtpConfig.host}:${smtpConfig.port}:${smtpConfig.username}`;
    
    if (this.transporters.has(key)) {
      return this.transporters.get(key);
    }

    const config = {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    };

    if (smtpConfig.encryption === 'tls') {
      config.requireTLS = true;
      config.tls = { rejectUnauthorized: false };
    }

    // const transporter = nodemailer.createTransporter(config);
    const transporter = nodemailer.createTransport(config);
    this.transporters.set(key, transporter);
    
    return transporter;
  }

  async testConnection(smtpConfig) {
    try {
      const transporter = await this.createTransporter(smtpConfig);
      await transporter.verify();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      console.error('SMTP Test Error:', error); // Add this line for debugging
      return { success: false, message: error.message };
    }
  }

  async sendEmail(smtpConfig, to, subject, content) {
    try {
      const transporter = await this.createTransporter(smtpConfig);
      
      const mailOptions = {
        from: `"${smtpConfig.name}" <${smtpConfig.username}>`,
        to: to,
        subject: subject,
        html: content,
      };

      const result = await transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}