const express = require('express');
const cors = require('cors');
const {
  appendToGoogleSheet,
  fetchFromGoogleSheets,
  getNextBatchNumber,
  testGoogleSheetsConnection,
  initializeGoogleSheet,
  updateIdeaFlag
} = require('./googleSheets');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const isConnected = await testGoogleSheetsConnection();
    
    if (isConnected) {
      await initializeGoogleSheet();
      res.json({
        success: true,
        message: 'Google Sheets connection successful and Sheet2 is ready!',
        connected: true
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Google Sheets connection failed',
        connected: false
      });
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Google Sheets connection',
      error: error.message
    });
  }
});

// Save idea endpoint
app.post('/api/save-idea', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }

    // Get current date and next batch number
    const currentDate = new Date().toISOString();
    const batchNumber = await getNextBatchNumber();
    
    console.log('Saving idea:', { title, description, date: currentDate, batchNumber });
    
    // Save to Google Sheets
    const result = await appendToGoogleSheet({
      title,
      description,
      date: currentDate,
      batchNumber
    });

    console.log('Successfully saved idea to Google Sheets');

    res.json({
      success: true,
      message: 'Idea saved successfully to Google Sheets',
      data: {
        title,
        description,
        date: currentDate,
        batchNumber,
      },
    });
  } catch (error) {
    console.error('Error saving idea:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save idea to Google Sheets',
      details: error.message
    });
  }
});

// Get ideas endpoint
app.get('/api/get-ideas', async (req, res) => {
  try {
    console.log('Fetching ideas from Google Sheets...');
    
    const ideas = await fetchFromGoogleSheets();
    
    console.log(`Successfully fetched ${ideas.length} ideas`);
    
    res.json({
      success: true,
      ideas: ideas,
      message: `Fetched ${ideas.length} ideas from Google Sheets`
    });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    res.status(500).json({
      success: false,
      ideas: [],
      error: 'Failed to fetch ideas from Google Sheets',
      details: error.message
    });
  }
});

// Update idea flag endpoint
app.put('/api/update-idea-flag', async (req, res) => {
  try {
    const { batchNumber, newFlag } = req.body;

    console.log(`Backend: Received request to update batchNumber ${batchNumber} to ${newFlag}`);

    if (!batchNumber || !newFlag) {
      return res.status(400).json({
        success: false,
        error: 'Batch number and new flag are required'
      });
    }

    if (!['Complete', 'Incomplete'].includes(newFlag)) {
      return res.status(400).json({
        success: false,
        error: 'Flag must be either "Complete" or "Incomplete"'
      });
    }

    console.log(`Backend: Updating idea with batch number ${batchNumber} to ${newFlag}`);
    
    // Update the flag in Google Sheets - FIXED: using correct function name
    const result = await updateIdeaFlag(batchNumber, newFlag);

    console.log('Backend: Successfully updated idea flag in Google Sheets');

    res.json({
      success: true,
      message: `Idea ${batchNumber} marked as ${newFlag}`,
      data: result,
    });
  } catch (error) {
    console.error('Backend: Error updating idea flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update idea flag in Google Sheets',
      details: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'VIDEA Backend API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 VIDEA Backend API running on port ${PORT}`);
  console.log(`📊 Google Sheets ID: ${process.env.GOOGLE_SHEET_ID}`);
  console.log(`📋 Sheet Name: ${process.env.GOOGLE_SHEET_NAME}`);
});