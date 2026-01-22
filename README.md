# Azure Forms - Student Marks Upload App

A React Native mobile application for teachers to upload student marks via CSV files. The app uses Azure services for storage and data management.

## Features

- Upload student marks in CSV format
- Select teacher, subject, and class from dropdowns
- Automatic file processing and storage in Azure
- Data stored in Cosmos DB for easy retrieval

## Tech Stack

- **Frontend**: React Native with Expo
- **Styling**: NativeWind (Tailwind CSS)
- **Backend**: Azure Functions (TypeScript)
- **Storage**: Azure Blob Storage
- **Database**: Azure Cosmos DB

## Getting Started

### Prerequisites

- Node.js installed
- Expo CLI
- Azure account (for backend services)

### Installation

1. Install dependencies for the mobile app:

   ```bash
   npm install
   ```

2. Install dependencies for Azure Functions:
   ```bash
   cd azure-functions
   npm install
   cd ..
   ```

### Running the App

Start the Expo development server:

```bash
npm start
```

Then open the app on:

- Android emulator
- iOS simulator
- Expo Go app on your phone

### Running Azure Functions Locally

```bash
cd azure-functions
npm start
```

## CSV Format

The uploaded CSV file should have the following columns:

## CSV Format

The uploaded CSV file should have the following columns:

- `rollNo` - Student roll number
- `name` - Student name
- `obtainedMarks` - Marks obtained
- `totalMarks` - Total marks

## Project Structure

- `/app` - React Native app screens
- `/components` - Reusable UI components
- `/azure-functions` - Backend Azure Functions
- `/constants` - App data and constants
