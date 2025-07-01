declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY: string;
      EXPO_PUBLIC_GOOGLE_SHEET_ID: string;
      GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
      GOOGLE_PRIVATE_KEY: string;
      EXPO_PUBLIC_BACKEND_URL: string;
    }
  }
}

export {};