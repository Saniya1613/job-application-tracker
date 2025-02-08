// Select elements
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

// Function to add a job
function addJob(title, company, date) {
    const jobCard = createJobCard(title, company, date);
    document.querySelector("#applied .job-list").appendChild(jobCard);
    stats.applied++;
    updateStats();
}

// Function to create a job card
function createJobCard(title, company, date) {
    const jobCard = document.createElement("div");
    jobCard.classList.add("job-card");
    jobCard.draggable = true;

    jobCard.innerHTML = `
        <strong>${title}</strong> at ${company} <br>
        <small>Applied on: ${date || "N/A"}</small>
        <button class="schedule-btn">Schedule Interview</button>
    `;

    // Drag event listeners
    jobCard.addEventListener("dragstart", () => jobCard.classList.add("dragging"));
    jobCard.addEventListener("dragend", () => {
        jobCard.classList.remove("dragging");
        updateStats();
    });

    // Schedule Interview Button
    jobCard.querySelector(".schedule-btn").addEventListener("click", () => {
        scheduleInterview(jobCard, title, company, date);
    });

    return jobCard;
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
function scheduleInterview(jobCard, title, company, date) {
    const interviewColumn = document.querySelector("#interview .job-list");
    interviewColumn.appendChild(jobCard);
    updateStats();

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

    console.log("Event to be scheduled:", event);
    alert("Interview scheduled! Check your Google Calendar.");
}

// Fetch jobs from the API
async function fetchJobs() {
    try {
        const response = await fetch("https://jsearch.p.rapidapi.com/search?query=software%20developer", {
            method: "GET",
            headers: {
                "X-RapidAPI-Key": "YOUR_API_KEY",  // Replace with your actual API key
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
        `;
        jobContainer.appendChild(jobCard);
    });
}

// Fetch jobs when the page loads
document.addEventListener("DOMContentLoaded", () => {
    fetchJobs();
});