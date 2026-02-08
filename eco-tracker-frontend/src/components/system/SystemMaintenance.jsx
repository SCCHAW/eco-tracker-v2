// ========================================
// FRONTEND - System Maintenance Component
// ========================================
// File: components/SystemMaintenance.jsx
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import React, { useState, useEffect } from "react";
import {
  Server,
  Database,
  HardDrive,
  RefreshCw,
  Trash2,
  Download,
  Activity,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { systemAPI } from "../../services/api";

function SystemMaintenance() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [settings, setSettings] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const [healthData, settingsData] = await Promise.all([
        systemAPI.getSystemHealth(),
        systemAPI.getSystemSettings(),
      ]);
      setHealth(healthData);
      setSettings(settingsData.settings);
    } catch (error) {
      console.error("Failed to fetch system data:", error);
      alert(`❌ Failed to load system data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingToggle = async (key) => {
    try {
      const currentValue = settings[key]?.value || false;
      const newValue = !currentValue;

      // Optimistic update
      setSettings((prev) => ({
        ...prev,
        [key]: { ...prev[key], value: newValue },
      }));

      await systemAPI.updateSetting(key, newValue);
      alert(`✅ Setting updated successfully`);
    } catch (error) {
      console.error("Failed to update setting:", error);
      alert(`❌ Failed to update setting: ${error.message}`);
      // Revert on error
      fetchSystemData();
    }
  };

  const handleAction = async (action, actionName) => {
    if (!window.confirm(`Are you sure you want to ${actionName}?`)) {
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [action]: true }));

      let result;
      switch (action) {
        case "backup":
          result = await systemAPI.runBackup();
          alert(
            `✅ Backup created successfully!\nFile: ${
              result.filename
            }\nSize: ${(result.size / 1024).toFixed(2)} KB`,
          );
          await fetchSystemData(); // Refresh to show new backup time
          break;

        case "cache":
          result = await systemAPI.clearCache();
          alert(`✅ Cache cleared successfully!`);
          break;

        // case "export":
        //   result = await systemAPI.exportData();
        //   // Download as JSON file
        //   const blob = new Blob([JSON.stringify(result, null, 2)], {
        //     type: "application/json",
        //   });
        //   const url = URL.createObjectURL(blob);
        //   const a = document.createElement("a");
        //   a.href = url;
        //   a.download = `eco-tracker-export-${
        //     new Date().toISOString().split("T")[0]
        //   }.json`;
        //   document.body.appendChild(a);
        //   a.click();
        //   document.body.removeChild(a);
        //   URL.revokeObjectURL(url);
        //   alert(
        //     `✅ Data exported successfully!\nTotal Users: ${result.stats.totalUsers}\nTotal Logs: ${result.stats.totalLogs}`
        //   );
        //   break;

        case "export":
          result = await systemAPI.exportData();

          // Generate PDF using jsPDF
          const doc = new jsPDF();
          let yPos = 20;

          // Add header
          doc.setFontSize(20);
          doc.setTextColor(34, 139, 34); // Green color
          doc.text("Campus Eco-Club", 14, yPos);
          yPos += 10;

          doc.setFontSize(16);
          doc.setTextColor(0, 0, 0);
          doc.text("Complete System Data Export", 14, yPos);
          yPos += 8;

          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(
            `Generated: ${new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}`,
            14,
            yPos,
          );
          yPos += 6;

          // Divider line
          doc.setDrawColor(34, 139, 34);
          doc.setLineWidth(0.5);
          doc.line(14, yPos, 196, yPos);
          yPos += 8;

          // Export Statistics
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text("Export Statistics", 14, yPos);
          yPos += 8;

          doc.setFontSize(10);
          doc.text(`Total Users: ${result.stats.totalUsers}`, 20, yPos);
          yPos += 6;
          doc.text(`Total Recycling Logs: ${result.stats.totalLogs}`, 20, yPos);
          yPos += 6;
          doc.text(`Total Events: ${result.stats.totalEvents}`, 20, yPos);
          yPos += 6;
          doc.text(
            `Total Event Participants: ${result.stats.totalParticipants}`,
            20,
            yPos,
          );
          yPos += 6;
          doc.text(
            `Total User Profiles: ${result.stats.totalProfiles}`,
            20,
            yPos,
          );
          yPos += 12;

          // Users Table
          if (result.data.users && result.data.users.length > 0) {
            doc.setFontSize(14);
            doc.text("Users", 14, yPos);
            yPos += 6;

            doc.autoTable({
              startY: yPos,
              head: [
                ["ID", "Name", "Email", "Role", "Eco Points", "Created At"],
              ],
              body: result.data.users.map((user) => [
                user.id,
                user.name,
                user.email,
                user.role,
                user.eco_points,
                new Date(user.created_at).toLocaleDateString(),
              ]),
              theme: "grid",
              headStyles: { fillColor: [34, 139, 34] },
              margin: { left: 14, right: 14 },
              styles: { fontSize: 8 },
            });
            yPos = doc.lastAutoTable.finalY + 10;
          }

          // Recycling Logs Table
          if (
            result.data.recyclingLogs &&
            result.data.recyclingLogs.length > 0
          ) {
            if (yPos > 250) {
              doc.addPage();
              yPos = 20;
            }

            doc.setFontSize(14);
            doc.text("Recycling Logs", 14, yPos);
            yPos += 6;

            doc.autoTable({
              startY: yPos,
              head: [
                [
                  "ID",
                  "User ID",
                  "Category",
                  "Weight (kg)",
                  "Points",
                  "Status",
                  "Date",
                ],
              ],
              body: result.data.recyclingLogs.map((log) => [
                log.id,
                log.user_id,
                log.category,
                parseFloat(log.weight).toFixed(2),
                log.eco_points_earned,
                log.status,
                new Date(log.log_date).toLocaleDateString(),
              ]),
              theme: "grid",
              headStyles: { fillColor: [34, 139, 34] },
              margin: { left: 14, right: 14 },
              styles: { fontSize: 8 },
            });
            yPos = doc.lastAutoTable.finalY + 10;
          }

          // Events Table
          if (result.data.events && result.data.events.length > 0) {
            doc.addPage();
            yPos = 20;

            doc.setFontSize(14);
            doc.text("Events", 14, yPos);
            yPos += 6;

            doc.autoTable({
              startY: yPos,
              head: [["ID", "Title", "Type", "Date", "Location", "Status"]],
              body: result.data.events.map((event) => [
                event.id,
                event.title,
                event.event_type,
                new Date(event.event_date).toLocaleDateString(),
                event.location || "N/A",
                event.status,
              ]),
              theme: "grid",
              headStyles: { fillColor: [34, 139, 34] },
              margin: { left: 14, right: 14 },
              styles: { fontSize: 8 },
            });
            yPos = doc.lastAutoTable.finalY + 10;
          }

          // Event Participants Table
          if (
            result.data.eventParticipants &&
            result.data.eventParticipants.length > 0
          ) {
            if (yPos > 250) {
              doc.addPage();
              yPos = 20;
            }

            doc.setFontSize(14);
            doc.text("Event Participants", 14, yPos);
            yPos += 6;

            doc.autoTable({
              startY: yPos,
              head: [["ID", "Event ID", "User ID", "Status", "Registered At"]],
              body: result.data.eventParticipants.map((participant) => [
                participant.id,
                participant.event_id,
                participant.user_id,
                participant.status,
                new Date(participant.registered_at).toLocaleDateString(),
              ]),
              theme: "grid",
              headStyles: { fillColor: [34, 139, 34] },
              margin: { left: 14, right: 14 },
              styles: { fontSize: 8 },
            });
            yPos = doc.lastAutoTable.finalY + 10;
          }

          // User Profiles Table
          if (result.data.userProfiles && result.data.userProfiles.length > 0) {
            doc.addPage();
            yPos = 20;

            doc.setFontSize(14);
            doc.text("User Profiles", 14, yPos);
            yPos += 6;

            doc.autoTable({
              startY: yPos,
              head: [["User ID", "Bio", "Phone", "Faculty", "Year"]],
              body: result.data.userProfiles.map((profile) => [
                profile.user_id,
                (profile.bio || "N/A").substring(0, 30) + "...",
                profile.phone || "N/A",
                profile.faculty || "N/A",
                profile.year_of_study || "N/A",
              ]),
              theme: "grid",
              headStyles: { fillColor: [34, 139, 34] },
              margin: { left: 14, right: 14 },
              styles: { fontSize: 8 },
            });
          }

          // Add footer to all pages
          const pageCount = doc.internal.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `Page ${i} of ${pageCount}`,
              doc.internal.pageSize.getWidth() / 2,
              doc.internal.pageSize.getHeight() - 10,
              { align: "center" },
            );
            doc.text(
              "Campus Eco-Club - Complete Data Export",
              14,
              doc.internal.pageSize.getHeight() - 10,
            );
          }

          // Save PDF
          doc.save(
            `eco-tracker-export-${new Date().toISOString().split("T")[0]}.pdf`,
          );

          alert(
            `✅ Data exported successfully as PDF!\nTotal Users: ${result.stats.totalUsers}\nTotal Logs: ${result.stats.totalLogs}`,
          );
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`${actionName} error:`, error);
      alert(`❌ Failed to ${actionName}: ${error.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [action]: false }));
    }
  };

  const formatLastBackup = (backupTime) => {
    if (!backupTime || backupTime === "Never") return "Never";

    const diff = Date.now() - new Date(backupTime).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading system data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">
          System Maintenance & Settings
        </h3>
        <button
          onClick={fetchSystemData}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="space-y-6">
        {/* System Health */}
        <div className="border-b pb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-600" />
            System Health
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className={`p-4 rounded-lg ${
                health?.serverStatus === "Online" ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="flex items-center mb-2">
                <Server
                  className={`w-5 h-5 mr-2 ${
                    health?.serverStatus === "Online"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                />
                <p className="text-sm text-gray-600">Server Status</p>
              </div>
              <p
                className={`text-xl font-bold ${
                  health?.serverStatus === "Online"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {health?.serverStatus || "Unknown"}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                health?.databaseStatus === "Healthy"
                  ? "bg-green-50"
                  : "bg-red-50"
              }`}
            >
              <div className="flex items-center mb-2">
                <Database
                  className={`w-5 h-5 mr-2 ${
                    health?.databaseStatus === "Healthy"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                />
                <p className="text-sm text-gray-600">Database</p>
              </div>
              <p
                className={`text-xl font-bold ${
                  health?.databaseStatus === "Healthy"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {health?.databaseStatus || "Unknown"}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                <p className="text-sm text-gray-600">Last Backup</p>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {formatLastBackup(health?.lastBackup)}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <HardDrive className="w-5 h-5 mr-2 text-purple-600" />
                <p className="text-sm text-gray-600">Disk Usage</p>
              </div>
              <p className="text-xl font-bold text-purple-600">
                {health?.diskSpace || "N/A"}
              </p>
            </div>
          </div>

          {/* System Stats */}
          {health?.stats && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">
                  {health.stats.totalUsers}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-800">
                  {health.stats.totalLogs}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-800">
                  {health.stats.totalEvents}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Total Waste</p>
                <p className="text-2xl font-bold text-gray-800">
                  {health.stats.totalWaste} kg
                </p>
              </div>
            </div>
          )}
        </div>

        {/* System Actions */}
        <div className="border-b pb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            System Actions
          </h4>
          <div className="space-y-3">
            <button
              onClick={() => handleAction("backup", "run system backup")}
              disabled={actionLoading.backup}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {actionLoading.backup ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5 mr-2" />
                  Run System Backup
                </>
              )}
            </button>

            <button
              onClick={() => handleAction("cache", "clear cache")}
              disabled={actionLoading.cache}
              className="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {actionLoading.cache ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Clearing Cache...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  Clear Cache
                </>
              )}
            </button>

            <button
              onClick={() => handleAction("export", "export all data")}
              disabled={actionLoading.export}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {actionLoading.export ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Exporting Data...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Export All Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* System Configuration */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-green-600" />
            System Configuration
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div>
                <p className="text-gray-800 font-medium">
                  Auto-approve Recycling Logs
                </p>
                <p className="text-sm text-gray-600">
                  {settings.auto_approve_logs?.description}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_approve_logs?.value || false}
                  onChange={() => handleSettingToggle("auto_approve_logs")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div>
                <p className="text-gray-800 font-medium">Maintenance Mode</p>
                <p className="text-sm text-gray-600">
                  {settings.maintenance_mode?.description}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode?.value || false}
                  onChange={() => handleSettingToggle('maintenance_mode')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemMaintenance;
