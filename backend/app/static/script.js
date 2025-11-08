// C:\TCS-Project\Smart-feedback-system\backend\static\script.js

// Base URL for the API (since the frontend is served by Flask itself, we can use relative paths)
const API_BASE_URL = '/api';

// -----------------------------------------------------------------
// BASE CONFIGURATION & UTILITY FUNCTIONS
// -----------------------------------------------------------------

const SENTIMENT_COLORS = {
    Positive: 'rgba(76, 175, 80, 0.8)',   // Green
    Negative: 'rgba(244, 67, 54, 0.8)',   // Red
    Neutral: 'rgba(255, 193, 7, 0.8)'     // Amber
};

// Chart instances
let sentimentChartInstance = null; // Feedback page chart
let pieChartInstance = null;       // Admin Pie chart
let barChartInstance = null;       // Admin Bar chart


/**
 * Displays a message to the user, typically for success or error feedback.
 * @param {string} message The text message to display.
 * @param {string} type 'success' or 'error' to determine styling.
 */
function showMessage(message, type = 'info') {
    const resultDiv = document.getElementById('result') || document.querySelector('.message-area');
    if (resultDiv) {
        // Simple inline styling for compatibility with all pages
        let style = '';
        if (type === 'success') {
            style = 'color: #155724; background-color: #d4edda; border-color: #c3e6cb;';
        } else if (type === 'error') {
            style = 'color: #721c24; background-color: #f8d7da; border-color: #f5c6cb;';
        } else {
            style = 'color: #004085; background-color: #cce5ff; border-color: #b8daff;';
        }

        // Apply styles directly
        resultDiv.innerHTML = `<div style="${style} padding: 10px; border-radius: 4px; border: 1px solid;">${message}</div>`;
        resultDiv.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 5000);
    } else {
        console.log(`Message (${type}): ${message}`);
    }
}

/**
 * Handles the asynchronous communication with the Flask API.
 */
async function callApi(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (data) config.body = JSON.stringify(data);

    try {
        const response = await fetch(url, config);
        let result = null;

        // Try to parse JSON safely (handles empty or invalid responses)
        try {
            result = await response.json();
        } catch {
            result = {}; // fallback if response is not JSON
        }

        if (!response.ok) {
            const errorMsg = result.error || `HTTP Error ${response.status}`;
            showMessage(errorMsg, 'error');
            throw new Error(errorMsg);
        }

        return result;

    } catch (error) {
        console.error('API Call Error:', error);
        // Only show generic message if no specific error is available
        if (!error.message || error.message.startsWith('HTTP Error')) {
            showMessage("An unexpected network error occurred.", 'error');
        }
        throw error;
    }
}


/**
 * Logs out the user by clearing local storage and redirecting to home.
 */
function logout() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    window.location.href = '/'; // Redirect to the root (home) route
}


// -----------------------------------------------------------------
// APPLICATION LOGIC (INITIALIZATION)
// -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Form Handlers
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', handleSubmitFeedback);
        updateSentimentChart(); // Load chart on feedback page

        // NEW: Check for logged-in user on the feedback page and show history button
        const userId = localStorage.getItem('user_id');
        const viewHistoryBtn = document.getElementById('viewHistoryBtn');
        if (userId && viewHistoryBtn) {
            viewHistoryBtn.style.display = 'inline-block';
        }
    }

    // --- Page Initialization Logic ---
    
    // 1. User History Handler
    if (window.location.pathname === '/history') {
        loadUserHistory();
    }


    // 2. Admin Dashboard Handler
    if (window.location.pathname === '/admin') {
        const userRole = localStorage.getItem('user_role');
        if (userRole === 'admin') {
            updateSentimentChart(true); // Load charts and fetch stats
            
            // Get current filter value on page load
            const initialFilter = document.getElementById('sentimentFilter')?.value || 'All';
            fetchAllFeedback(initialFilter); 
            
        } else {
            // Basic access denied message for unauthorized access
            const adminSection = document.querySelector('.admin-section');
            if (adminSection) {
                adminSection.innerHTML = '<div style="text-align: center; margin-top: 50px;"><h2>Access Denied</h2><p>You must be logged in as an administrator to view this page.</p><button onclick="logout()">Go to Home</button></div>';
            }
        }
    }
});

// -----------------------------------------------------------------
// FORM SUBMISSION HANDLERS
// -----------------------------------------------------------------

// --- Registration ---
async function handleRegister(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        role: document.getElementById('regRole').value
    };

    try {
        const result = await callApi('/register', 'POST', data);
        showMessage(result.message || 'Registration successful! Redirecting to login.', 'success');
        
        // Clear form fields
        document.getElementById('regName').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regRole').value = '';

        setTimeout(() => {
             window.location.href = '/login'; 
        }, 1500);

    } catch (error) {
        // Error handled in callApi
    }
}

// --- Login ---
async function handleLogin(e) {
    e.preventDefault();

    const data = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    try {
        const result = await callApi('/login', 'POST', data);
        const user = result.user;
        
        // Store user ID/role
        localStorage.setItem('user_id', user.id);
        localStorage.setItem('user_role', user.role);
        localStorage.setItem('user_name', user.name);
        
        showMessage(`Welcome back, ${user.name}! Logging you in...`, 'success');
        
        // Redirect based on role
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = '/admin';
            } else {
                // Standard user redirection
                window.location.href = '/feedback'; 
            }
        }, 1500);

    } catch (error) {
        // Error handled in callApi
    }
}

// --- Feedback Submission ---
async function handleSubmitFeedback(e) {
    e.preventDefault();

    const message = document.getElementById('feedbackInput').value;
    const user_id = localStorage.getItem('user_id'); 

    const data = { message, user_id };

    try {
        const result = await callApi('/feedback', 'POST', data);
        
        // If a user is logged in, show the link to their history
        const historyLink = user_id ? ` <a href="/history" style="color: #155724;">View your history</a>.` : '';
        showMessage(`Feedback submitted! Sentiment analyzed as: ${result.sentiment}.${historyLink}`, 'success');
        document.getElementById('feedbackInput').value = '';
        
        updateSentimentChart(); // Refresh chart on current page

    } catch (error) {
        // Error handled in callApi
    }
}


// -----------------------------------------------------------------
// NEW: USER HISTORY LOGIC 
// -----------------------------------------------------------------

/**
 * Loads and displays the current user's feedback history.
 */
async function loadUserHistory() {
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('user_name');
    const tableBody = document.getElementById('historyTableBody');
    const nameHeader = document.getElementById('userNameHeader');

    if (!userId || !tableBody) {
        // Set message if user is not logged in
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="3">You must be logged in to view your history. Please <a href="/login">login</a>.</td></tr>';
        }
        return;
    }
    
    if (userName && nameHeader) {
        nameHeader.textContent = `${userName}'s Feedback History`;
    }

    tableBody.innerHTML = '<tr><td colspan="3">Loading history...</td></tr>';
    
    try {
        // Note: API endpoint takes user ID from path
        const history = await callApi(`/feedback/history/${userId}`, 'GET');
        tableBody.innerHTML = ''; // Clear loading row

        if (history.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">You have not submitted any feedback yet.</td></tr>';
            return;
        }

        history.forEach(fb => {
            const row = tableBody.insertRow();
            const date = new Date(fb.timestamp).toLocaleString();
            
            row.insertCell().innerText = date;
            row.insertCell().innerText = fb.message;
            
            const sentimentCell = row.insertCell();
            sentimentCell.innerText = fb.sentiment;
            sentimentCell.classList.add(`sentiment-${fb.sentiment.toLowerCase()}`); 
        });

    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="3" style="color: red;">Error fetching your feedback history.</td></tr>';
        console.error("Failed to fetch user history:", error);
    }
}


// -----------------------------------------------------------------
// ADMIN DASHBOARD LOGIC 
// -----------------------------------------------------------------

/**
 * Fetches the sentiment summary and updates all relevant visualizations.
 * @param {boolean} updateStats If true, also updates the stat cards on the Admin page.
 */
async function updateSentimentChart(updateStats = false) {
    // Admin Chart elements
    const pieCanvas = document.getElementById('sentimentPieChart');
    const barCanvas = document.getElementById('sentimentBarChart');
    // Feedback Page Chart element
    const feedbackChartCanvas = document.getElementById('sentimentChart');

    if (!pieCanvas && !barCanvas && !feedbackChartCanvas) return;

    try {
        const summary = await callApi('/summary', 'GET');
        
        const labels = ['Positive', 'Negative', 'Neutral'];
        const data = [
            summary.Positive || 0, 
            summary.Negative || 0, 
            summary.Neutral || 0
        ];
        
        const backgroundColors = labels.map(label => SENTIMENT_COLORS[label]);

        // 1. Update the Stat Cards (Admin Page only)
        if (updateStats) {
            document.getElementById('positiveCount').textContent = summary.Positive || 0;
            document.getElementById('negativeCount').textContent = summary.Negative || 0;
            document.getElementById('neutralCount').textContent = summary.Neutral || 0;
        }

        // 2. Feedback Page Chart (Single Pie Chart)
        if (feedbackChartCanvas) {
             if (sentimentChartInstance) {
                sentimentChartInstance.data.datasets[0].data = data;
                sentimentChartInstance.update();
            } else {
                sentimentChartInstance = new Chart(feedbackChartCanvas, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{ data: data, backgroundColor: backgroundColors }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: 'Overall Feedback Sentiment Distribution' }
                        }
                    }
                });
            }
            return;
        }


        // --- ADMIN CHARTS ---

        // 3. PIE CHART Logic (Distribution)
        if (pieCanvas && pieChartInstance) {
            pieChartInstance.data.datasets[0].data = data;
            pieChartInstance.update();
        } else if (pieCanvas) {
            pieChartInstance = new Chart(pieCanvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'right' },
                        title: { display: false } 
                    }
                }
            });
        }

        // 4. BAR CHART Logic (Comparison)
        if (barCanvas && barChartInstance) {
            barChartInstance.data.datasets[0].data = data;
            barChartInstance.update();
        } else if (barCanvas) {
            barChartInstance = new Chart(barCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Count',
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: labels.map(label => SENTIMENT_COLORS[label].replace('0.8', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        title: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0 }
                        }
                    }
                }
            });
        }

    } catch (error) {
        console.error("Could not load sentiment summary for charts.", error);
    }
}

/**
 * Global function called by the select dropdown in Admin.html (onchange)
 * Handles filtering the feedback table.
 */
function filterFeedback() {
    const filter = document.getElementById('sentimentFilter').value;
    fetchAllFeedback(filter);
}

/**
 * Fetches feedback based on the selected filter and repopulates the table.
 * @param {string} filter The sentiment value ('Positive', 'Negative', 'Neutral', 'All').
 */
async function fetchAllFeedback(filter = 'All') {
    const tableBody = document.querySelector('#feedbackTable tbody');
    if (!tableBody) return;
    
    // Clear the table and show loading state
    const numColumns = 5; 
    tableBody.innerHTML = `<tr><td colspan="${numColumns}">Loading feedback...</td></tr>`; 

    try {
        let endpoint = '/all_feedback';
        // Apply sentiment filter query parameter
        if (filter !== 'All') {
            endpoint += `?sentiment=${filter}`;
        }

        const feedbacks = await callApi(endpoint, 'GET');
        
        tableBody.innerHTML = ''; // Clear loading state

        if (feedbacks.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${numColumns}">No ${filter === 'All' ? '' : filter} feedback found.</td></tr>`;
            return;
        }
        
        feedbacks.forEach(fb => {
            const row = tableBody.insertRow();
            
            // Add cells (Name, Feedback, Sentiment, Timestamp, Action) - 5 columns total
            row.insertCell().innerText = fb.user_name;
            row.insertCell().innerText = fb.message;
            
            const sentimentCell = row.insertCell();
            sentimentCell.innerText = fb.sentiment;
            sentimentCell.classList.add(`sentiment-${fb.sentiment.toLowerCase()}`); 
            
            const timestamp = new Date(fb.timestamp).toLocaleString();
            row.insertCell().innerText = timestamp;
            
            // Action (Delete button)
            const actionCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.innerText = 'Delete';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.onclick = () => deleteFeedback(fb.id);
            actionCell.appendChild(deleteBtn);
        });

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="${numColumns}" class="error-state" style="color:red;">Failed to load feedback data. Check console for details.</td></tr>`;
        console.error("Failed to fetch all feedback:", error);
    }
}

/**
 * Sends a DELETE request to remove a feedback entry.
 * @param {number} id The ID of the feedback to delete.
 */
async function deleteFeedback(id) {
    if (!window.confirm(`Are you sure you want to permanently delete feedback ID: ${id}?`)) {
        return;
    }
    
    try {
        const result = await callApi(`/feedback/${id}`, 'DELETE');
        showMessage(result.message || `Feedback ID ${id} deleted.`, 'success');
        
        // Refresh the table and chart after deletion
        const filter = document.getElementById('sentimentFilter').value || 'All';
        fetchAllFeedback(filter);
        updateSentimentChart(true); // true updates the stat cards and chart data

    } catch (error) {
        console.error(`Failed to delete feedback ${id}.`, error);
        showMessage(`Failed to delete feedback ID ${id}.`, 'error');
    }
}
