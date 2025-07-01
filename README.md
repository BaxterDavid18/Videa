# VIDEA - Mobile Idea Capture App

VIDEA is a beautiful mobile application built with Expo and React Native that allows users to capture and save their brilliant ideas to Google Sheets.

## Features

- ✨ Clean, modern interface with matte black, green, and white theme
- 💡 Simple idea input form with title and description fields
- 🔄 Automatic saving to Google Sheets with date and batch numbering
- 📱 Tab-based navigation for easy access to ideas
- 🎨 Smooth animations and micro-interactions
- 📊 View all saved ideas with refresh functionality
- 🚀 Production-ready code structure

## Tech Stack

- **Expo SDK 53** - React Native framework
- **Expo Router** - File-based routing system
- **React Native Reanimated** - Smooth animations
- **Google Sheets API** - Data storage
- **TypeScript** - Type safety
- **Inter Font** - Modern typography

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file and add your Google Sheets credentials:
```bash
cp .env.example .env
```

3. Set up Google Sheets API:
   - Create a new Google Cloud Project
   - Enable the Google Sheets API
   - Create a service account and download the credentials
   - Share your Google Sheet with the service account email
   - Add the credentials to your `.env` file

4. Start the development server:
```bash
npm run dev
```

## Google Sheets Integration

To integrate with Google Sheets, you'll need to:

1. **Create a Google Cloud Project**
2. **Enable Google Sheets API**
3. **Create Service Account credentials**
4. **Share your spreadsheet** with the service account email
5. **Update the API routes** to use the actual Google Sheets API

The current implementation includes placeholder code for Google Sheets integration. Replace the commented sections in:
- `app/api/save-idea+api.ts`
- `app/api/get-ideas+api.ts`

## Project Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx          # Tab navigation layout
│   ├── index.tsx            # New idea input screen
│   └── ideas.tsx            # View saved ideas screen
├── api/
│   ├── save-idea+api.ts     # API route for saving ideas
│   └── get-ideas+api.ts     # API route for fetching ideas
├── _layout.tsx              # Root layout with fonts
└── +not-found.tsx           # 404 screen

components/
└── LoadingSpinner.tsx       # Reusable loading component

types/
└── env.d.ts                 # Environment type definitions
```

## Deployment

The app is configured for both iOS and Android deployment through Expo:

```bash
# Build for production
expo build:ios
expo build:android

# Or use EAS Build
eas build --platform all
```

## Color Theme

- **Primary Background**: `#1a1a1a` (Matte Black)
- **Secondary Background**: `#2a2a2a` (Dark Gray)
- **Accent Color**: `#22c55e` (Green)
- **Text Primary**: `#ffffff` (White)
- **Text Secondary**: `#cccccc` (Light Gray)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.