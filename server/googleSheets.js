require('dotenv').config();
const { google } = require('googleapis');

// Google Sheets configuration - exactly like your reference
const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  sheetName: process.env.GOOGLE_SHEET_NAME || 'Sheet2',
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  privateKey: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '', // Handle newlines properly and check if defined
};

// Initialize Google Auth - following your reference pattern exactly
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: "charged-chain-462106-d6",
    private_key_id: "fdb1457e4270bab4a439cadc0c68f4e58af93884",
    private_key: GOOGLE_SHEETS_CONFIG.privateKey,
    client_email: GOOGLE_SHEETS_CONFIG.serviceAccountEmail,
    client_id: "117059580923069451060",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/videa-217%40charged-chain-462106-d6.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Initialize Google Sheets API
const sheets = google.sheets({ version: 'v4', auth });

// Helper function to update sheets - exactly like your reference
async function updateSheet(range, values) {
  try {
    console.log(`Updating sheet range: ${range} with ${values.length} rows`);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      range: range,
      valueInputOption: 'RAW',
      resource: { values },
    });
    
    console.log(`Successfully updated ${range} with ${values.length} rows.`);
  } catch (error) {
    console.error(`Error updating ${range}:`, error);
    throw error;
  }
}

// Append data to Google Sheets - following your reference pattern
async function appendToGoogleSheet(data) {
  try {
    console.log('Appending data to Google Sheets:', data);
    
    const values = [[data.title, data.description, data.date, data.batchNumber]];
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      range: `${GOOGLE_SHEETS_CONFIG.sheetName}!A:D`,
      valueInputOption: 'RAW',
      resource: { values },
    });
    
    console.log(`Successfully appended data to ${GOOGLE_SHEETS_CONFIG.sheetName}`);
    return response.data;
  } catch (error) {
    console.error('Error appending to Google Sheets:', error);
    throw error;
  }
}

// Fetch data from Google Sheets - following your reference pattern
async function fetchFromGoogleSheets() {
  try {
    console.log('Fetching data from Google Sheets...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      range: `${GOOGLE_SHEETS_CONFIG.sheetName}!A:D`,
    });
    
    const rows = response.data.values || [];
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

// Get next batch number - following your reference pattern
async function getNextBatchNumber() {
  try {
    console.log('Getting next batch number...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      range: `${GOOGLE_SHEETS_CONFIG.sheetName}!D:D`, // Column D contains batch numbers
    });
    
    const values = response.data.values || [];
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

// Test connection - following your reference pattern
async function testGoogleSheetsConnection() {
  try {
    console.log('Testing Google Sheets connection...');
    
    // Try to get spreadsheet metadata
    const response = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
    });
    
    console.log('Google Sheets connection successful!');
    console.log('Spreadsheet title:', response.data.properties?.title);
    
    // Check if Sheet2 exists
    const sheet2 = response.data.sheets?.find(sheet => 
      sheet.properties?.title === GOOGLE_SHEETS_CONFIG.sheetName
    );
    
    if (sheet2) {
      console.log(`${GOOGLE_SHEETS_CONFIG.sheetName} found and accessible`);
      return true;
    } else {
      console.error(`${GOOGLE_SHEETS_CONFIG.sheetName} not found in the spreadsheet`);
      return false;
    }
  } catch (error) {
    console.error('Google Sheets connection failed:', error);
    return false;
  }
}

// Initialize headers if needed
async function initializeGoogleSheet() {
  try {
    console.log('Checking if headers need to be initialized...');
    
    // Check if headers already exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      range: `${GOOGLE_SHEETS_CONFIG.sheetName}!A1:D1`,
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      // Add headers using updateSheet function like your reference
      await updateSheet(`${GOOGLE_SHEETS_CONFIG.sheetName}!A1:D1`, [
        ['Title', 'Description', 'Date', 'Batch_Number']
      ]);
      
      console.log(`Successfully initialized ${GOOGLE_SHEETS_CONFIG.sheetName} with headers`);
    } else {
      console.log(`Headers already exist in ${GOOGLE_SHEETS_CONFIG.sheetName}`);
    }
  } catch (error) {
    console.error('Error initializing Google Sheet:', error);
    throw error;
  }
}

require('dotenv').config();
console.log("✅ Loaded ENV: ", {
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
  GOOGLE_SHEET_NAME: process.env.GOOGLE_SHEET_NAME
});


module.exports = {
  appendToGoogleSheet,
  fetchFromGoogleSheets,
  getNextBatchNumber,
  testGoogleSheetsConnection,
  initializeGoogleSheet,
  updateSheet
};