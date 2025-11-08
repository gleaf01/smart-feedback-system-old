import React from "react";

export default function SentimentBadge({ sentiment }) {
  const color =
    sentiment === "Positive"
      ? "green"
      : sentiment === "Negative"
      ? "red"
      : "gray";

  return (
    <span
      className={`px-2 py-1 rounded text-white font-semibold bg-${color}-500`}
    >
      {sentiment}
    </span>
  );
}
