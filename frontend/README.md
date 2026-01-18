# Tavern Agent Admin Frontend

Simple React admin panel for managing customers and stories.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will run on http://localhost:3000

## Features

- **Authentication**: Login page with JWT token management
- **Customers Management**: 
  - List all customers
  - View customer details with associated stories
  - Create new customers
  - Edit customers
  - Delete customers
- **Stories Management**:
  - View stories for a customer
  - Create new stories
  - Edit stories
  - Delete stories
  - View story details

## Configuration

The API base URL defaults to `http://localhost:8000`. You can override this by setting the `REACT_APP_API_URL` environment variable.

