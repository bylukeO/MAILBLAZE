import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import CryptoJS from 'crypto-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/sender.db');
    this.db = null;
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'simple-sender-default-key-change-in-production';
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('Connected to SQLite database');
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS smtp_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        encryption TEXT DEFAULT 'tls',
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS contact_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (list_id) REFERENCES contact_lists (id),
        UNIQUE(list_id, email)
      )`,
      
      `CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        smtp_config_id INTEGER NOT NULL,
        list_id INTEGER NOT NULL,
        status TEXT DEFAULT 'draft',
        sent_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 0,
        rate_limit INTEGER DEFAULT 10,
        rate_interval INTEGER DEFAULT 60,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        FOREIGN KEY (smtp_config_id) REFERENCES smtp_configs (id),
        FOREIGN KEY (list_id) REFERENCES contact_lists (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS campaign_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        contact_email TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
      )`
    ];

    for (const sql of tables) {
      await this.runQuery(sql);
    }
  }

  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  encryptPassword(password) {
    return CryptoJS.AES.encrypt(password, this.encryptionKey).toString();
  }

  decryptPassword(encryptedPassword) {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // SMTP Config methods
  async saveSMTPConfig(config) {
    const encryptedPassword = this.encryptPassword(config.password);
    
    if (config.is_default) {
      await this.runQuery('UPDATE smtp_configs SET is_default = 0');
    }

    const sql = `INSERT OR REPLACE INTO smtp_configs 
                 (name, host, port, username, password, encryption, is_default) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    return this.runQuery(sql, [
      config.name,
      config.host,
      config.port,
      config.username,
      encryptedPassword,
      config.encryption,
      config.is_default ? 1 : 0
    ]);
  }

  async getSMTPConfigs() {
    const configs = await this.allQuery('SELECT * FROM smtp_configs ORDER BY is_default DESC, name');
    return configs.map(config => ({
      ...config,
      password: this.decryptPassword(config.password)
    }));
  }

  async getSMTPConfig(id) {
    const config = await this.getQuery('SELECT * FROM smtp_configs WHERE id = ?', [id]);
    if (config) {
      config.password = this.decryptPassword(config.password);
    }
    return config;
  }

  // Contact List methods
  async createContactList(name, description = '') {
    const sql = 'INSERT INTO contact_lists (name, description) VALUES (?, ?)';
    return this.runQuery(sql, [name, description]);
  }

  async getContactLists() {
    const sql = `SELECT cl.*, COUNT(c.id) as contact_count 
                 FROM contact_lists cl 
                 LEFT JOIN contacts c ON cl.id = c.list_id 
                 GROUP BY cl.id 
                 ORDER BY cl.created_at DESC`;
    return this.allQuery(sql);
  }

  async addContactsToList(listId, contacts) {
    const sql = 'INSERT OR IGNORE INTO contacts (list_id, email, name) VALUES (?, ?, ?)';
    const results = [];
    
    for (const contact of contacts) {
      try {
        const result = await this.runQuery(sql, [listId, contact.email, contact.name || '']);
        results.push(result);
      } catch (error) {
        console.error('Error adding contact:', error);
      }
    }
    
    return results;
  }

  async getContactsFromList(listId) {
    const sql = 'SELECT * FROM contacts WHERE list_id = ? ORDER BY email';
    return this.allQuery(sql, [listId]);
  }

  // Campaign methods
  async createCampaign(campaign) {
    const sql = `INSERT INTO campaigns 
                 (name, subject, content, smtp_config_id, list_id, rate_limit, rate_interval) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    return this.runQuery(sql, [
      campaign.name,
      campaign.subject,
      campaign.content,
      campaign.smtp_config_id,
      campaign.list_id,
      campaign.rate_limit || 10,
      campaign.rate_interval || 60
    ]);
  }

  async getCampaigns() {
    const sql = `SELECT c.*, cl.name as list_name, sc.name as smtp_name 
                 FROM campaigns c 
                 LEFT JOIN contact_lists cl ON c.list_id = cl.id 
                 LEFT JOIN smtp_configs sc ON c.smtp_config_id = sc.id 
                 ORDER BY c.created_at DESC`;
    return this.allQuery(sql);
  }

  async updateCampaignStatus(campaignId, status, sentCount = null) {
    let sql = 'UPDATE campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params = [status, campaignId];
    
    if (status === 'sending' && sentCount === null) {
      sql += ', started_at = CURRENT_TIMESTAMP';
    } else if (status === 'completed') {
      sql += ', completed_at = CURRENT_TIMESTAMP';
    }
    
    if (sentCount !== null) {
      sql += ', sent_count = ?';
      params.splice(1, 0, sentCount);
    }
    
    sql += ' WHERE id = ?';
    
    return this.runQuery(sql, params);
  }

  async logCampaignSend(campaignId, email, status, errorMessage = null) {
    const sql = 'INSERT INTO campaign_logs (campaign_id, contact_email, status, error_message) VALUES (?, ?, ?, ?)';
    return this.runQuery(sql, [campaignId, email, status, errorMessage]);
  }
}