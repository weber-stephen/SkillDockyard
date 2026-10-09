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
          padding: "52px 62px",
          color: "#17253f",
          backgroundColor: "#f4f6fa",
          backgroundImage:
            "linear-gradient(rgba(34, 78, 165, 0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 78, 165, 0.065) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 27, fontWeight: 700, letterSpacing: -0.4 }}>
          <div
            style={{
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 3,
              background: "#224ea5",
              color: "#fbfcff",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: -1
            }}
          >
            ↝
          </div>
          Skill Dockyard
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 42 }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 670 }}>
            <div style={{ color: "#224ea5", fontSize: 17, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }}>
              Shared AI skills, reviewed and ready to use
            </div>
            <div style={{ marginTop: 18, fontSize: 64, fontWeight: 700, lineHeight: 0.98, letterSpacing: -2.8 }}>
              Keep your team’s best AI instructions current.
            </div>
          </div>

          <div style={{ width: 330, display: "flex", flexDirection: "column", border: "1px solid #b9c8e6", background: "#fbfcff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #c9d5ec" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: "#224ea5", fontSize: 12, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>Submitted update</div>
                <div style={{ marginTop: 5, fontSize: 17, fontWeight: 700 }}>Campaign Brief Builder</div>
              </div>
              <div style={{ padding: "6px 9px", border: "1px solid #e0ad60", background: "#fff6e6", color: "#75420d", fontSize: 11, fontWeight: 800 }}>REVIEW</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "17px 20px", fontSize: 13, color: "#45556f", lineHeight: 1.3 }}>
              <div style={{ display: "flex", gap: 9 }}><span style={{ color: "#224ea5", fontWeight: 800 }}>01</span><span>Compare versions</span></div>
              <div style={{ display: "flex", gap: 9 }}><span style={{ color: "#224ea5", fontWeight: 800 }}>02</span><span>Publish the trusted version</span></div>
              <div style={{ display: "flex", gap: 9 }}><span style={{ color: "#224ea5", fontWeight: 800 }}>03</span><span>Keep every install current</span></div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 18, fontWeight: 600, color: "#45556f" }}>
          <span>Review</span>
          <span style={{ color: "#224ea5", fontSize: 22 }}>→</span>
          <span>Publish</span>
          <span style={{ color: "#224ea5", fontSize: 22 }}>→</span>
          <span>Install</span>
          <div style={{ width: 1, height: 22, margin: "0 4px", background: "#b9c8e6" }} />
          <span>One trusted version for your team</span>
        </div>
      </div>
    ),
    size
  );
}
