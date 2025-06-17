// Use the deployed backend URL in production
export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://life-tracker-backend.fly.dev'
  : 'http://localhost:3000'; 