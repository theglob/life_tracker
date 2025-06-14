# Life Tracker

A simple application to track various aspects of your life, including feelings, food, and sleep patterns.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/life_tracker.git
cd life_tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development servers:
```bash
npm run dev:all
```

This will start both the frontend (Vite) and backend (Express) servers.

## Deployment

### Frontend (GitHub Pages)

1. Build the project:
```bash
npm run build
```

2. Deploy to GitHub Pages:
```bash
npm run deploy
```

### Backend

The backend needs to be deployed to a hosting service that supports Node.js applications (e.g., Heroku, Railway, or similar).

1. Update the `API_URL` in `src/App.tsx` with your deployed backend URL.
2. Deploy the backend code to your chosen hosting service.
3. Make sure to set up the necessary environment variables on your hosting platform.

## Features

- Track feelings, food, and sleep patterns
- Rate entries on a scale of 0-5
- Add notes to entries
- View past entries
- Persistent storage of entries

## Technologies Used

- Frontend: React, Material-UI, Vite
- Backend: Node.js, Express
- Storage: File-based JSON storage 