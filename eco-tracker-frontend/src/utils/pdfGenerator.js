import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper function to format numbers
const formatNumber = (num) => {
  return parseFloat(num).toFixed(2);
};

// Helper function to format dates
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Add header to PDF
const addHeader = (doc, title, startDate, endDate, generatedAt) => {
  // Logo/Title
  doc.setFontSize(20);
  doc.setTextColor(34, 139, 34); // Green color
  doc.text('Campus Eco-Club', 14, 20);
  
  // Report Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 30);
  
  // Date Range
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Report Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 38);
  doc.text(`Generated: ${formatDate(generatedAt)}`, 14, 44);
  
  // Divider line
  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(0.5);
  doc.line(14, 48, 196, 48);
  
  return 52; // Return starting Y position for content
};

// Add footer to PDF
const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      'Campus Eco-Club - Waste Management System',
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }
};

// Generate Monthly Waste Collection Summary PDF
export const generateWasteCollectionPDF = (reportData, startDate, endDate) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Monthly Waste Collection Summary', startDate, endDate, new Date());
  
  // Summary Section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Executive Summary', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  const summary = reportData.summary;
  doc.text(`Total Waste Collected: ${summary.total_weight} kg`, 20, yPos);
  yPos += 6;
  doc.text(`Total Submissions: ${summary.total_logs}`, 20, yPos);
  yPos += 6;
  doc.text(`Unique Contributors: ${summary.unique_users}`, 20, yPos);
  yPos += 12;
  
  // Waste by Category Table
  doc.setFontSize(14);
  doc.text('Waste Collection by Category', 14, yPos);
  yPos += 6;
  
  doc.autoTable({
    startY: yPos,
    head: [['Category', 'Total Weight (kg)', 'Number of Logs', 'Average Weight (kg)']],
    body: reportData.by_category.map(cat => [
      cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      formatNumber(cat.total_weight),
      cat.log_count,
      formatNumber(cat.avg_weight)
    ]),
    theme: 'grid',
    headStyles: { fillColor: [34, 139, 34] },
    margin: { left: 14, right: 14 }
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // Waste by Event Table (if available)
  if (reportData.by_event && reportData.by_event.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Waste Collection by Event', 14, yPos);
    yPos += 6;
    
    doc.autoTable({
      startY: yPos,
      head: [['Event Name', 'Event Date', 'Total Weight (kg)', 'Submissions']],
      body: reportData.by_event.map(event => [
        event.event_name,
        formatDate(event.event_date),
        formatNumber(event.total_weight),
        event.log_count
      ]),
      theme: 'grid',
      headStyles: { fillColor: [34, 139, 34] },
      margin: { left: 14, right: 14 }
    });
  }
  
  // Daily Breakdown Chart (if available)
  if (reportData.daily_breakdown && reportData.daily_breakdown.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.text('Daily Waste Collection Breakdown', 14, yPos);
    yPos += 6;
    
    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Total Weight (kg)', 'Number of Logs']],
      body: reportData.daily_breakdown.map(day => [
        formatDate(day.date),
        formatNumber(day.total_weight),
        day.log_count
      ]),
      theme: 'striped',
      headStyles: { fillColor: [34, 139, 34] },
      margin: { left: 14, right: 14 }
    });
  }
  
  addFooter(doc);
  doc.save(`Waste_Collection_Summary_${startDate}_to_${endDate}.pdf`);
};

// Generate User Activity Report PDF
export const generateUserActivityPDF = (reportData, startDate, endDate) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'User Activity Report', startDate, endDate, new Date());
  
  // Summary Section
  doc.setFontSize(14);
  doc.text('Overview', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.text(`New Users Registered: ${reportData.new_users}`, 20, yPos);
  yPos += 12;
  
  // Top Users Table
  doc.setFontSize(14);
  doc.text('Top 20 Most Active Users', 14, yPos);
  yPos += 6;
  
  doc.autoTable({
    startY: yPos,
    head: [['Rank', 'Name', 'Role', 'Submissions', 'Weight (kg)', 'Points Earned']],
    body: reportData.top_users.map((user, index) => [
      index + 1,
      user.name,
      user.role.charAt(0).toUpperCase() + user.role.slice(1),
      user.total_submissions,
      formatNumber(user.total_weight),
      user.total_points
    ]),
    theme: 'grid',
    headStyles: { fillColor: [34, 139, 34] },
    margin: { left: 14, right: 14 }
  });
  
  // Activity by Role (if available)
  if (reportData.activity_by_role && reportData.activity_by_role.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.text('Activity Breakdown by User Role', 14, yPos);
    yPos += 6;
    
    doc.autoTable({
      startY: yPos,
      head: [['Role', 'Active Users', 'Total Submissions', 'Total Weight (kg)']],
      body: reportData.activity_by_role.map(role => [
        role.role.charAt(0).toUpperCase() + role.role.slice(1),
        role.user_count,
        role.total_submissions,
        formatNumber(role.total_weight)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [34, 139, 34] },
      margin: { left: 14, right: 14 }
    });
  }
  
  addFooter(doc);
  doc.save(`User_Activity_Report_${startDate}_to_${endDate}.pdf`);
};

// Generate Event Participation Report PDF
export const generateEventParticipationPDF = (reportData, startDate, endDate) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Event Participation Report', startDate, endDate, new Date());
  
  // Summary Section
  doc.setFontSize(14);
  doc.text('Summary', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  const summary = reportData.summary;
  doc.text(`Total Events: ${summary.total_events}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Registrations: ${summary.total_registrations}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Attended: ${summary.total_attended}`, 20, yPos);
  yPos += 6;
  doc.text(`Attendance Rate: ${summary.attendance_rate}%`, 20, yPos);
  yPos += 12;
  
  // Events Table
  doc.setFontSize(14);
  doc.text('Event Details', 14, yPos);
  yPos += 6;
  
  doc.autoTable({
    startY: yPos,
    head: [['Event Name', 'Date', 'Type', 'Registered', 'Attended', 'Attendance %']],
    body: reportData.events.map(event => [
      event.title,
      formatDate(event.event_date),
      event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1),
      event.total_registered,
      event.total_attended,
      event.total_registered > 0 
        ? ((event.total_attended / event.total_registered) * 100).toFixed(1) + '%'
        : '0%'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [34, 139, 34] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 }
  });
  
  addFooter(doc);
  doc.save(`Event_Participation_Report_${startDate}_to_${endDate}.pdf`);
};

// Generate Recycling Type Breakdown PDF
export const generateRecyclingBreakdownPDF = (reportData, startDate, endDate) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Recycling Type Breakdown', startDate, endDate, new Date());
  
  // Summary
  doc.setFontSize(14);
  doc.text('Total Waste Analysis', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.text(`Total Weight Collected: ${reportData.total_weight} kg`, 20, yPos);
  yPos += 12;
  
  // Category Breakdown Table
  doc.setFontSize(14);
  doc.text('Breakdown by Material Type', 14, yPos);
  yPos += 6;
  
  doc.autoTable({
    startY: yPos,
    head: [['Category', 'Weight (kg)', 'Percentage', 'Logs', 'Points', 'Avg Weight']],
    body: reportData.breakdown.map(cat => [
      cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      formatNumber(cat.total_weight),
      cat.percentage + '%',
      cat.total_logs,
      cat.total_points,
      formatNumber(cat.avg_weight)
    ]),
    theme: 'grid',
    headStyles: { fillColor: [34, 139, 34] },
    margin: { left: 14, right: 14 }
  });
  
  // Add a visual representation (text-based)
  doc.addPage();
  yPos = 20;
  
  doc.setFontSize(14);
  doc.text('Visual Distribution', 14, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  reportData.breakdown.forEach(cat => {
    const barLength = Math.round((cat.percentage / 100) * 160);
    doc.setFillColor(34, 139, 34);
    doc.rect(20, yPos - 3, barLength, 6, 'F');
    doc.text(
      `${cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}: ${cat.percentage}%`,
      20,
      yPos + 10
    );
    yPos += 18;
  });
  
  addFooter(doc);
  doc.save(`Recycling_Type_Breakdown_${startDate}_to_${endDate}.pdf`);
};

// Generate Eco-Points Distribution Report PDF
export const generateEcoPointsPDF = (reportData, startDate, endDate) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Eco-Points Distribution Report', startDate, endDate, new Date());
  
  // Summary
  doc.setFontSize(14);
  doc.text('Overview', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  const summary = reportData.summary;
  doc.text(`Total Points Awarded: ${summary.total_points_awarded}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Logs Processed: ${summary.total_logs}`, 20, yPos);
  yPos += 12;
  
  // Top Earners Table
  doc.setFontSize(14);
  doc.text('Top 50 Point Earners', 14, yPos);
  yPos += 6;
  
  doc.autoTable({
    startY: yPos,
    head: [['Rank', 'Name', 'Role', 'Points Earned', 'Logs', 'Current Points']],
    body: reportData.top_earners.map((user, index) => [
      index + 1,
      user.name,
      user.role.charAt(0).toUpperCase() + user.role.slice(1),
      user.points_earned_in_period,
      user.logs_in_period,
      user.current_points
    ]),
    theme: 'striped',
    headStyles: { fillColor: [34, 139, 34] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 }
  });
  
  // Points by Category
  if (reportData.by_category && reportData.by_category.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.text('Points Distribution by Category', 14, yPos);
    yPos += 6;
    
    doc.autoTable({
      startY: yPos,
      head: [['Category', 'Total Points', 'Logs', 'Avg Points/Log']],
      body: reportData.by_category.map(cat => [
        cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
        cat.total_points,
        cat.log_count,
        formatNumber(cat.avg_points)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [34, 139, 34] },
      margin: { left: 14, right: 14 }
    });
  }
  
  addFooter(doc);
  doc.save(`Eco_Points_Distribution_${startDate}_to_${endDate}.pdf`);
};

// Main function to generate PDF based on report type
export const generateReportPDF = (reportType, reportData, startDate, endDate) => {
  switch (reportType) {
    case 'Monthly Waste Collection Summary':
      generateWasteCollectionPDF(reportData, startDate, endDate);
      break;
    case 'User Activity Report':
      generateUserActivityPDF(reportData, startDate, endDate);
      break;
    case 'Event Participation Report':
      generateEventParticipationPDF(reportData, startDate, endDate);
      break;
    case 'Recycling Type Breakdown':
      generateRecyclingBreakdownPDF(reportData, startDate, endDate);
      break;
    case 'Eco-Points Distribution Report':
      generateEcoPointsPDF(reportData, startDate, endDate);
      break;
    default:
      console.error('Unknown report type');
  }
};