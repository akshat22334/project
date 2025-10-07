const fs = require('fs');
const { categorizeText } = require('../services/categorizer');
const { extractMetadata } = require('../services/metadata');
const { adaCheck } = require('../services/adaChecker');
const pdfParse = require('../services/pdfParser'); // your custom parser

async function uploadAndProcessPDF(req, res) {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
      
        const results = [];    

        for (const file of files) {
            let text = '';
            let pdfInfo = {};

            try {
                const dataBuffer = fs.readFileSync(file.path);
                pdfInfo = await pdfParse(dataBuffer);
                text = pdfInfo.text.trim();
            } catch (err) {
                console.error(`Error parsing PDF: ${file.originalname}`, err);
                text = '';
                pdfInfo = { numPages: 0, info: {} };
            }

            // Categorize PDF
            const category = categorizeText(text);

            // Extract metadata
            const metadata = extractMetadata(file.originalname, text, pdfInfo);
            metadata.pages = pdfInfo.numPages; // set actual page count

            // ADA compliance
            const adaReport = await adaCheck(file.path);
            
            results.push({
                filename: file.originalname,
                category,       // just the category label
                metadata,       // includes pages
                adaReport
            });
        }

        res.json({ results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process PDFs' });
    }
}

module.exports = { uploadAndProcessPDF }