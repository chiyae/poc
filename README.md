# MediTrack Pro

This is a Next.js application for inventory management in clinics, built with **Postgres** and **Drizzle ORM**.

## Prerequisites

Make sure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [PostgreSQL](https://www.postgresql.org/)

## Getting Started

Follow these steps to get the application running on your computer.

### 1. Install Dependencies

This is the most important step. Open your terminal (Command Prompt, PowerShell, or Terminal), navigate to the project directory, and run:

```bash
npm install
```

*Note: This creates the `node_modules` folder. If you skip this, you will see an error saying 'next' is not recognized.*

### 2. Set Up Environment Variables

The application requires credentials for the database and authentication.

1.  Create a copy of the example environment file:
    ```bash
    cp .env.example .env.local
    ```

2.  **Configure Database:**
    - Ensure you have a PostgreSQL database running.
    - Update the `DATABASE_URL` in your `.env.local` file.

### 3. Database Setup

Run the following commands to set up your database schema:

```bash
npm run db:push
npm run db:seed
```

### 4. Run the Development Server

Once everything is set up, start the app:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

## GitHub Instructions

To push this project to GitHub:

1. Initialize git: `git init`
2. Add files: `git add .`
3. Commit: `git commit -m "Initial commit"`
4. Create a repo on GitHub and follow their "push an existing repository" instructions.
