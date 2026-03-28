import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { groupsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const SOCIAL_CRAWLERS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "TelegramBot",
  "Slackbot",
  "Discordbot",
  "Pinterest",
  "rogerbot",
  "embedly",
  "quora link preview",
  "outbrain",
  "vkShare",
];

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some((bot) => ua.includes(bot.toLowerCase()));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildOgHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
}): string {
  const { title, description, image, url } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="GroupWatch Platform" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(url)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <!-- Redirect real users to the actual React app -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}" />
</head>
<body>
  <p>Loading GroupWatch Platform...</p>
</body>
</html>`;
}

const PLATFORM_IMAGE = "https://groupwatchplatform.com/images/logo-banner.png";
const BASE_URL = "https://groupwatchplatform.com";

async function getGroupBySlug(slug: string) {
  const [group] = await db
    .select({
      id: groupsTable.id,
      name: groupsTable.name,
      slug: groupsTable.slug,
      description: groupsTable.description,
      logoUrl: groupsTable.logoUrl,
    })
    .from(groupsTable)
    .where(eq(groupsTable.slug, slug))
    .limit(1);
  return group ?? null;
}

export function ogRendererMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ua = req.headers["user-agent"] ?? "";
    if (!isSocialCrawler(ua)) {
      next();
      return;
    }

    try {
      // /report/:slug — public incident report submission form
      const reportMatch = req.path.match(/^\/report\/([^/]+)$/);
      if (reportMatch) {
        const slug = reportMatch[1];
        const group = await getGroupBySlug(slug);
        const groupName = group?.name ?? "a Community Group";
        const image = group?.logoUrl ?? PLATFORM_IMAGE;
        res.setHeader("Content-Type", "text/html");
        res.send(buildOgHtml({
          title: `Report an Incident — ${groupName}`,
          description: `Tap to submit an incident report directly to ${groupName}. Quick, offline-ready, and straight to your group coordinator.`,
          image,
          url: `${BASE_URL}/report/${slug}`,
        }));
        return;
      }

      // /g/:slug — public group profile page
      const groupMatch = req.path.match(/^\/g\/([^/]+)$/);
      if (groupMatch) {
        const slug = groupMatch[1];
        const group = await getGroupBySlug(slug);
        const groupName = group?.name ?? "Community Group";
        const description = group?.description
          ? group.description.slice(0, 160)
          : `${groupName} uses GroupWatch Platform to report incidents, build evidence, and take action.`;
        const image = group?.logoUrl ?? PLATFORM_IMAGE;
        res.setHeader("Content-Type", "text/html");
        res.send(buildOgHtml({
          title: `${groupName} — GroupWatch Platform`,
          description,
          image,
          url: `${BASE_URL}/g/${slug}`,
        }));
        return;
      }
    } catch (err) {
      // If DB lookup fails, fall through to normal app
    }

    next();
  };
}
