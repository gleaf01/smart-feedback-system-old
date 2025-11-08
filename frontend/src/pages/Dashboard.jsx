import React, { useEffect, useRef, useState } from "react";
import { Chart, ArcElement, PieController } from "chart.js";

Chart.register(ArcElement, PieController);

export default function Dashboard() {
  const chartRef = useRef(null);
  const [summary, setSummary] = useState({ Positive: 0, Negative: 0, Neutral: 0 });

  const fetchSummary = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/summary");
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      new Chart(chartRef.current, {
        type: "pie",
        data: {
          labels: ["Positive", "Negative", "Neutral"],
          datasets: [
            {
              data: [summary.Positive, summary.Negative, summary.Neutral],
              backgroundColor: ["green", "red", "gray"],
            },
          ],
        },
      });
    }
  }, [summary]);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Sentiment Dashboard</h2>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}
