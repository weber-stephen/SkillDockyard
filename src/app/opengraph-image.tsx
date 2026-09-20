import { ImageResponse } from "next/og";

export const alt = "Skill Dockyard — keep your team's AI workflows current";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 76px",
          color: "#201b15",
          backgroundColor: "#f5f0df",
          backgroundImage:
            "linear-gradient(rgba(42, 74, 57, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(42, 74, 57, 0.09) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 700 }}>
          <div
            style={{
              width: 58,
              height: 58,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              background: "#184b36",
              color: "#faf6e8",
              fontSize: 30
            }}
          >
            SD
          </div>
          Skill Dockyard
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
          <div style={{ color: "#184b36", fontSize: 22, fontWeight: 700, letterSpacing: 3.2, textTransform: "uppercase" }}>
            A shared home for your team’s AI workflows
          </div>
          <div style={{ marginTop: 24, fontSize: 72, fontWeight: 700, lineHeight: 0.98, letterSpacing: -2.6 }}>
            Keep your team’s best AI instructions current.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 23, color: "#635b4e" }}>
          <span>Save what works</span>
          <span style={{ color: "#184b36" }}>→</span>
          <span>Review the change</span>
          <span style={{ color: "#184b36" }}>→</span>
          <span>Share the approved version</span>
        </div>
      </div>
    ),
    size
  );
}
