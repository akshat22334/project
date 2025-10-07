const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadAndProcessPDF } = require('../controllers/pdfController');

const upload = multer({ dest: 'data/input_pdfs/' });

// Keep array for multiple files
router.post('/upload', upload.array('files'), uploadAndProcessPDF);

module.exports = router;
