import { SOCIAL_LINKS } from "@/lib/site";

// Íconos de Instagram, TikTok y Facebook (24 × 24). Solo salen las redes que tienen
// enlace en SOCIAL_LINKS (lib/site.ts).
const ICONS: Record<(typeof SOCIAL_LINKS)[number]["network"], React.ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
      <path d="M16.6 3c.3 2.2 1.6 3.7 3.9 3.9v3.1a7.3 7.3 0 0 1-3.8-1.1v6.2a6.1 6.1 0 1 1-6.1-6.1c.3 0 .6 0 .9.1v3.2a3 3 0 1 0 2.1 2.8V3h3Z" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" />
    </svg>
  ),
};

export function SocialLinks({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  const links = SOCIAL_LINKS.filter((l) => l.url);
  if (links.length === 0) return null;
  const style =
    tone === "dark"
      ? "border-paper/20 text-paper hover:bg-paper hover:text-ink"
      : "border-black/15 text-ink hover:border-ink hover:bg-ink hover:text-paper";
  return (
    <div className={`flex gap-2 ${className}`}>
      {links.map((l) => (
        <a
          key={l.network}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Impreza en ${l.network}`}
          title={l.network}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${style}`}
        >
          {ICONS[l.network]}
        </a>
      ))}
    </div>
  );
}
