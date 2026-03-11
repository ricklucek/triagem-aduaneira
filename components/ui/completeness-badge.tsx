"use client";

export default function CompletenessBadge({ value }: { value: number }) {
  const tone =
    value >= 90 ? { bg: "#ecfdf3", border: "#abefc6", text: "#067647" } :
    value >= 60 ? { bg: "#fffaeb", border: "#fedf89", text: "#b54708" } :
    { bg: "#fef3f2", border: "#fecdca", text: "#b42318" };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        color: tone.text,
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {value}%
    </div>
  );
}