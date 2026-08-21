import { createFileRoute } from "@tanstack/react-router";

// Temporary, token-gated visual review of the branded email templates.
// GET /api/public/email-preview?token=...            -> index of templates
// GET /api/public/email-preview?token=...&key=welcome -> raw rendered email

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/email-preview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const expected = process.env["EMAIL_PREVIEW_TOKEN"];
        if (!expected) return new Response("Not found", { status: 404 });

        const url = new URL(request.url);
        const token = url.searchParams.get("token") ?? "";
        if (!timingSafeEqual(token, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { buildEmailPreviews } = await import("@/lib/email-previews.server");
        const previews = await buildEmailPreviews();

        const key = url.searchParams.get("key");
        if (key) {
          const found = previews.find((p) => p.key === key);
          if (!found) return new Response("Unknown template", { status: 404 });
          return new Response(found.html, {
            headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" },
          });
        }

        const esc = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

        const sections = previews
          .map(
            (p) => `
            <section>
              <h2>${esc(p.label)}</h2>
              <div class="meta">
                <div><b>الموضوع:</b> ${esc(p.subject)}</div>
                <div><b>من:</b> ${esc(p.from)} &nbsp;·&nbsp; <b>إلى:</b> ${esc(p.to)}</div>
                <div><a href="?token=${encodeURIComponent(token)}&key=${encodeURIComponent(p.key)}" target="_blank">فتح بملء الشاشة</a></div>
              </div>
              <iframe title="${esc(p.label)}" src="?token=${encodeURIComponent(token)}&key=${encodeURIComponent(p.key)}"></iframe>
            </section>`,
          )
          .join("");

        const page = `<!doctype html><html lang="ar" dir="rtl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>معاينة رسائل البريد — كورسي</title>
<style>
body{margin:0;background:#0A0A0A;color:#EDEDED;font-family:Cairo,'Noto Sans Arabic',system-ui,sans-serif;padding:24px}
h1{font-size:22px;margin:0 0 18px}
section{margin-bottom:34px}
h2{font-size:17px;margin:0 0 8px}
.meta{font-size:13px;color:#A5A5A5;display:grid;gap:4px;margin-bottom:10px}
.meta b{color:#EDEDED}
a{color:#7B35C0}
iframe{width:100%;max-width:900px;height:820px;border:1px solid rgba(255,255,255,.15);border-radius:14px;background:#fff}
</style></head><body>
<h1>معاينة رسائل البريد (بيانات تجريبية)</h1>
${sections}
</body></html>`;

        return new Response(page, {
          headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" },
        });
      },
    },
  },
});
