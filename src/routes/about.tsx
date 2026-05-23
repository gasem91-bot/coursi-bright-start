import { createFileRoute } from "@tanstack/react-router";
import { Target, Users, Award, Rocket } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const pillars = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "Democratize AI education by making cutting-edge knowledge accessible to anyone with the curiosity to learn. We believe the builders of tomorrow need no gatekeepers.",
  },
  {
    icon: Users,
    title: "Our Community",
    description:
      "A global network of 48,000+ learners, researchers, and practitioners across 90 countries. Connect, collaborate, and grow together.",
  },
  {
    icon: Award,
    title: "Our Standards",
    description:
      "Every curriculum is designed and reviewed by active AI researchers and industry leaders. We teach what is shipping today, not what was relevant five years ago.",
  },
  {
    icon: Rocket,
    title: "Our Vision",
    description:
      "A world where every engineer, scientist, and creative can harness the power of artificial intelligence to solve meaningful problems.",
  },
];

const team = [
  { name: "Dr. Elena Vasquez", role: "Chief Learning Officer", initials: "EV" },
  { name: "James Okonkwo", role: "Head of Curriculum", initials: "JO" },
  { name: "Sarah Chen", role: "Lead ML Mentor", initials: "SC" },
  { name: "Marcus Rivera", role: "Platform Engineering", initials: "MR" },
];

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            About COURSI
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            COURSI was born from a simple belief: the future belongs to those who understand AI. Founded in 2023 by a collective of researchers, educators, and engineers, we set out to create the learning experience we wished existed when we started our own journeys.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Today, COURSI is the premier destination for serious learners who want to move beyond tutorials and build real, production-grade AI systems. Our mentors have trained models at OpenAI, Google DeepMind, and Anthropic. Our graduates ship products that millions of people use every day.
          </p>
        </div>
      </section>

      <section className="border-y border-border/50 bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="flex flex-col">
                <div className="inline-flex w-fit rounded-xl bg-primary/10 p-3 text-primary">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Meet the Team
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            A small but mighty team obsessed with building the best way to learn AI.
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center rounded-2xl border border-border/50 bg-card p-6 text-center transition-all hover:border-primary/20"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {member.initials}
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold text-card-foreground">
                {member.name}
              </h3>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
