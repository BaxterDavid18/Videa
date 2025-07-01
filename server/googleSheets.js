// Import fs module to read files
const fs = require('fs');
const { google } = require('googleapis');
// Ensure dotenv loads from the current directory's .env file
require('dotenv').config({ path: './.env' });

// Load service account credentials from the secrets.json file
// The path to secrets.json is provided via the GOOGLE_APPLICATION_CREDENTIALS environment variable
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
let credentials;
try {
  if (!credentialsPath) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
  }
  credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  console.log('✅ Successfully loaded service account credentials from secrets.json');
} catch (error) {
  console.error('❌ Error loading service account credentials:', error.message);
  // Exit the process or handle the error appropriately if credentials are vital
  process.exit(1);
}

// Google Sheets configuration - now primarily using environment variables
// and the loaded credentials for service account details
const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  sheetName: process.env.GOOGLE_SHEET_NAME || 'Sheet2',
  // Service account email is now read directly from the loaded credentials
  serviceAccountEmail: credentials.client_email,
};

// Log for debugging
console.log("✅ Loaded ENV: ", {
  GOOGLE_SHEET_ID: GOOGLE_SHEETS_CONFIG.spreadsheetId,
  GOOGLE_SHEET_NAME: GOOGLE_SHEETS_CONFIG.sheetName,
  GOOGLE_SERVICE_ACCOUNT_EMAIL: GOOGLE_SHEETS_CONFIG.serviceAccountEmail // Log to confirm it's read
});

// Initialize Google Auth using the loaded credentials object
const auth = new google.auth.GoogleAuth({
  credentials, // Pass the entire credentials object
  scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Scope for read/write access
});

// Initialize Google Sheets API
const sheets = google.sheets({ version: 'v4', auth });

// Helper function to make Google Sheets API requests with error handling
async function makeGoogleSheetsRequest(apiCall) {
  try {
    const response = await apiCall();
    return response;
  } catch (error) {
    // Log the full error from Google API for detailed debugging
    console.error('Google Sheets API error:', error.code, '-', JSON.stringify(error.response?.data?.error || error.message, null, 2));
    throw new Error(`Google Sheets API error: ${error.code} - ${JSON.stringify(error.response?.data?.error || error.message)}`);
  }
}

// Helper function to update sheets
async function updateSheet(range, values) {
  console.log(`Updating sheet range: ${range} with ${values.length} rows`);
  return makeGoogleSheetsRequest(() => sheets.spreadsheets.values.update({
    spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
    range: range,
    valueInputOption: 'RAW',
    resource: { values },
  }));
}

// Append data to Google Sheets
async function appendToGoogleSheet(data) {
  console.log('Appending data to Google Sheets:', data);
  // Updated to include empty script and flag columns for new entries
  const values = [[data.title, data.description, data.date, data.batchNumber, '', '']];
  return makeGoogleSheetsRequest(() => sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
    range: `${GOOGLE_SHEETS_CONFIG.sheetName}!A:F`, // Extended to column F to include Script and Flag
    valueInputOption: 'RAW',
    resource: { values },
  }));
}

// Fetch data from Google Sheets
async function fetchFromGoogleSheets() {
  console.log('Fetching data from Google Sheets...');
  const response = await makeGoogleSheetsRequest(() => sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
    range: `${GOOGLE_SHEETS_CONFIG.sheetName}!A:F`, // Extended to column F to include Script and Flag
  }));

  const rows = response.data.values || [];
  console.log(`Raw data from Google Sheets: ${rows.length} rows`);
  
  // Log the first few rows for debugging
  if (rows.length > 0) {
    console.log('Headers:', rows[0]);
    if (rows.length > 1) {
      console.log('Sample data row:', rows[1]);
    }
  }

  if (rows.length === 0) {
    console.log('No data found in Google Sheets');
    return [];
  }

  // Skip header row and map data
  const ideas = rows.slice(1).map((row, index) => {
    const script = row[4] || ''; // Column E (Script)
    const flagValue = row[5] || ''; // Column F (Flag)
    
    // Determine flag status: "Complete" if has value, "Incomplete" if empty
    const flag = flagValue.trim() !== '' ? 'Complete' : 'Incomplete';
    
    console.log(`Row ${index + 1}:`, {
      title: row[0] || '',
      script: script,
      flag: flag,
      rawFlagValue: flagValue
    });
    
    return {
      title: row[0] || '',
      description: row[1] || '',
      date: row[2] || '',
      batchNumber: parseInt(row[3]) || (index + 1),
      script: script,
      flag: flag
    };
  });

  console.log(`Successfully fetched ${ideas.length} ideas from Google Sheets`);
  return ideas;
}

// Get next batch number
async function getNextBatchNumber() {
  console.log('Getting next batch number...');
  const response = await makeGoogleSheetsRequest(() => sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
    range: `${GOOGLE_SHEETS_CONFIG.sheetName}!D:D`, // Column D contains batch numbers
  }));

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
}

// Test connection
async function testGoogleSheetsConnection() {
  console.log('Testing Google Sheets connection...');
  try {
    const response = await makeGoogleSheetsRequest(() => sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
    }));

    console.log('Google Sheets connection successful!');
    console.log('Spreadsheet title:', response.data.properties?.title);

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
  console.log('Checking if headers need to be initialized...');
  try {
    const response = await makeGoogleSheetsRequest(() => sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      range: `${GOOGLE_SHEETS_CONFIG.sheetName}!A1:F1`, // Extended to column F
    }));

    if (!response.data.values || response.data.values.length === 0) {
      await updateSheet(`${GOOGLE_SHEETS_CONFIG.sheetName}!A1:F1`, [
        ['Title', 'Description', 'Date', 'Batch_Number', 'Script', 'Flag']
      ]);
      console.log(`Successfully initialized ${GOOGLE_SHEETS_CONFIG.sheetName} with headers including Script and Flag columns`);
    } else {
      console.log(`Headers already exist in ${GOOGLE_SHEETS_CONFIG.sheetName}`);
      
      // Check if we need to add the new Script and Flag columns
      const headers = response.data.values[0];
      console.log('Current headers:', headers);
      
      if (headers.length < 6) {
        // Add missing headers
        const updatedHeaders = [...headers];
        if (!updatedHeaders[4]) updatedHeaders[4] = 'Script';
        if (!updatedHeaders[5]) updatedHeaders[5] = 'Flag';
        
        await updateSheet(`${GOOGLE_SHEETS_CONFIG.sheetName}!A1:F1`, [updatedHeaders]);
        console.log('Added Script and Flag columns to existing headers');
      }
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
  initializeGoogleSheet,
  updateSheet
};