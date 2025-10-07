function extractMetadata(filename, text = '', pdfInfo = {}) {
    const yearMatch = filename.match(/(19|20)\d{2}/) || text.match(/(19|20)\d{2}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;

    const currentYear = new Date().getFullYear();
    const inRange = year ? year >= currentYear - 5 && year <= currentYear : false;

    const pages = pdfInfo.numpages || null;
    const author = pdfInfo.info?.Author || null;

    return { year, inRange, pages, author };
}

module.exports = { extractMetadata };
