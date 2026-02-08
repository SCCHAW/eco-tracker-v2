import React, { useState, useEffect } from "react";
import {
  Users,
  BarChart3,
  Calendar,
  Download,
  Loader,
  FileText,
} from "lucide-react";

import { generateReportPDF } from "../../utils/pdfGenerator";
import { reportsAPI } from "../../services/api";

function ReportComponent({}) {
  const [stats, setStats] = useState({
    total_waste_collected: 0,
    active_users: 0,
    events_this_month: 0,
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [reportType, setReportType] = useState("Monthly Waste Collection Summary");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await reportsAPI.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      alert("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert("⚠️ Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("⚠️ Start date must be before end date");
      return;
    }

    try {
      setGenerating(true);
      const data = await reportsAPI.generateReport(reportType, startDate, endDate);
      setReportData(data);
      
      // Generate PDF automatically
      generateReportPDF(reportType, data.data, startDate, endDate);
      
      alert("✅ Report generated and downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert(`❌ Failed to generate report: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDFAgain = () => {
    if (reportData) {
      generateReportPDF(reportType, reportData.data, startDate, endDate);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          Generate Waste Collection Reports
        </h3>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Total Waste Collected</p>
            {loading ? (
              <div className="flex justify-center">
                <Loader className="w-8 h-8 text-green-600 animate-spin" />
              </div>
            ) : (
              <p className="text-3xl font-bold text-green-600">
                {stats.total_waste_collected} kg
              </p>
            )}
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Active Users</p>
            {loading ? (
              <div className="flex justify-center">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <p className="text-3xl font-bold text-blue-600">
                {stats.active_users}
              </p>
            )}
          </div>
          
          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Events This Month</p>
            {loading ? (
              <div className="flex justify-center">
                <Loader className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : (
              <p className="text-3xl font-bold text-purple-600">
                {stats.events_this_month}
              </p>
            )}
          </div>
        </div>

        {/* Report Generation Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-800 font-semibold mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
            >
              <option>Monthly Waste Collection Summary</option>
              <option>User Activity Report</option>
              <option>Event Participation Report</option>
              <option>Recycling Type Breakdown</option>
              <option>Eco-Points Distribution Report</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-800 font-semibold mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-800 font-semibold mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
              />
            </div>
          </div>
          
          <button
            onClick={generateReport}
            disabled={generating}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating PDF Report...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generate PDF Report
              </>
            )}
          </button>
        </div>

        {/* Report Generated Confirmation */}
        {reportData && (
          <div className="mt-8 border-t pt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <FileText className="w-10 h-10 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">
                    ✅ Report Generated Successfully!
                  </h4>
                  <p className="text-gray-700 mb-4">
                    Your <strong>{reportType}</strong> for the period{" "}
                    <strong>{startDate}</strong> to <strong>{endDate}</strong>{" "}
                    has been generated and downloaded.
                  </p>
                  <button
                    onClick={downloadPDFAgain}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportComponent;