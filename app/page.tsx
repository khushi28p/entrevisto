"use client";

import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { SectionHeading } from "@/components/section-header";
import {
  ArrowRight,
  BrainCircuit,
  ChartSpline,
  CheckCircle2,
  Clock3,
  Fingerprint,
  Play,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const trustedLogos = [
  "Pioneer Labs",
  "NovaHire",
  "Atlas Health",
  "Vertex AI",
  "Crestwave",
];

const metrics = [
  { label: "Screening time saved", value: "86%" },
  { label: "Hiring velocity", value: "3.2x" },
  { label: "Candidate satisfaction", value: "9.4/10" },
];

const features = [
  {
    title: "Adaptive scoring intelligence",
    description:
      "Dynamic scoring tuned to each role uncovers high-fit candidates while filtering bias out of the funnel.",
    icon: BrainCircuit,
  },
  {
    title: "Authentic candidate signal",
    description:
      "AI-generated transcripts, highlights, and sentiment summaries capture the context your team needs to decide.",
    icon: ChartSpline,
  },
  {
    title: "Enterprise guardrails",
    description:
      "Bring your own compliance stack with secure audit trails, privacy controls, and SOC-2 ready infrastructure.",
    icon: ShieldCheck,
  },
];

const workflow = [
  {
    title: "Launch smart screeners",
    description:
      "Spin up branded, job-specific interviews in minutes with our conversational templates and knowledge base.",
    icon: Sparkles,
  },
  {
    title: "Assess in real time",
    description:
      "Candidates receive adaptive prompts, while hiring managers view live benchmarks and readiness predictions.",
    icon: Clock3,
  },
  {
    title: "Collaborate instantly",
    description:
      "Recruiters, interviewers, and stakeholders review the same highlights, moments, and action items in one hub.",
    icon: Users2,
  },
  {
    title: "Decide with confidence",
    description:
      "AI creates role-tailored scorecards and next-step recommendations so your team moves faster together.",
    icon: CheckCircle2,
  },
];

const insights = [
  {
    title: "How Entrevisto scaled hiring at Vertex AI",
    description:
      "35% more diverse hires and 2x recruiter capacity with automated interview intelligence.",
  },
  {
    title: "Security + compliance framework",
    description:
      "Our layered privacy controls keep every candidate interaction permissioned and auditable.",
  },
  {
    title: "Designing equitable assessments",
    description:
      "Guidelines for building structured, inclusive interviews powered by adaptive AI.",
  },
];

const testimonials = [
  {
    quote:
      "Entrevisto gives us richer signal than a live panel and collapses days of follow-up into an hour. It has reshaped how our hiring tribes collaborate.",
    name: "Jordan Matthews",
    role: "VP Talent, NovaHire",
  },
  {
    quote:
      "The AI context packs are mind-blowing. Engineers skip straight to technical assessments with everything they need in one place.",
    name: "Priya Desai",
    role: "Head of Recruiting, Atlas Health",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background" id="top">
      <div className="pointer-events-none absolute inset-x-0 top-[-180px] -z-10 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(88,78,220,0.28),_rgba(88,78,220,0)_65%)]" />
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-24 px-4 pb-32 pt-12 sm:px-6 lg:gap-32 lg:px-8">
        <section
          className="relative isolate overflow-hidden rounded-[2.5rem] border border-primary/20 bg-card/90 p-8 shadow-soft sm:p-14"
          id="product"
        >
          <div className="pointer-events-none absolute -top-32 left-3/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                <Fingerprint className="h-4 w-4" />
                Entrevisto • Intelligent hiring OS
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Hire Smarter, Faster - with
                <span className="block text-gradient">
                  AI-powered Interview Screening
                </span>
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                Entrevisto is the AI co-pilot for modern hiring teams. Launch
                adaptive interview screeners, uncover qualitative insights, and
                move the best talent to onsite — all in a single, collaborative
                workspace.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button className="h-12 rounded-full px-6 text-base shadow-bold">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-border/70 bg-background/80 px-6 text-base text-foreground backdrop-blur hover:bg-background"
                >
                  <Play className="h-4 w-4" />
                  Watch product tour
                </Button>
              </div>
              <div className="grid gap-5 rounded-2xl border border-border/70 bg-background/80 p-6 shadow-sm sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="space-y-1 text-left">
                    <p className="text-3xl font-semibold text-foreground">
                      {metric.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="glass-panel relative w-full max-w-md overflow-hidden border border-border/70 p-6 text-left">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">AI Review</span>
                  <span>Candidate • Senior PM</span>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
                    <p className="text-xs uppercase tracking-wide text-primary/80">
                      Summary
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      Strong product depth with hands-on discovery expertise.
                      Demonstrates advanced roadmap prioritization, excellent
                      storytelling, and alignment with leadership principles.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Discovery excellence",
                      "Execution velocity",
                      "Stakeholder influence",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/60 p-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                          9.1
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {item}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            AI confidence: very strong
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Next steps
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-foreground">
                      <span className="rounded-full bg-primary/15 px-3 py-1">
                        Panel interview
                      </span>
                      <span className="rounded-full bg-primary/15 px-3 py-1">
                        Case study
                      </span>
                      <span className="rounded-full bg-primary/15 px-3 py-1">
                        Hiring manager sync
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-14 -right-10 h-40 w-40 rounded-full bg-accent/40 blur-3xl" />
            </div>
          </div>
          <div className="mt-12 border-t border-border/60 pt-8">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              trusted by hiring teams at
            </p>
            <div className="mt-6 grid grid-cols-2 gap-6 text-sm font-semibold text-muted-foreground sm:grid-cols-3 lg:grid-cols-5">
              {trustedLogos.map((logo) => (
                <span
                  key={logo}
                  className="rounded-full border border-border/40 bg-background/80 px-4 py-2 text-center tracking-wide"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="insights" className="space-y-16">
          <SectionHeading
            eyebrow="Why entrevisto"
            title="The strategic AI layer that champions every candidate"
            description="Give recruiting teams context they trust, while ensuring every candidate experiences a thoughtful, equitable screening."
            align="center"
          />
          <div className="grid gap-8 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/80 p-8 shadow-soft transition-transform hover:-translate-y-1 hover:shadow-bold"
              >
                <feature.icon className="h-10 w-10 text-primary" />
                <h3 className="mt-6 text-2xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Explore capability
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="space-y-12">
          <SectionHeading
            eyebrow="Purpose-built workflow"
            title="From first touch to offer, everything lives in Entrevisto"
            description="Our collaborative workspace keeps your entire hiring tribe aligned — with AI orchestrating every step."
            className="max-w-2xl"
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {workflow.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-background/80 p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-lg font-semibold text-primary">
                    {index + 1}
                  </span>
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="security"
          aria-labelledby="security-insights"
          className="space-y-12"
        >
          <SectionHeading
            eyebrow="Insights & trust"
            title="Built for teams who care deeply about security and signal"
            description="Every workflow is private by design with configurable guardrails so you can scale AI responsibly."
            className="max-w-2xl"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {insights.map((insight) => (
              <div
                key={insight.title}
                className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft transition-transform hover:-translate-y-1"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {insight.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {insight.description}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Read the note
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="testimonials" className="space-y-12">
          <SectionHeading
            eyebrow="Hiring leaders love entrevisto"
            title="Signal that brings teams together"
            description="Recruiters and hiring managers finally share the same insights — without sacrificing the candidate experience."
            className="max-w-3xl"
            align="center"
          />
          <div className="grid gap-8 lg:grid-cols-2">
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="relative flex h-full flex-col justify-between rounded-[2.25rem] border border-border/70 bg-background/80 p-8 shadow-soft"
              >
                <QuoteGlow />
                <blockquote className="text-lg font-medium text-foreground">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-8 text-sm font-semibold text-muted-foreground">
                  <p className="text-foreground">{testimonial.name}</p>
                  <p>{testimonial.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          id="about"
          className="relative isolate overflow-hidden rounded-[2.5rem] border border-primary/20 bg-primary/10 p-10 text-center shadow-bold"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,_rgba(88,78,220,0.15),_rgba(88,78,220,0)_70%)]" />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/80 px-4 py-1 text-sm font-medium uppercase tracking-widest text-primary">
              Ready to modernize hiring
            </span>
            <h2 className="text-4xl font-semibold tracking-tight text-foreground">
              Grow faster with Entrevisto’s interview intelligence platform
            </h2>
            <p className="text-base text-muted-foreground">
              Book a tailored walkthrough with our team and learn how Entrevisto
              plugs into your ATS, calendars, and collaboration tools in less
              than a week.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button className="h-12 rounded-full px-7 text-base shadow-bold">
                Talk to our experts
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-full px-7 text-base"
              >
                View security brief
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function QuoteGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[2.25rem]">
      <div className="absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
      <div className="absolute -bottom-24 right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
    </div>
  );
}
