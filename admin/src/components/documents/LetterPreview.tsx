import { forwardRef } from "react";

type Props = {
  html: string;
  /** A4 width in px at 96dpi, so the on-screen preview matches the export. */
  width?: number;
};

/**
 * Renders a letter on a fixed white page regardless of the admin's theme —
 * a document exported in dark mode would otherwise come out unreadable.
 */
const LetterPreview = forwardRef<HTMLDivElement, Props>(
  ({ html, width = 794 }, ref) => (
    <div style={{ overflowX: "auto" }}>
      <div
        ref={ref}
        style={{
          width,
          minHeight: 500,
          margin: "0 auto",
          padding: "56px 64px",
          background: "#ffffff",
          color: "#1e2d40",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 15,
          lineHeight: 1.7,
          boxShadow: "0 2px 16px rgba(0,0,0,.12)",
        }}
      >
        <div
          style={{
            borderBottom: "3px solid #0fcda1",
            paddingBottom: 14,
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 30,
              height: 30,
              lineHeight: "30px",
              textAlign: "center",
              borderRadius: 8,
              background: "#0fcda1",
              color: "#1e2d40",
              fontWeight: 800,
              fontFamily: "Arial, sans-serif",
            }}
          >
            W
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              color: "#1e2d40",
              fontFamily: "Arial, sans-serif",
            }}
          >
            WebSyner
          </span>
        </div>

        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
);

LetterPreview.displayName = "LetterPreview";

export default LetterPreview;
