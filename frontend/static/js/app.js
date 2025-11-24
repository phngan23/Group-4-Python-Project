// Main Application JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Initialize date display
  updateDateDisplay();

  // Initialize navigation
  initializeNavigation();

  // Initialize all modules
  //initializeTasks();
  //initializePomodoro();
  //initializeMoodTracker();
  //initializeStatistics();

  console.log("Study Tracker App initialized");
});

/*
function initializeTasks() {
    console.warn("initializeTasks() not implemented yet.");
}
*/

// Update current date display
function updateDateDisplay() {
  const dateElement = document.getElementById("current-date");
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  dateElement.textContent = now.toLocaleDateString("en-US", options);
}

// Navigation functionality
function initializeNavigation() {
  const navItems = document.querySelectorAll("a.nav-item");
  const pages = document.querySelectorAll(".page");

  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      const targetPage = this.getAttribute("data-page");

      // Update active nav item
      navItems.forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");

      // Show target page
      pages.forEach((page) => {
        page.classList.remove("active");
        if (page.id === targetPage) {
          page.classList.add("active");
        }
      });

      // Special initialization for specific pages
      if (targetPage === "statistics") {
        updateStatisticsChart();
      }
    });
  });
}

// Sample data for the app
const appData = {
  user: {
    name: "Username",
    studyPoints: 350,
    streak: 7,
  },
  tasks: [
    { id: 1, text: "Complete Math homework", completed: true },
    { id: 2, text: "Read Chapter 5 of Biology", completed: false },
    { id: 3, text: "Prepare for History presentation", completed: false },
  ],
  moodHistory: [
    { day: "Mon", mood: "happy", level: 30 },
    { day: "Tue", mood: "neutral", level: 25 },
    { day: "Wed", mood: "happy", level: 35 },
    { day: "Thu", mood: "sad", level: 20 },
    { day: "Fri", mood: "happy", level: 40 },
  ],
  studyData: {
    week: [2.5, 1.8, 3.2, 2.1, 2.8, 1.5, 1.1], // hours per day
    total: "15h 20m",
    days: 5,
    average: "3h 04m",
  },
};

// Export for use in other modules
window.appData = appData;
