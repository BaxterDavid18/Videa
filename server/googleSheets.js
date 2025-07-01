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
      console.log('Raw row data with indices:');
      rows[1].forEach((cell, index) => {
        console.log(`  Index ${index} (Column ${String.fromCharCode(65 + index)}): "${cell}"`);
      });
    }
  }

  if (rows.length === 0) {
    console.log('No data found in Google Sheets');
    return [];
  }

  // Skip header row and map data - only include rows with valid titles
  const ideas = rows.slice(1)
    .filter((row, index) => {
      const title = row[0] || '';
      const hasValidTitle = title.trim() !== '';
      if (!hasValidTitle) {
        console.log(`Skipping row ${index + 2} - no title: [${row.join(', ')}]`);
      }
      return hasValidTitle;
    })
    .map((row, index) => {
      // Ensure we have enough columns
      const paddedRow = [...row];
      while (paddedRow.length < 6) {
        paddedRow.push('');
      }
      
      const title = paddedRow[0] || '';           // Column A
      const description = paddedRow[1] || '';     // Column B
      const date = paddedRow[2] || '';            // Column C
      const batchNumber = parseInt(paddedRow[3]) || (index + 1); // Column D
      const flagValue = paddedRow[4] || '';       // Column E (Flag)
      const script = paddedRow[5] || '';          // Column F (Script)
      
      // Determine flag status: "Complete" if has value, "Incomplete" if empty
      const flag = flagValue.trim() !== '' ? 'Complete' : 'Incomplete';
      
      console.log(`Processing row ${index + 1}:`, {
        title: title,
        description: description.substring(0, 50) + '...',
        flagValue: flagValue,
        script: script ? script.substring(0, 100) + '...' : '(empty)',
        scriptLength: script.length,
        flag: flag,
        rawRowLength: row.length,
        columnMapping: {
          A: paddedRow[0],
          B: paddedRow[1],
          C: paddedRow[2],
          D: paddedRow[3],
          E: paddedRow[4],
          F: paddedRow[5]
        }
      });
      
      return {
        title,
        description,
        date,
        batchNumber,
        script,
        flag
      };
    });

  console.log(`Successfully fetched ${ideas.length} ideas from Google Sheets`);
  if (ideas.length > 0) {
    console.log('Sample processed idea with script:', {
      title: ideas[0]?.title,
      scriptLength: ideas[0]?.script?.length,
      scriptPreview: ideas[0]?.script?.substring(0, 100)
    });
  }
  return ideas;
}

// Update idea flag in Google Sheets
async function updateIdeaFlag(batchNumber, newFlag) {
  console.log(`Updating flag for batch number ${batchNumber} to ${newFlag}...`);
  
  try {
    // First, get all data to find the correct row
    const response = await makeGoogleSheetsRequest(() => sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      range: `${GOOGLE_SHEETS_CONFIG.sheetName}!A:F`,
    }));

    const rows = response.data.values || [];
    console.log(`Found ${rows.length} total rows in sheet`);

    if (rows.length <= 1) {
      throw new Error('No data rows found in the sheet');
    }

    // Find the row with the matching batch number (skip header row)
    // Only consider rows that have a valid title (column A is not empty)
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      const title = rows[i][0] || '';
      const rowBatchNumber = parseInt(rows[i][3]); // Column D (index 3)
      
      console.log(`Checking row ${i + 1}: title="${title}", batch number ${rowBatchNumber} vs target ${batchNumber}`);
      
      // Only consider rows with valid titles and matching batch numbers
      if (title.trim() !== '' && rowBatchNumber === batchNumber) {
        targetRowIndex = i;
        console.log(`Found matching batch number at row ${i + 1} (0-indexed: ${i}) with title: "${title}"`);
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error(`No valid idea found with batch number ${batchNumber}`);
    }

    // Calculate the actual row number for Google Sheets (1-indexed, +1 for header)
    const sheetRowNumber = targetRowIndex + 1;
    console.log(`Updating row ${sheetRowNumber} in Google Sheets`);

    // Update the flag column (Column E)
    const flagValue = newFlag === 'Complete' ? 'Complete' : '';
    const range = `${GOOGLE_SHEETS_CONFIG.sheetName}!E${sheetRowNumber}`;
    
    console.log(`Updating range ${range} with value: "${flagValue}"`);
    
    const updateResponse = await makeGoogleSheetsRequest(() => sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      range: range,
      valueInputOption: 'RAW',
      resource: {
        values: [[flagValue]]
      },
    }));

    console.log(`Successfully updated flag for batch ${batchNumber} to ${newFlag}`);
    console.log('Update response:', updateResponse.data);
    
    return {
      success: true,
      batchNumber,
      newFlag,
      updatedRow: sheetRowNumber,
      message: `Flag updated to ${newFlag}`
    };

  } catch (error) {
    console.error(`Error updating flag for batch ${batchNumber}:`, error);
    throw error;
  }
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
        ['Title', 'Description', 'Date', 'Batch_Number', 'Flag', 'Script']
      ]);
      console.log(`Successfully initialized ${GOOGLE_SHEETS_CONFIG.sheetName} with headers: Title, Description, Date, Batch_Number, Flag, Script`);
    } else {
      console.log(`Headers already exist in ${GOOGLE_SHEETS_CONFIG.sheetName}`);
      
      // Check if we need to add the new Script and Flag columns
      const headers = response.data.values[0];
      console.log('Current headers:', headers);
      
      if (headers.length < 6) {
        // Add missing headers
        const updatedHeaders = [...headers];
        if (!updatedHeaders[4]) updatedHeaders[4] = 'Flag';
        if (!updatedHeaders[5]) updatedHeaders[5] = 'Script';
        
        await updateSheet(`${GOOGLE_SHEETS_CONFIG.sheetName}!A1:F1`, [updatedHeaders]);
        console.log('Added Flag and Script columns to existing headers');
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
  updateSheet,
  updateIdeaFlag
};