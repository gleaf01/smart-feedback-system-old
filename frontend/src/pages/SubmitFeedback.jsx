import React, { useState } from "react";
import FeedbackForm from "../components/FeedbackForm";
import SentimentBadge from "../components/SentimentBadge";

export default function SubmitFeedback() {
  const [sentiment, setSentiment] = useState("");

  const submitFeedback = async (message) => {
    try {
      const res = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setSentiment(data.sentiment);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Submit Feedback</h2>
      <FeedbackForm onSubmit={submitFeedback} />
      {sentiment && (
        <div className="mt-4">
          Sentiment: <SentimentBadge sentiment={sentiment} />
        </div>
      )}
    </div>
  );
}
