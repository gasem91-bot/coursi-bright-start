import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "بوابة كورسي للذكاء الاصطناعي" },
    { name: "description", content: "بوابة تعلّم الذكاء الاصطناعي بالعربية من كورسي." },
    { property: "og:title", content: "بوابة كورسي للذكاء الاصطناعي" },
    { property: "og:description", content: "تعلّم الذكاء الاصطناعي بالعربية عبر بوابة كورسي." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
