# Google Sheets API Setup Guide

Follow these steps to connect your VIDEA app to Google Sheets:

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Give your project a name (e.g., "VIDEA App")

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

## Step 3: Create Service Account Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `videa-sheets-service`
   - Description: `Service account for VIDEA app to access Google Sheets`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 4: Generate Private Key

1. In the Credentials page, click on your newly created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format and click "Create"
5. A JSON file will be downloaded - keep this safe!

## Step 5: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "VIDEA Ideas" (or any name you prefer)
4. Add headers in the first row:
   - A1: `Title`
   - B1: `Description`
   - C1: `Date`
   - D1: `Batch Number`

## Step 6: Share Sheet with Service Account

1. In your Google Sheet, click the "Share" button
2. Add the service account email (found in the JSON file as `client_email`)
3. Give it "Editor" permissions
4. Click "Send"

## Step 7: Get Your Sheet ID

1. Look at your Google Sheet URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
2. Copy the `SHEET_ID` part (the long string between `/d/` and `/edit`)

## Step 8: Configure Environment Variables

1. Copy the `.env.local` file in your project
2. Fill in the following values from your JSON credentials file:

```env
# From the JSON file
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=your_api_key_from_google_cloud_console
EXPO_PUBLIC_GOOGLE_SHEET_ID=your_sheet_id_from_step_7
GOOGLE_SERVICE_ACCOUNT_EMAIL=client_email_from_json_file
GOOGLE_PRIVATE_KEY="private_key_from_json_file"
```

## Step 9: Get API Key (Optional - for client-side requests)

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key and add it to your `.env.local` file

## Important Notes

- Keep your JSON credentials file secure and never commit it to version control
- The private key in the `.env.local` file should include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Make sure to replace `\n` with actual line breaks in the private key
- The service account email must have access to your Google Sheet

## Testing

Once configured, your VIDEA app will:
- Save new ideas directly to your Google Sheet
- Fetch and display existing ideas from the sheet
- Automatically increment batch numbers
- Include timestamps for each idea

## Troubleshooting

- **403 Forbidden**: Check that the service account has access to your sheet
- **404 Not Found**: Verify your sheet ID is correct
- **Authentication Error**: Ensure your private key is properly formatted
- **API Not Enabled**: Make sure Google Sheets API is enabled in your project

Your Google Sheets integration is now ready! 🎉