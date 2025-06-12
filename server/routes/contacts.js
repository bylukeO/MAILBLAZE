import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get all contact lists
router.get('/lists', async (req, res) => {
  try {
    const lists = await req.dbManager.getContactLists();
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new contact list
router.post('/lists', async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await req.dbManager.createContactList(name, description);
    res.json({ success: true, id: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add contacts to list (bulk)
router.post('/lists/:id/contacts', async (req, res) => {
  try {
    const listId = req.params.id;
    const { contacts } = req.body;
    
    const results = await req.dbManager.addContactsToList(listId, contacts);
    res.json({ success: true, added: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get contacts from list
router.get('/lists/:id/contacts', async (req, res) => {
  try {
    const contacts = await req.dbManager.getContactsFromList(req.params.id);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import contacts from CSV
router.post('/lists/:id/import', upload.single('csv'), async (req, res) => {
  try {
    const listId = req.params.id;
    const contacts = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        if (row.email || row.Email || row.EMAIL) {
          contacts.push({
            email: row.email || row.Email || row.EMAIL,
            name: row.name || row.Name || row.NAME || ''
          });
        }
      })
      .on('end', async () => {
        try {
          const results = await req.dbManager.addContactsToList(listId, contacts);
          fs.unlinkSync(req.file.path); // Clean up temp file
          res.json({ success: true, imported: results.length });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;