require('dotenv').config();

// Simple Google Sheets API using API key instead of service account
const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  sheetName: process.env.GOOGLE_SHEET_NAME || 'Sheet2',
  apiKey: process.env.GOOGLE_API_KEY,
};

console.log("✅ Loaded ENV: ", {
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
  GOOGLE_SHEET_NAME: process.env.GOOGLE_SHEET_NAME,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'Set' : 'Not set'
});

// Helper function to make API requests
async function makeGoogleSheetsRequest(endpoint, options = {}) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}${endpoint}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Append data to Google Sheets using API key
async function appendToGoogleSheet(data) {
  try {
    console.log('Appending data to Google Sheets:', data);
    
    const values = [[data.title, data.description, data.date, data.batchNumber]];
    
    const response = await makeGoogleSheetsRequest(
      `/values/${GOOGLE_SHEETS_CONFIG.sheetName}!A:D:append`,
      {
        method: 'POST',
        body: JSON.stringify({
          values: values,
          valueInputOption: 'RAW'
        })
      }
    );
    
    console.log(`Successfully appended data to ${GOOGLE_SHEETS_CONFIG.sheetName}`);
    return response;
  } catch (error) {
    console.error('Error appending to Google Sheets:', error);
    throw error;
  }
}

// Fetch data from Google Sheets using API key
async function fetchFromGoogleSheets() {
  try {
    console.log('Fetching data from Google Sheets...');
    
    const response = await makeGoogleSheetsRequest(
      `/values/${GOOGLE_SHEETS_CONFIG.sheetName}!A:D`
    );
    
    const rows = response.values || [];
    console.log(`Raw data from Google Sheets: ${rows.length} rows`);
    
    if (rows.length === 0) {
      console.log('No data found in Google Sheets');
      return [];
    }
    
    // Skip header row and map data
    const ideas = rows.slice(1).map((row, index) => ({
      title: row[0] || '',
      description: row[1] || '',
      date: row[2] || '',
      batchNumber: parseInt(row[3]) || (index + 1)
    }));
    
    console.log(`Successfully fetched ${ideas.length} ideas from Google Sheets`);
    return ideas;
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    throw error;
  }
}

// Get next batch number using API key
async function getNextBatchNumber() {
  try {
    console.log('Getting next batch number...');
    
    const response = await makeGoogleSheetsRequest(
      `/values/${GOOGLE_SHEETS_CONFIG.sheetName}!D:D`
    );
    
    const values = response.values || [];
    console.log(`Batch number column has ${values.length} entries`);
    
    if (values.length <= 1) {
      // No data or only header, start with batch 1
      console.log('No existing data, starting with batch number 1');
      return 1;
    }
    
    // Get the last batch number and increment
    const lastBatchNumber = parseInt(values[values.length - 1][0]) || 0;
    const nextBatchNumber = lastBatchNumber + 1;
    console.log(`Last batch number: ${lastBatchNumber}, Next: ${nextBatchNumber}`);
    return nextBatchNumber;
  } catch (error) {
    console.error('Error getting next batch number:', error);
    return 1; // Default to 1 if error
  }
}

// Test connection using API key
async function testGoogleSheetsConnection() {
  try {
    console.log('Testing Google Sheets connection...');
    
    if (!GOOGLE_SHEETS_CONFIG.apiKey) {
      console.error('Google API key not found in environment variables');
      return false;
    }

    if (!GOOGLE_SHEETS_CONFIG.spreadsheetId) {
      console.error('Google Sheet ID not found in environment variables');
      return false;
    }
    
    // Try to get spreadsheet metadata
    const response = await makeGoogleSheetsRequest('');
    
    console.log('Google Sheets connection successful!');
    console.log('Spreadsheet title:', response.properties?.title);
    
    // Check if the specified sheet exists
    const sheet = response.sheets?.find(sheet => 
      sheet.properties?.title === GOOGLE_SHEETS_CONFIG.sheetName
    );
    
    if (sheet) {
      console.log(`${GOOGLE_SHEETS_CONFIG.sheetName} found and accessible`);
      return true;
    } else {
      console.error(`${GOOGLE_SHEETS_CONFIG.sheetName} not found in the spreadsheet`);
      console.log('Available sheets:', response.sheets?.map(s => s.properties?.title));
      return false;
    }
  } catch (error) {
    console.error('Google Sheets connection failed:', error);
    return false;
  }
}

// Initialize headers if needed using API key
async function initializeGoogleSheet() {
  try {
    console.log('Checking if headers need to be initialized...');
    
    // Check if headers already exist
    const response = await makeGoogleSheetsRequest(
      `/values/${GOOGLE_SHEETS_CONFIG.sheetName}!A1:D1`
    );
    
    if (!response.values || response.values.length === 0) {
      // Add headers using update request
      await makeGoogleSheetsRequest(
        `/values/${GOOGLE_SHEETS_CONFIG.sheetName}!A1:D1`,
        {
          method: 'PUT',
          body: JSON.stringify({
            values: [['Title', 'Description', 'Date', 'Batch_Number']],
            valueInputOption: 'RAW'
          })
        }
      );
      
      console.log(`Successfully initialized ${GOOGLE_SHEETS_CONFIG.sheetName} with headers`);
    } else {
      console.log(`Headers already exist in ${GOOGLE_SHEETS_CONFIG.sheetName}`);
    }
  } catch (error) {
    console.error('Error initializing Google Sheet:', error);
    throw error;
  }
}

module.exports = {
  appendToGoogleSheet,
  fetchFromGoogleSheets,
  getNextBatchNumber,
  testGoogleSheetsConnection,
  initializeGoogleSheet
};