import React from "react";
import SubmitFeedback from "./pages/SubmitFeedback";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Smart Feedback Collection System
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SubmitFeedback />
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
