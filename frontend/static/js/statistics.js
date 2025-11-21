// Statistics Functionality
function initializeStatistics() {
    // This would be called when the statistics page is loaded
}

function updateStatisticsChart() {
    const chart = document.getElementById('study-chart');
    if (!chart) return;
    
    chart.innerHTML = appData.studyData.week.map((hours, index) => {
        const height = (hours / 4) * 100; // Assuming 4 hours is max for 100% height
        return `<div class="chart-bar" style="height: ${height}%" title="${hours}h"></div>`;
    }).join('');
}