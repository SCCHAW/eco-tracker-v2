import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Recycle,
} from "lucide-react";

function PastEventVolunteerHours({
  registeredEvents,
  loadingPastEventLogs,
  headerColor = "bg-green-600",
  totalVolunteerHours
}) {

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-2xl font-bold text-gray-800">
          Past Events & Hours{" "}
        </h3>
      </div>
      {loadingPastEventLogs ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading logs...</p>
        </div>
      ) : registeredEvents.length === 0 ? (
        <div className="p-12 text-center">
          <Recycle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No past event and volunteer logs yet. Submit your first log above!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${headerColor} text-white`}>
              <tr>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Event</th>
                <th className="px-6 py-4 text-left">Hours</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {registeredEvents.map((log, index) => (
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
                          {new Date(log.event_date).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.event_date).toLocaleTimeString(
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

                  {/* event title */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div className="flex flex-col">
                        {log.event_title || (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-700">
                            Eco Club
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* hours */}

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <div className="text-right">
                        <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {log.volunteer_hours || 0}
                        </p>
                        <p className="text-xs text-gray-500">hours</p>
                      </div>
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
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 bg-gray-50 border-t">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">
                Total Volunteer Hours:
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {totalVolunteerHours} hours
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PastEventVolunteerHours;
