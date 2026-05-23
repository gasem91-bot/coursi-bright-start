import { createFileRoute } from "@tanstack/react-router";
import { Search, Filter, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CourseCard } from "@/components/CourseCard";
import courseMl from "@/assets/course-ml.jpg";
import courseGenai from "@/assets/course-genai.jpg";
import courseDs from "@/assets/course-ds.jpg";
import courseNlp from "@/assets/course-nlp.jpg";

const categories = ["All", "ML", "Gen AI", "Data", "NLP", "Computer Vision"];

const allCourses = [
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
  {
    title: "Natural Language Processing Deep Dive",
    description: "Tokenization, embeddings, transformers, and RAG. Build semantic search and chatbot systems from scratch.",
    image: courseNlp,
    duration: "10 weeks",
    students: "9.3k",
    rating: 4.9,
    level: "Advanced",
    category: "NLP",
  },
  {
    title: "Advanced Deep Learning Architectures",
    description: "CNNs, RNNs, attention mechanisms, and modern architectures powering computer vision and multimodal AI.",
    image: courseMl,
    duration: "14 weeks",
    students: "7.1k",
    rating: 4.8,
    level: "Advanced",
    category: "ML",
  },
  {
    title: "MLOps & Model Deployment",
    description: "Productionize ML systems with Docker, Kubernetes, monitoring, and CI/CD pipelines for AI models.",
    image: courseDs,
    duration: "8 weeks",
    students: "5.8k",
    rating: 4.6,
    level: "Intermediate",
    category: "Data",
  },
];

export const Route = createFileRoute("/courses")({
  component: CoursesPage,
});

function CoursesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <section className="border-b border-border/50 bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Explore Courses
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Curated programs designed by AI practitioners. From beginner fundamentals to frontier research.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search courses, topics, or mentors..."
                className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  cat === "All"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/50 bg-card text-card-foreground hover:bg-accent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {allCourses.map((course) => (
            <CourseCard key={course.title} {...course} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <button className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-6 py-3 text-sm font-medium text-card-foreground transition-colors hover:bg-accent">
            Load more courses
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
