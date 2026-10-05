import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";
import { ogImage } from "@/lib/site";

/*
 * Open Graph image, rendered once at build time to `out/og.png`.
 *
 * Why a route handler named `og.png` instead of the `opengraph-image.tsx`
 * convention: with static export that convention emits an extension-less file
 * (`/opengraph-image`), and GitHub Pages picks Content-Type from the extension —
 * it would be served as application/octet-stream and some crawlers drop it.
 */
export const dynamic = "force-static";

export function GET() {
  const [firstName, ...rest] = profile.name.split(" ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(circle at 85% 10%, #3b2a7a 0%, #0c0e14 55%)",
          color: "#f5f3ec",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, color: "#b9bcc8" }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#c5f04a" }} />
          {`${profile.headline} · ${profile.focus.join(" · ")}`}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 120,
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: -4,
          }}
        >
          <span>{firstName}</span>
          <span style={{ color: "#c5f04a" }}>{`${rest.join(" ")}.`}</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#b9bcc8" }}>
          {`${profile.location} · ${profile.workMode} · mevdad.github.io`}
        </div>
      </div>
    ),
    { width: ogImage.width, height: ogImage.height },
  );
}
