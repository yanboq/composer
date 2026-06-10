import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Globe,
  Activity,
  Palette,
  Code2,
  Sparkles,
  ArrowRight,
  Send,
  Eye,
  Layers,
  Shield,
  Zap,
} from "lucide-react";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-zinc-900">Composer</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">
            How it works
          </a>
          <a href="#features" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">
            Features
          </a>
          <a href="#open-source" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">
            Open Source
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 sm:flex"
          >
            Sign in
          </a>
          <Link
            href="/dashboard"
            className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Get Started
            <ArrowRight className="ml-1.5 inline h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-white pt-32 pb-20 lg:pt-44 lg:pb-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Open source &amp; free
          </div>

          <h1 className="text-5xl leading-[1.1] font-extrabold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
            The open source
            <br />
            agentic email{" "}
            <span className="text-emerald-700">
              editor.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-zinc-500 sm:text-xl">
            Composer is an AI agent-powered email editor that auto-detects your brand, composes
            emails through conversation, and exports production-ready HTML for every client.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-emerald-600"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-7 py-3.5 text-base font-semibold text-zinc-700 transition-all hover:border-zinc-400 hover:bg-zinc-50"
            >
              <GitHubIcon className="h-5 w-5" />
              View on GitHub
            </a>
          </div>

          <p className="mt-6 text-xs text-zinc-400">
            Built with React Email &middot; Vercel AI SDK &middot; LangSmith
          </p>
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    number: "01",
    icon: Globe,
    title: "Drop in your URL",
    description:
      "Enter your company URL and Composer auto-extracts your brand colors, logo, and typography. Your emails match your brand from the start.",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Chat to compose",
    description:
      "Describe your email in plain English. The AI agent builds it component by component — subject lines, hero images, CTAs, and more.",
  },
  {
    number: "03",
    icon: Eye,
    title: "Review & refine",
    description:
      "See a live preview as you work. Drag-and-drop to reorder sections, or ask the agent to iterate on tone, layout, or content.",
  },
  {
    number: "04",
    icon: Send,
    title: "Send anywhere",
    description:
      "Export production-ready HTML that renders perfectly in Gmail, Outlook, Apple Mail, Yahoo, and every major email client.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-zinc-100 bg-zinc-50 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-zinc-500">
            From brand to inbox in four simple steps.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-emerald-200 hover:shadow-sm"
            >
              <div className="mb-4 flex items-center gap-4">
                <span className="text-3xl font-black text-emerald-700/15">{step.number}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <step.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-zinc-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Palette,
    title: "Brand Auto-Detection",
    description:
      "Enter your company URL and get brand colors, logo, and typography extracted automatically. No manual setup required.",
  },
  {
    icon: MessageSquare,
    title: "Conversational AI Editor",
    description:
      "Compose emails through natural dialogue. Describe what you want, and the AI agent builds it in real-time.",
  },
  {
    icon: Activity,
    title: "LangSmith Integration",
    description:
      "Full AI tracing and observability for every agent interaction. Debug, evaluate, and improve your AI workflows.",
  },
  {
    icon: Layers,
    title: "Universal Compatibility",
    description:
      "Generates production-ready HTML that works flawlessly in Gmail, Outlook, Apple Mail, Yahoo, and all major clients.",
  },
  {
    icon: Code2,
    title: "React Email Powered",
    description:
      "Built on React Email for modern, component-based email architecture. Type-safe, testable, and maintainable.",
  },
  {
    icon: Shield,
    title: "Template Library",
    description:
      "Start from professionally designed templates for newsletters, promotions, transactional emails, and more.",
  },
  {
    icon: Zap,
    title: "Live Preview",
    description:
      "See your email update in real-time as you chat with the agent. Drag-and-drop to rearrange components instantly.",
  },
  {
    icon: Globe,
    title: "Multi-Brand Support",
    description:
      "Manage multiple brand identities in one workspace. Switch between brands seamlessly for different campaigns.",
  },
  {
    icon: Sparkles,
    title: "Smart Suggestions",
    description:
      "The AI agent suggests subject lines, preview text, and content optimizations based on email best practices.",
  },
];

function Features() {
  return (
    <section id="features" className="border-t border-zinc-100 bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Everything you need to build better emails
          </h2>
          <p className="mt-4 text-lg text-zinc-500">
            An AI-native email editor that handles the hard parts so you can focus on your message.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-7 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-bold text-zinc-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Compatibility() {
  const clients = [
    "Gmail",
    "Outlook",
    "Apple Mail",
    "Yahoo Mail",
    "Thunderbird",
    "Samsung Mail",
    "AOL",
    "ProtonMail",
  ];

  return (
    <section className="border-t border-zinc-100 bg-zinc-50 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Works with every email client
          </h2>
          <p className="mt-4 text-lg text-zinc-500">
            Composer generates production-ready HTML that renders perfectly everywhere.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-3">
          {clients.map((client) => (
            <div
              key={client}
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700"
            >
              <Mail className="h-4 w-4 text-emerald-700" />
              {client}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OpenSource() {
  return (
    <section id="open-source" className="border-t border-zinc-100 bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
            Built in the open.
            <br />
            <span className="text-emerald-700">
              Fork it. Extend it. Make it yours.
            </span>
          </h2>
          <p className="mt-6 text-lg text-zinc-500">
            MIT Licensed. Community-driven. Fully transparent. Composer is open source because great
            tools should be accessible to everyone.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-zinc-800"
            >
              <GitHubIcon className="h-5 w-5" />
              Star on GitHub
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-7 py-3.5 text-base font-semibold text-zinc-700 transition-all hover:border-zinc-400 hover:bg-zinc-50"
            >
              Try Composer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700">
              <Mail className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-zinc-900">Composer</span>
            <span className="text-sm text-zinc-400">— Open source agentic email editor</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <span>
              Built with React Email, Vercel AI SDK &amp; LangSmith
            </span>
            <span>MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <Compatibility />
      <OpenSource />
      <Footer />
    </div>
  );
}
