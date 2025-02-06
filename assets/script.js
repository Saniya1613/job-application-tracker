// Select elements
const loginSection = document.getElementById("login-section");
const mainContent = document.getElementById("main-content");
const jobForm = document.getElementById("job-form");
const jobTitleInput = document.getElementById("job-title");
const companyNameInput = document.getElementById("company-name");
const applicationDateInput = document.getElementById("application-date");
const jobColumns = document.querySelectorAll(".column .job-list");
const appliedCount = document.getElementById("applied-count");
const interviewCount = document.getElementById("interview-count");
const offerCount = document.getElementById("offer-count");

// Initialize statistics
let stats = { applied: 0, interview: 0, offer: 0 };

// Google API initialization
let gapiInitialized = false;

function initGapi() {
    gapi.load('client:auth2', async () => {
        try {
            await gapi.client.init({
                apiKey: 'AIzaSyDZWfACxjKK9qywAu0TbygkkDugIWaNFR0',  // Replace with your actual API key
                clientId: '372853623421-3t6efncpisspa8ch6jddjo7s7f47a4du.apps.googleusercontent.com',  // Replace with your actual Client ID
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                scope: 'https://www.googleapis.com/auth/calendar.events',
            });
            gapiInitialized = true;
        } catch (error) {
            console.error("Error initializing Google API:", error);
        }
    });
}

// Handle Google Sign-In
function handleLogin(response) {
    // Hide the login section
    loginSection.style.display = "none";

    // Show the main content
    mainContent.style.display = "block";

    // Initialize Google API Client
    initGapi();
}

// Event listener for adding new jobs
jobForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = jobTitleInput.value.trim();
    const company = companyNameInput.value.trim();
    const date = applicationDateInput.value.trim();

    if (title === "" || company === "") {
        alert("⚠️ Please fill out both the Job Title and Company Name.");
        return;
    }

    addJob(title, company, date);
    jobForm.reset(); // Clear form
    updateStats();
});

// Function to add a job to the "Applied" column by default
function addJob(title, company, date) {
    const jobCard = document.createElement("div");
    jobCard.classList.add("job-card");
    jobCard.draggable = true;

    jobCard.innerHTML = `
        <strong>${title}</strong> at ${company} <br>
        <small>Applied on: ${date || "N/A"}</small>
        <button class="schedule-btn">Schedule Interview</button>
    `;

    // Drag event listeners
    jobCard.addEventListener("dragstart", () => {
        jobCard.classList.add("dragging");
    });

    jobCard.addEventListener("dragend", () => {
        jobCard.classList.remove("dragging");
        updateStats();
    });

    // Schedule Interview Button
    jobCard.querySelector(".schedule-btn").addEventListener("click", () => {
        scheduleInterview(jobCard, title, company, date);
    });

    document.querySelector("#applied .job-list").appendChild(jobCard);
    stats.applied++;
    updateStats();
}

// Drag-and-drop functionality
jobColumns.forEach(column => {
    column.addEventListener("dragover", (e) => {
        e.preventDefault(); // Allow dropping
        const dragging = document.querySelector(".dragging");
        if (dragging && !column.contains(dragging)) {
            column.appendChild(dragging);
        }
    });
});

// Update statistics
function updateStats() {
    stats.applied = document.querySelector("#applied .job-list").children.length;
    stats.interview = document.querySelector("#interview .job-list").children.length;
    stats.offer = document.querySelector("#offer .job-list").children.length;

    appliedCount.textContent = stats.applied;
    interviewCount.textContent = stats.interview;
    offerCount.textContent = stats.offer;
}

// Schedule Interview with Google Calendar
async function scheduleInterview(jobCard, title, company, date) {
    if (!gapiInitialized) {
        alert("Google API not initialized. Please log in again.");
        return;
    }

    const event = {
        summary: `Interview: ${title} at ${company}`,
        description: `Interview for the ${title} position at ${company}.`,
        start: {
            dateTime: new Date(date).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
            dateTime: new Date(new Date(date).getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
    };

    try {
        const response = await gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        console.log("Event created:", response.result);
        alert("Event added to Google Calendar!");

        // Move the job card to the "Interview" column
        const interviewColumn = document.querySelector("#interview .job-list");
        interviewColumn.appendChild(jobCard);
        updateStats();
    } catch (error) {
        console.error("Error creating event:", error);
        alert("Failed to add event to Google Calendar.");
    }
}

// Fetch jobs from the API
async function fetchJobs() {
    try {
        const response = await fetch("https://jsearch.p.rapidapi.com/search?query=software%20developer", {
            method: "GET",
            headers: {
                "X-RapidAPI-Key": "66764e24c8mshd802fd61df98388p1d0342jsn8d5572aac0a8",  // Replace with your actual API key
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        displayJobs(data.data);
    } catch (error) {
        console.error("Error fetching jobs:", error);
        document.getElementById("api-jobs").innerHTML = "<p>⚠️ Could not fetch jobs. Please try again later.</p>";
    }
}

// Display job listings from the API
function displayJobs(jobs) {
    const jobContainer = document.getElementById("api-jobs");
    jobContainer.innerHTML = ""; // Clear previous jobs

    jobs.slice(0, 5).forEach(job => {
        const jobCard = document.createElement("div");
        jobCard.classList.add("job-card");
        jobCard.innerHTML = `
            <strong>${job.job_title}</strong> at ${job.employer_name} <br>
            <small>Location: ${job.job_city || "Remote"}</small>
            <button class="add-job-btn">Add to Applied</button>
        `;

        // Add event listener to the "Add to Applied" button
        jobCard.querySelector(".add-job-btn").addEventListener("click", () => {
            addJob(job.job_title, job.employer_name, new Date().toISOString().split('T')[0]);
        });

        jobContainer.appendChild(jobCard);
    });
}

// Fetch jobs when the page loads
fetchJobs();