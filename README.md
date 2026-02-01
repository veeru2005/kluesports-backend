# Backend for KLU Esports

This is the Node.js/Express backend for the KLU Esports application.

## Prerequisites

- Node.js installed
- MongoDB Atlas Cluster

## Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up Environment Variables:
    - The `.env` file should be created automatically.
    - Ensure `MONGO_URI` is correct.
    - **Important**: Your current IP address must be whitelisted in MongoDB Atlas Network Access. If you see connection errors, check this first.

## Running the Server

- Development:
  ```bash
  npm start
  ```
  This runs the server with `nodemon` for auto-restarts.

- Production:
  ```bash
  node server.js
  ```

## API Endpoints

- `POST /api/auth/otp/send`: Send OTP to email.
- `POST /api/auth/otp/verify`: Verify OTP and login/signup.

## Folder Structure

- `models/`: Mongoose models (User, Otp).
- `routes/`: API routes.
- `server.js`: Main entry point.
