# ASL Frontend

React TypeScript frontend for the ASL Recognition application.

## Features

### 🔐 Authentication
- User registration 
- User login with JWT tokens

### ✋ ASL Detection
- Main detection screen using webcam
- Real-time ASL alphabet detection

### 🧪 Exercises (Sub-models)
- A-F submodel practice
- G-K submodel practice
- L-P submodel practice
- Q-U submodel practice
- V-Z submodel practice

### 📖 Dictionary
- Complete ASL alphabet dictionary
- Visual references and instructions

### ⚔️ PvP Matches
- Create new matches
- Join existing matches
- View active matches
- View match history

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Running the Development Server
```
npm start
```
or
```
yarn start
```

### Building for Production
```
npm run build
```
or
```
yarn build
```

## Project Structure

```
src/
├── assets/           # Static assets like images
├── components/       # Reusable UI components
├── context/          # React context providers
├── hooks/            # Custom React hooks
├── pages/            # Page components
│   ├── auth/         # Authentication pages
│   ├── detection/    # Detection pages
│   ├── exercises/    # Exercise pages
│   ├── dictionary/   # Dictionary pages
│   └── pvp/          # PvP match pages
├── services/         # API and other services
└── utils/            # Utility functions
```

## API Integration

The frontend communicates with the ASL.Backend API endpoints:

- Authentication: `/api/Auth/*`
- Game/Matches: `/api/Game/*` 