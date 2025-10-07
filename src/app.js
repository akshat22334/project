const express = require('express');
const app = express();
const pdfRoutes = require('./routes/pdfRoutes');

app.use(express.json());
app.use('/api/pdf', pdfRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
