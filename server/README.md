# VIDEA Backend API

This is a Node.js backend API that handles Google Sheets operations for the VIDEA mobile app.

## Setup

1. **Install dependencies:**
```bash
cd server
npm install
```

2. **Environment variables are already configured in `.env`**

3. **Start the server:**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### Test Connection
- **GET** `/api/test`
- Tests Google Sheets connection and initializes headers

### Save Idea
- **POST** `/api/save-idea`
- Body: `{ "title": "string", "description": "string" }`
- Saves a new idea to Google Sheets

### Get Ideas
- **GET** `/api/get-ideas`
- Returns all ideas from Google Sheets

### Health Check
- **GET** `/health`
- Returns server status

## Testing

1. **Test the connection:**
```bash
curl http://localhost:3001/api/test
```

2. **Save a test idea:**
```bash
curl -X POST http://localhost:3001/api/save-idea \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Idea","description":"This is a test idea from the backend API"}'
```

3. **Get all ideas:**
```bash
curl http://localhost:3001/api/get-ideas
```

## Deployment

This backend can be deployed to:
- **Heroku**
- **Railway**
- **Render**
- **DigitalOcean App Platform**
- **AWS/Google Cloud/Azure**

Make sure to set the environment variables in your deployment platform.

## Architecture

This backend follows the exact same pattern as your working reference code:
- Uses `google.auth.GoogleAuth` for authentication
- Direct credential embedding (secure for server-side)
- Comprehensive logging throughout all operations
- Error handling with detailed messages
- Follows your proven `updateSheet` pattern

The mobile app will make HTTP requests to this backend instead of trying to access Google Sheets directly.