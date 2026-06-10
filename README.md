# Composer

The open source agentic email editor. Build beautiful, brand-consistent emails through natural conversation.

**[withcomposer.com](https://www.withcomposer.com)**

## What is Composer?

Composer is an AI-powered email editor that lets you create production-ready emails by chatting with an AI agent. Drop in your company URL to auto-detect your brand, describe the email you want, and export HTML that works in every major email client.

### Key Features

- **Brand Auto-Detection** - Enter your company URL to extract brand colors, logo, and typography automatically
- **Conversational AI Editor** - Compose and edit emails through natural dialogue with an AI agent
- **LangSmith Integration** - Full AI tracing and observability for every agent interaction
- **Universal Compatibility** - Generates HTML that renders in Gmail, Outlook, Apple Mail, Yahoo, and more
- **React Email Powered** - Built on React Email for modern, component-based email architecture
- **Template Library** - Start from professionally designed templates for newsletters, promotions, and transactional emails
- **Live Preview** - See your email update in real-time as you chat with the agent

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [React Email](https://react.email) - Email component library
- [Vercel AI SDK](https://sdk.vercel.ai) + [DeepSeek](https://deepseek.com) - AI agent
- [LangSmith](https://smith.langchain.com) - AI tracing & observability
- [Prisma](https://prisma.io) - Database ORM
- [Clerk](https://clerk.com) - Authentication (optional)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) - Styling

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

```bash
git clone https://github.com/yanboq/composer.git
cd composer
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```
DATABASE_URL=postgresql://...
DEEPSEEK_API_KEY=your-deepseek-api-key
```

Optional (for AI tracing):

```
LANGSMITH_API_KEY=your-langsmith-api-key
LANGSMITH_TRACING=true
```

Optional (for authentication):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

Push the database schema and start the dev server:

```bash
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Composer is deployed on [Railway](https://railway.com). You can deploy your own instance:

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template)

Or deploy manually:

```bash
railway init
railway add --database postgres
railway up
```

## License

MIT
