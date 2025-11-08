// script.js

const currentPage = window.location.pathname.split("/").pop();

// REGISTER PAGE
if (currentPage === "register.html") {
  const registerForm = document.getElementById("registerForm");
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const role = document.getElementById("regRole").value;

    try {
      const res = await fetch("http://127.0.0.1:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (res.status === 201) {
        alert("Registration successful! Please log in.");
        window.location.href = "login.html";
      } else {
        alert(data.error);
      }
    } catch {
      alert("Error during registration.");
    }
  });
}

// LOGIN PAGE
if (currentPage === "login.html") {
  const loginForm = document.getElementById("loginForm");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.status === 200) {
        localStorage.setItem("user", JSON.stringify(data.user));
        alert(`Welcome, ${data.user.name}!`);
        if (data.user.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "feedback.html";
        }
      } else {
        alert(data.error);
      }
    } catch {
      alert("Error during login.");
    }
  });
}

// FEEDBACK PAGE
if (currentPage === "feedback.html") {
  const user = JSON.parse(localStorage.getItem("user"));
  const feedbackForm = document.getElementById("feedbackForm");
  const resultDiv = document.getElementById("result");
  const chartCanvas = document.getElementById("sentimentChart");
  let sentimentChart;

  feedbackForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = document.getElementById("feedbackInput").value.trim();
    if (!message) return;

    const user_id = user ? user.id : null;

    const res = await fetch("http://127.0.0.1:5000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, user_id }),
    });
    const data = await res.json();
    resultDiv.textContent = `Sentiment: ${data.sentiment}`;
    feedbackForm.reset();
    loadSummary();
  });

  async function loadSummary() {
    const res = await fetch("http://127.0.0.1:5000/api/summary");
    const data = await res.json();

    const labels = Object.keys(data);
    const values = Object.values(data);

    if (sentimentChart) sentimentChart.destroy();
    sentimentChart = new Chart(chartCanvas, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: ["#4CAF50", "#F44336", "#9E9E9E"],
          },
        ],
      },
    });
  }

  loadSummary();
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// ADMIN PAGE
// if (currentPage === "admin.html") {
//   const tbody = document.querySelector("#feedbackTable tbody");
//   loadAdmin();

//   async function loadAdmin() {
//     const res = await fetch("http://127.0.0.1:5000/api/all_feedback");
//     const feedbacks = await res.json();
//     tbody.innerHTML = "";
//     feedbacks.forEach((fb) => {
//       const tr = document.createElement("tr");
//       tr.innerHTML = `
//         <td>${fb.user_name || "Guest"}</td>
//         <td>${fb.message}</td>
//         <td>${fb.sentiment}</td>
//         <td>${new Date(fb.timestamp).toLocaleString()}</td>
//         <td><button class="deleteBtn" onclick="deleteFeedback(${fb.id})">Delete</button></td>
//       `;
//       tbody.appendChild(tr);
//     });
//   }
// }

// async function deleteFeedback(id) {
//   await fetch(`http://127.0.0.1:5000/api/feedback/${id}`, { method: "DELETE" });
//   alert("Feedback deleted.");
//   location.reload();
// }


// ADMIN PAGE
if (currentPage === "admin.html") {
  const tbody = document.querySelector("#feedbackTable tbody");
  const positiveCount = document.getElementById("positiveCount");
  const negativeCount = document.getElementById("negativeCount");
  const neutralCount = document.getElementById("neutralCount");
  const chartCanvas = document.getElementById("sentimentChart");
  let mainChart;

  loadAdmin();

  async function loadAdmin() {
    const res = await fetch("http://127.0.0.1:5000/api/all_feedback");
    const feedbacks = await res.json();

    let pos = 0, neg = 0, neu = 0;
    tbody.innerHTML = "";

    feedbacks.forEach((fb) => {
      if (fb.sentiment === "positive") pos++;
      else if (fb.sentiment === "negative") neg++;
      else neu++;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${fb.user_name || "Guest"}</td>
        <td>${fb.message}</td>
        <td>${fb.sentiment}</td>
        <td>${new Date(fb.timestamp).toLocaleString()}</td>
        <td><canvas id="chart-${fb.id}" width="80" height="80"></canvas></td>
        <td><button class="deleteBtn" onclick="deleteFeedback(${fb.id})">Delete</button></td>
      `;
      tbody.appendChild(tr);

      // mini chart for each feedback
      setTimeout(() => {
        const ctx = document.getElementById(`chart-${fb.id}`).getContext("2d");
        new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["Positive", "Negative", "Neutral"],
            datasets: [
              {
                data: [
                  fb.sentiment === "positive" ? 1 : 0,
                  fb.sentiment === "negative" ? 1 : 0,
                  fb.sentiment === "neutral" ? 1 : 0,
                ],
                backgroundColor: ["#4CAF50", "#F44336", "#9E9E9E"],
              },
            ],
          },
          options: { plugins: { legend: { display: false } } },
        });
      }, 200);
    });

    positiveCount.textContent = pos;
    negativeCount.textContent = neg;
    neutralCount.textContent = neu;

    // main sentiment chart
    if (mainChart) mainChart.destroy();
    mainChart = new Chart(chartCanvas, {
      type: "pie",
      data: {
        labels: ["Positive", "Negative", "Neutral"],
        datasets: [
          {
            data: [pos, neg, neu],
            backgroundColor: ["#4CAF50", "#F44336", "#9E9E9E"],
          },
        ],
      },
    });
  }
}

