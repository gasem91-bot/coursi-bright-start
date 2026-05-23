import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Zap, Shield, BarChart3, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CourseCard } from "@/components/CourseCard";
import heroBg from "@/assets/hero-bg.jpg";
import courseMl from "@/assets/course-ml.jpg";
import courseGenai from "@/assets/course-genai.jpg";
import courseDs from "@/assets/course-ds.jpg";

const featuredCourses = [
  {
    title: "Foundations of Machine Learning",
    description: "Master supervised and unsupervised learning, neural networks, and model evaluation with hands-on projects.",
    image: courseMl,
    duration: "12 weeks",
    students: "14.2k",
    rating: 4.9,
    level: "Beginner",
    category: "ML",
  },
  {
    title: "Generative AI & Large Language Models",
    description: "Build with GPT, Claude, and open-source LLMs. Learn prompt engineering, fine-tuning, and agent architectures.",
    image: courseGenai,
    duration: "8 weeks",
    students: "22.8k",
    rating: 4.8,
    level: "Intermediate",
    category: "Gen AI",
  },
  {
    title: "Data Science & Analytics Pipeline",
    description: "From data wrangling to visualization. Learn Python, pandas, SQL, and storytelling with data.",
    image: courseDs,
    duration: "10 weeks",
    students: "11.5k",
    rating: 4.7,
    level: "Beginner",
    category: "Data",
  },
];

const valueProps = [
  {
    icon: Brain,
    title: "Expert Mentorship",
    description: "Learn directly from AI researchers and industry veterans who have shipped models at scale.",
  },
  {
    icon: Zap,
    title: "Hands-On Projects",
    description: "Build real-world applications. Every course includes portfolio-ready projects you can ship.",
  },
  {
    icon: Shield,
    title: "Industry Certification",
    description: "Earn verified credentials recognized by top tech companies and hiring managers worldwide.",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Track your learning velocity with AI-powered insights that adapt to your pace and goals.",
  },
];

const stats = [
  { label: "Active Learners", value: "48K+" },
  { label: "Expert Mentors", value: "120+" },
  { label: "AI Courses", value: "85+" },
  { label: "Countries", value: "90+" },
];

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroBg}
          alt="Abstract AI neural network"
          width={1600}
          height={900}
          className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover opacity-30"
          style={{ minWidth: "100%", minHeight: "100%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              The future of AI education is here
            </div>
            <h1 className="mt-6 font-heading text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Master AI.
              <br />
              <span className="text-primary">Shape the future.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Curated courses in machine learning, generative AI, and data science. Learn from the experts building the next generation of intelligent systems.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
              >
                Explore Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/50 bg-card px-6 py-3 text-base font-medium text-card-foreground transition-colors hover:bg-accent">
                View Curriculum
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-sm font-medium text-muted-foreground">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Value Props */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why COURSI?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            We combine rigorous curriculum with practical application, guided by mentors who have built the AI systems you use every day.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((prop) => (
            <div
              key={prop.title}
              className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                <prop.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">
                {prop.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Featured Courses
              </h2>
              <p className="mt-2 text-muted-foreground">
                Start your AI journey with our most popular programs.
              </p>
            </div>
            <Link
              to="/courses"
              className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:inline-flex"
            >
              View all courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.title} {...course} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/courses"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              View all courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <h2 className="relative font-heading text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to build the future?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Join thousands of engineers, researchers, and founders mastering AI with COURSI.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-6 py-3 text-base font-semibold text-primary shadow-lg transition-colors hover:bg-white"
            >
              Start Learning Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
