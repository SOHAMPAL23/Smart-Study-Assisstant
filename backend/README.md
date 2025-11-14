# AI Study Assistant Backend

This is the backend service for the AI Study Assistant application.

## Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/         # API route definitions
│   ├── middleware/     # Custom middleware functions
│   ├── models/         # Data models (if using a database)
│   ├── utils/          # Utility functions
│   └── server.js       # Main server file
├── package.json        # Backend dependencies and scripts
└── README.md           # This file
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with necessary environment variables:
   ```env
   PORT=3001
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start the development server with nodemon
- `npm start` - Start the production server

## API Endpoints

- `GET /` - Health check endpoint
- `GET /health` - Detailed health check with timestamp

## Future Expansion

This backend structure is prepared for future expansion to include:
- User authentication
- Study history storage
- Progress tracking
- Database integration