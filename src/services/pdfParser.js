// const pdfParseLib = require('pdf-parse');

// async function pdfParse(buffer) {
//     try {
//         const data = await pdfParseLib(buffer);
//         return {
//             text: data.text || '',
//             numPages: data.numpages || 0, // get actual number of pages
//             info: data.info || {}
//         };
//     } catch (err) {
//         console.error('PDF parse error:', err);
//         return { text: '', numPages: 0, info: {} };
//     }
// }

// module.exports = pdfParse;

const pdfParseLib = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { fromPath } = require('pdf2pic'); // converts PDF pages to images
const fs = require('fs');
const path = require('path');

async function pdfParse(buffer, originalFileName) {
    try {
        // Try normal pdf parsing first
        const data = await pdfParseLib(buffer);

        // If text exists, return it
        if (data.text && data.text.trim().length > 0) {
            return {
                text: data.text,
                numPages: data.numpages || 0,
                info: data.info || {}
            };
        }

        // If no text, fallback to OCR
        console.log(`No text found in ${originalFileName}. Using OCR...`);

        // Save buffer temporarily to file for pdf2pic
        const tmpFilePath = path.join(__dirname, '../tmp', originalFileName);
        fs.writeFileSync(tmpFilePath, buffer);

        const convert = fromPath(tmpFilePath, {
            density: 300,
            savePath: path.join(__dirname, '../tmp'),
            saveFilename: 'page',
            format: 'png',
            width: 1200,
            height: 1600
        });

        const pagesText = [];
        const numPages = data.numpages || 1;

        for (let i = 1; i <= numPages; i++) {
            const pageImage = await convert(i); // returns path to image
            const ocrResult = await Tesseract.recognize(pageImage.path, 'eng', {
                logger: m => console.log(m.status)
            });
            pagesText.push(ocrResult.data.text);
        }

        // Clean up temp file
        fs.unlinkSync(tmpFilePath);

        return {
            text: pagesText.join('\n'),
            numPages,
            info: {}
        };

    } catch (err) {
        console.error('PDF parse error:', err);
        return { text: '', numPages: 0, info: {} };
    }
}

module.exports = pdfParse;
