# Gallop AI

**Keep up with AI trends & bias** - Discover how different AI models see the world

Gallop AI is a production-ready Next.js application that analyzes AI model biases and provides trend analysis capabilities. Compare how different AI models (OpenAI, Anthropic, Google Gemini, Perplexity) rank the same topics over time and uncover their unique perspectives and biases.

## ✨ Features

- **🔍 Bias Detection**: Compare rankings across multiple AI models to identify biases
- **📈 Trend Analysis**: Track how AI model opinions change over time
- **🤖 Multi-Model Support**: OpenAI GPT-4, Anthropic Claude, Google Gemini, Perplexity
- **⚡ Real-time Analysis**: Streaming responses with Vercel AI SDK
- **📊 Interactive Charts**: Beautiful visualizations with Recharts
- **🌙 Modern UI**: Built with Next.js 15, React 19, and shadcn/ui

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- API keys for the AI providers you want to use

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gallop-ai.git
cd gallop-ai
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your API keys:
```env
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 with React 19 (App Router)
- **AI Integration**: Vercel AI SDK with streaming responses
- **Database**: Prisma ORM with PlanetScale/Supabase (planned)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Charts**: Recharts for data visualization
- **Deployment**: Vercel with edge functions

## 📁 Project Structure

```
gallop-ai/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utilities and business logic
│   ├── ai-providers.ts   # AI model configurations
│   ├── types.ts          # TypeScript types
│   └── ...
├── public/               # Static assets
└── data/                # Sample data files
```

## 🔧 Development Commands

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Database (when configured)
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run database migrations
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vercel AI SDK](https://sdk.vercel.ai/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by OpenAI, Anthropic, Google Gemini, and Perplexity APIs