const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, admin } = require('../middleware/auth');
const { list, upload, download, remove } = require('../controllers/reportController');

const router = express.Router();

// ensure upload dir exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'reports');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, safe);
  },
});

const uploadMiddleware = multer({ storage });

// list reports (patient sees own, admin sees all)
router.get('/', auth, list);

// admin uploads a report for a patient
router.post('/upload', [auth, admin, uploadMiddleware.single('file')], upload);

// download report (owner or admin)
router.get('/:id/download', auth, download);

// delete report (admin)
router.delete('/:id', [auth, admin], remove);

module.exports = { reportsRouter: router };
