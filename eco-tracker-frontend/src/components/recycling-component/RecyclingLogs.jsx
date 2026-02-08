import React from "react";
import {
  Calendar,
  Award,
  User,
  Recycle,
  Package,
  Weight,
  FileText,
  CheckCircle,
  MapPin,
  Clock
} from "lucide-react";

function RecyclingComponent({ recyclingLogs, loadingRecyclingLogs, headerColor = "bg-green-600" }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-2xl font-bold text-gray-800">My Recycling Logs</h3>
      </div>
      {loadingRecyclingLogs ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading logs...</p>
        </div>
      ) : recyclingLogs.length === 0 ? (
        <div className="p-12 text-center">
          <Recycle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No recycling logs yet. Submit your first log above!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className={`${headerColor} text-white`}>
              <tr>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-right">Weight (kg)</th>
                <th className="px-6 py-4 text-left">Description</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Event Name</th>
                <th className="px-6 py-4 text-left">Verified By</th>
                <th className="px-6 py-4 text-right">Points Earned</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {recyclingLogs.map((log, index) => (
                <tr
                  key={log.id}
                  className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(log.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <div className="flex flex-col">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 capitalize">
                          {log.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Weight */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Weight className="w-4 h-4 text-gray-400" />
                      <span className="text-lg font-bold text-gray-900">
                        {log.weight}
                      </span>
                      <span className="text-sm text-gray-500">kg</span>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-2 max-w-xs">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 line-clamp-2 group-hover:text-gray-900 transition-colors">
                        {log.description || (
                          <span className="italic text-gray-400">
                            No description
                          </span>
                        )}
                      </p>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {log.verified ? (
                        <div className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-4 py-2 rounded-full shadow-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-semibold">
                            Approved
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 px-4 py-2 rounded-full shadow-sm">
                          <Clock className="w-4 h-4 animate-pulse" />
                          <span className="text-sm font-semibold">Pending</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Event */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {log.event_title || (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-700">
                            Eco Club
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Verified By */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {log.verified_by_name || (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Eco Points */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <div className="text-right">
                        <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {log.eco_points_earned || 0}
                        </p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecyclingComponent;
