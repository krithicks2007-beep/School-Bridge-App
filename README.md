# School-Bridge App

A comprehensive full-stack application connecting schools, parents, and students.

## Project Structure

This project is divided into two main parts:
- `backend/`: Node.js Express server with Supabase integration.
- `mobile/`: React Native (Expo) mobile application.

## Getting Started

### Prerequisites
- Node.js installed
- Expo CLI (optional, but recommended)
- Supabase account for backend database

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder and add your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   PORT=3000
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   *(Ensure your server is running before starting the mobile app.)*

### Mobile Setup
1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `mobile` folder with the backend API URL:
   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000
   ```
   *(Replace `<YOUR_LOCAL_IP>` with your machine's IP address if testing on a physical device, or use `localhost` / `10.0.2.2` for emulators.)*
4. Start the Expo development server:
   ```bash
   npx expo start
   ```

## Security
Sensitive files such as `.env` and `node_modules` are properly ignored by `.gitignore` to prevent exposing API keys or credentials.
