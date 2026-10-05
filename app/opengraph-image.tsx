import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { home } from "@/content";
import { MODELS, getQuestions } from "@/lib/snapshots";

export const alt = home.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori reads woff, not woff2, so the OG image uses the woff copies kept next to the site fonts.
const font = (file: string) => readFile(join(process.cwd(), "app/fonts", file));

export default async function OpengraphImage() {
  const [serif, sans] = await Promise.all([
    font("shippori-mincho-latin-500-normal.woff"),
    font("zen-kaku-gothic-new-latin-400-normal.woff"),
  ]);
  const lead = getQuestions()[0];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#E3E4E2", color: "#141516", padding: "72px 80px", fontFamily: "Sans" }}>
        <div style={{ fontFamily: "Serif", fontSize: 76, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{home.heading}</div>
        <div style={{ fontFamily: "Serif", fontSize: 44, color: "#585B5E", marginTop: 16 }}>{home.subheading}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ fontSize: 24, color: "#585B5E" }}>{lead.question}</div>
          <div
            style={{
              height: 3,
              marginTop: 16,
              backgroundImage:
                "linear-gradient(90deg, #6E7378, #F4F6F7 16%, #9DA3A8 32%, #E9ECEE 50%, #7A8085 68%, #F8F9FA 84%, #8D9398)",
            }}
          />
          <div style={{ display: "flex", marginTop: 20 }}>
            {MODELS.map((m) => (
              <div key={m} style={{ display: "flex", flexDirection: "column", width: "25%", paddingRight: 16 }}>
                <div style={{ fontSize: 20, color: "#585B5E" }}>{m}</div>
                <div style={{ fontFamily: "Serif", fontSize: 32, marginTop: 6 }}>{lead.latest[m][0]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Serif", data: serif, weight: 500, style: "normal" },
        { name: "Sans", data: sans, weight: 400, style: "normal" },
      ],
    },
  );
}
