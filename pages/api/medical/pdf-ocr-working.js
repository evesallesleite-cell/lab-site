// PDF OCR API using pdf-parse (same as blood test system)
// pages/api/pdf-ocr-working.js

import formidable from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';

// Disable body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚀 DEBUG: PDF OCR Working API called (using pdf-parse)');

  try {
    console.log('🚀 DEBUG: Parsing uploaded file...');
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const file = files.pdf;
    if (!file || !file[0]) {
      console.log('❌ DEBUG: No PDF file found');
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const pdfFile = file[0];
    console.log('🚀 DEBUG: PDF file received:', {
      name: pdfFile.originalFilename,
      size: pdfFile.size,
      type: pdfFile.mimetype
    });
    
    // Read the PDF file as buffer
    console.log('🚀 DEBUG: Reading PDF buffer...');
    const pdfBuffer = fs.readFileSync(pdfFile.filepath);
    console.log(`✅ DEBUG: PDF buffer created - ${pdfBuffer.length} bytes`);
    
    // Extract text using pdf-parse (same as blood test system)
    console.log('🚀 DEBUG: Starting pdf-parse extraction...');
    const pdfData = await pdf(pdfBuffer);
    
    console.log('✅ DEBUG: pdf-parse extraction completed successfully!');
    console.log('🚀 DEBUG: PDF info:', {
      pages: pdfData.numpages,
      textLength: pdfData.text.length,
      info: pdfData.info
    });
    
    console.log('🚀 DEBUG: First 500 chars of extracted text:', pdfData.text.substring(0, 500));
    
    // Clean up temporary file
    fs.unlinkSync(pdfFile.filepath);
    console.log('✅ DEBUG: Temp file cleaned up');
    
    const result = {
      success: true,
      extractedText: pdfData.text,
      pageDetails: [
        {
          pageNumber: 1,
          textLength: pdfData.text.length,
          preview: pdfData.text.substring(0, 200) + '...'
        }
      ],
      stats: {
        totalPages: pdfData.numpages,
        totalCharacters: pdfData.text.length,
        extractionMethod: 'pdf_parse_success'
      },
      pdfInfo: pdfData.info
    };
    
    console.log('🚀 DEBUG: Sending successful response...');
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ DEBUG: PDF extraction failed:', error);
    
    // Clean up temporary file if it exists
    try {
      const form = formidable({});
      const [fields, files] = await form.parse(req);
      const file = files.pdf;
      if (file && file[0]) {
        fs.unlinkSync(file[0].filepath);
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    res.status(500).json({
      error: 'PDF extraction failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      helpText: 'pdf-parse extraction failed. This could be due to a corrupted PDF or unsupported format.'
    });
  }
}
