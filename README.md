<a href="https://th3.chat">
  <img alt="th3.chat - Next.js 15 AI Chatbot" src="./public/opengraph-image.png">
  <h1 align="center" style="color: fuchsia;">th3.chat | DeDevs</h1>
</a>

<p align="center">
  th3.chat is a powerful, open-source AI chatbot template built with Next.js, the Vercel AI SDK, and a comprehensive suite of modern web technologies. It provides a robust foundation for developers to quickly build and deploy feature-rich conversational AI applications.
</p>

<p align="center" style="font-weight: bold;">
  <a href="#1-introduction" style="color: lavender;"><strong>Introduction</strong></a> ·
  <a href="#2-features" style="color: lavender;"><strong>Features</strong></a> ·
  <a href="#3-prerequisites" style="color: lavender;"><strong>Prerequisites</strong></a> ·
  <a href="#4-environment-setup" style="color: lavender;"><strong>Setup</strong></a> ·
  <a href="#6-local-development" style="color: lavender;"><strong>Run Locally</strong></a> ·
  <a href="#8-deployment" style="color: lavender;"><strong>Deploy</strong></a> ·
  <a href="#9-model-providers" style="color: lavender;"><strong>Models</strong></a>
</p>
<br/>

## 1. Introduction

Cloneathon Chat is designed to accelerate the development of AI-powered chatbots. It leverages the latest Next.js App Router, Vercel AI SDK for seamless model integration, Shadcn/UI for a beautiful and accessible user interface, Neon Serverless Postgres for data persistence, and Auth.js for secure authentication. This template aims to provide a production-ready starting point with best practices in mind.

This guide will walk you through setting up your development environment, configuring the necessary services, running the application locally, executing tests, and deploying it to Vercel.

## 2. Features

- **[Next.js 15 App Router](https://nextjs.org/docs/app)**:
  - Advanced routing for seamless navigation and performance.
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance.
- **[Vercel AI SDK](https://sdk.vercel.ai/docs)**:
  - Unified API for generating text, structured objects, and tool calls with LLMs.
  - Hooks for building dynamic chat and generative user interfaces.
  - Supports xAI (default), OpenAI, Anthropic, Cohere, and [many more providers](https://sdk.vercel.ai/providers/ai-sdk-providers).
- **[Shadcn/UI](https://ui.shadcn.com)**:
  - Beautifully designed, accessible, and customizable UI components.
  - Styling with [Tailwind CSS](https://tailwindcss.com).
  - Component primitives from [Radix UI](https://www.radix-ui.com/) for accessibility and flexibility.
- **Data Persistence**:
  - [Neon Serverless Postgres](https://neon.tech/) for saving chat history, user data, and project information.
  - [Drizzle ORM](https://orm.drizzle.team/) for type-safe SQL query building and schema management.
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage (e.g., user uploads, AI-generated images).
- **Authentication**:
  - [Auth.js (NextAuth.v5)](https://authjs.dev/) for simple, secure, and flexible authentication.
  - Credentials-based login and easy integration with OAuth providers.
- **Project Organization**:
  - Feature for organizing chats into projects.
  - CRUD operations for projects with custom attributes.
- **State Management**:
  - Primarily React Hooks (`useState`, `useContext`, `useReducer`) and server components.
- **Linting and Formatting**:
  - BiomeJS for fast and comprehensive linting and code formatting.
- **Testing**:
  - [Playwright](https://playwright.dev/) for End-to-End testing. (Setup instructions to be detailed)

## 3. Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: Version 18.x or later (LTS recommended). You can use [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.
- **pnpm**: This project uses `pnpm` as the package manager. Install it globally via npm: `npm install -g pnpm`.
- **Git**: For cloning the repository and version control.
- **Vercel CLI (Optional but Recommended)**: For easy environment variable management and deployment. Install it globally: `npm install -g vercel`.

## 4. Environment Setup

### 4.1. Clone the Repository

First, clone the Cloneathon Chat repository to your local machine:

```bash
git clone https://github.com/DeDevsClub/cloneathon-chat.git
cd cloneathon-chat
```

### 4.2. Environment Variables (`.env`)

The application requires several environment variables to function correctly. These are used for authentication, database connections, AI model API keys, and other third-party services.

1.  **Create a `.env` file**:
    Copy the example environment file to create your local configuration:

    ```bash
    cp .env.example .env
    ```

2.  **Populate `.env` with your credentials**:
    Open the newly created `.env` file and fill in the values for each variable. Refer to the comments in `.env.example` for guidance on obtaining these keys.

    **Example `.env` structure:**

    ```bash
    # Auth Secret (run `openssl rand -base64 32`)
    AUTH_SECRET="your_strong_random_secret_here"

    # Authorized Emails (comma-separated list for admin access or specific features)
    # Example: AUTHORIZED_EMAILS="admin@example.com,user@example.com"
    AUTHORIZED_EMAILS=""

    # AI Model API Key (e.g. OpenAI) — https://platform.openai.com
    OPENAI_API_KEY="sk-abc-123"

    # Database Connection (Neon Serverless Postgres) — https://neon.tech
    POSTGRES_URL="postgresql://user:password@host:port/database"

    # Vercel Blob Storage (optional, if using file uploads) — https://vercel.com/docs/storage/vercel-blob
    BLOB_READ_WRITE_TOKEN="your_vercel_blob_token_here"

    # Redis (optional, for rate limiting or caching) — https://vercel.com/docs/storage/vercel-redis
    REDIS_URL="your_redis_connection_string_here"
    ```

    **Important Notes:**

    - `AUTH_SECRET`: Generate a strong, random string. You can use `openssl rand -base64 32` in your terminal.
    - `AUTHORIZED_EMAILS`: This is a comma-separated list of email addresses that are granted special privileges (e.g., admin access), as defined in the middleware.
    - Ensure you **do not commit your `.env` file** to version control as it contains sensitive secrets. The `.gitignore` file should already be configured to ignore `.env`.

### 4.3. Vercel Environment Setup (Optional)

If you plan to deploy to Vercel or want to manage environment variables through Vercel's platform even for local development:

1.  **Install Vercel CLI**:
    ```bash
    npm i -g vercel
    ```
2.  **Link your local project to Vercel**:
    Navigate to your project directory and run:
    ```bash
    vercel link
    ```
    Follow the prompts to connect to your Vercel account and link the project. This will create a `.vercel` directory.
3.  **Download environment variables**:
    If you've already set up environment variables on your Vercel project dashboard, you can pull them down to your local environment:
    ```bash
    vercel env pull .env.development.local
    ```
    This command creates a `.env.development.local` file with the variables from Vercel. Next.js automatically loads variables from this file during development.

## 5. Database Configuration

Cloneathon Chat uses Neon Serverless Postgres for its database and Drizzle ORM for schema management and queries.

### 5.1. Setting up Neon Serverless Postgres

1.  **Create a Neon Account**: If you don't have one, sign up at [Neon](https://neon.tech/).
2.  **Create a New Project**: In your Neon dashboard, create a new project.
3.  **Get the Connection String**: Neon will provide a PostgreSQL connection string (URI). This is what you'll use for the `POSTGRES_URL` environment variable in your `.env` file. It typically looks like `postgresql://user:password@host:port/dbname`.

### 5.2. Schema and Migrations with Drizzle ORM

The database schema is defined in `lib/db/schema.ts`. Drizzle Kit is used to generate and apply migrations.

1.  **Install Drizzle Kit (if not already a dev dependency)**:
    It should be listed in `package.json`. If not, `pnpm add -D drizzle-kit`.

2.  **Generate Migrations**:
    After making changes to your schema in `lib/db/schema.ts`, generate migration files:

    ```bash
    pnpm run db:generate
    ```

    This command will create SQL migration files in the `drizzle` (or `migrations`) directory. Review these files before applying.

3.  **Apply Migrations**:
    To apply the generated migrations to your database:

    ```bash
    pnpm run db:migrate
    ```

    This command executes the migration scripts against the database specified in your `POSTGRES_URL`.

    **Initial Setup**: The first time you set up the project, you'll need to run `db:generate` (if no migrations exist yet or if you've made schema changes) and then `db:migrate` to create the tables in your Neon database.

4.  **Drizzle Studio (Optional)**:
    To visually inspect and manage your database, you can use Drizzle Studio:
    ```bash
    pnpm run db:studio
    ```
    This will open a web interface for your database.

## 6. Local Development

### 6.1. Installing Dependencies

Once you have cloned the repository and set up your `.env` file, install the project dependencies using `pnpm`:

```bash
pnpm install
```

### 6.2. Running the Application

To start the development server:

```bash
pnpm run dev
```

The application will typically be available at `http://localhost:3000`. The console output will confirm the address and port.

## 7. Running Tests

This project is set up for End-to-End (E2E) testing using Playwright.

1.  **Install Playwright Browsers** (if running for the first time):

    ```bash
    pnpm exec playwright install
    ```

    This command downloads the necessary browser binaries for Playwright.

2.  **Run E2E Tests**:
    To execute the Playwright tests:

    ```bash
    pnpm run test:e2e
    ```

    This will launch the tests, and you'll see output in your terminal indicating the progress and results.

    **Note**: Ensure your local development server (`pnpm run dev`) is running in a separate terminal before executing E2E tests, as Playwright will interact with the live application. Alternatively, configure Playwright to start the server automatically if needed (see `playwright.config.ts`).

## 8. Deployment

The recommended way to deploy Cloneathon Chat is using Vercel, as it's optimized for Next.js applications and integrates seamlessly with Neon, Vercel Blob, etc.

### 8.1. Deploying to Vercel (One-Click)

You can deploy your own version of Cloneathon Chat to Vercel with one click using the button below (update the repository URL if you've forked it):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDeDevsClub%2Fcloneathon-chat&env=AUTH_SECRET,XAI_API_KEY,POSTGRES_URL,BLOB_READ_WRITE_TOKEN,AUTHORIZED_EMAILS&envDescription=Provide%20your%20API%20keys%20and%20secrets.%20AUTH_URL%20will%20be%20set%20automatically.&project-name=my-cloneathon-chat&repository-name=my-cloneathon-chat)

During the Vercel deployment setup:

- Connect your Git repository (GitHub, GitLab, Bitbucket).
- Vercel will typically detect it's a Next.js project and configure build settings automatically.
- **Configure Environment Variables**: Add all the necessary environment variables from your `.env` file (e.g., `AUTH_SECRET`, `OPENAI_API_KEY`, `POSTGRES_URL`, `AUTHORIZED_EMAILS`) in the Vercel project settings. `AUTH_URL` will be automatically set by Vercel to your deployment's URL.
- **Integrations**: Vercel allows you to integrate Neon (Postgres) and Vercel Blob directly from their marketplace during the setup process, which can simplify provisioning these services.

### 8.2. Manual Deployment with Vercel CLI

1.  **Install Vercel CLI** (if you haven't already):
    ```bash
    npm i -g vercel
    ```
2.  **Login to Vercel**:
    ```bash
    vercel login
    ```
3.  **Deploy**:
    From your project's root directory, run:
    ```bash
    vercel
    ```
    This will initiate the deployment process. If it's the first time, Vercel CLI will prompt you to link the project to a Vercel project.
    To deploy to production, use:
    ```bash
    vercel --prod
    ```

## 9. Model Providers

This template ships with [OpenAI](https://platform.openai.com) (e.g., `gpt-4o`) as the default chat model. However, thanks to the Vercel AI SDK, you can easily switch LLM providers.

To change the model provider (e.g., to OpenAI):

1.  Ensure you have the necessary API key (e.g., `OPENAI_API_KEY`) in your `.env` file.
2.  Update the AI SDK client initialization in your API routes (e.g., `app/api/chat/route.ts` or similar files where `createOpenAI` or `createXAI` is used).

        Example for OpenAI:
        ```typescript
        // In your API route
        import { OpenAI } from '@ai-sdk/openai';
        import { StreamingTextResponse, streamText } from 'ai';

        export const runtime = 'edge';

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // ... in your POST handler
        const result = await streamText({
          model: openai.chat('gpt-4-turbo'), // Or your preferred OpenAI model
          messages,
          // ... other parameters
        });
        ```

    Refer to the [Vercel AI SDK documentation](https://sdk.vercel.ai/providers/ai-sdk-providers) for a list of supported providers and their setup instructions.

<!-- TODO: Add Diagrams -->
<!-- ## 10. Architectural and Data Flow Diagrams

Understanding the architecture and data flow is crucial for effective development and contribution. While this README provides textual explanations, visual diagrams can offer clearer insights into complex processes. -->

<!-- **Recommended Diagrams**:

- **System Architecture Diagram**: Illustrating the main components (Frontend, Backend API, Database, Auth Service, AI Service) and their interactions.
- **Authentication Flow Diagram**: Detailing the login, registration, and session management process.
- **Chat Data Flow Diagram**: Showing how messages are sent, processed by the AI, and stored in the database.
- **Database Schema Diagram (ERD)**: Visualizing the database tables and their relationships. -->

---

> We hope this guide helps you get your chat up and running smoothly! If you encounter any issues or have suggestions, please feel free to open an issue or contribute to the project.
