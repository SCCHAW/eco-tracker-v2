import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminAPI, userAPI } from "../services/api";

function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, user: null });

  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_users: 0,
    limit: 10,
    has_next: false,
    has_prev: false,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers(
        pagination.current_page,
        pagination.limit
      );

      console.log("response---allusers--", response);
      setUsers(response.users || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.log("errors fetching users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.current_page, pagination.limit]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination((prev) => ({ ...prev, current_page: newPage }));
    }
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setPagination((prev) => ({ ...prev, limit: newLimit, current_page: 1 }));
  };

  const openDeleteModal = (user) => {
    setDeleteModal({ show: true, user });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, user: null });
  };

  const confirmDeleteUser = async () => {
    if (!deleteModal.user) return;

    try {
      setDeletingUser(deleteModal.user.id);
      
      const result = await adminAPI.deleteUser(deleteModal.user.id);
      console.log('deleteModal.user.id==>', deleteModal.user.id)
      
      // Show detailed summary
      let message = `✅ User "${deleteModal.user.name}" has been successfully deleted.\n\n`;
      
      if (result.summary?.deletedData) {
        message += 'Deleted data:\n';
        if (result.summary.deletedData.events) {
          message += `• ${result.summary.deletedData.events} events\n`;
        }
        message += `• ${result.summary.deletedData.recyclingLogs} recycling logs\n`;
        message += `• Profile and account data\n`;
        
        if (result.summary.note) {
          message += `\n⚠️ Note: ${result.summary.note}`;
        }
      }
      
      alert(message);
      
      closeDeleteModal();
      await fetchUsers(); // Refresh user list 
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`❌ Error deleting user: ${error.message}`);
    } finally {
      setDeletingUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}

        {/* Users Table Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Manage User Accounts
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  View and manage all system users
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Items per page selector */}
                <div className="flex items-center">
                  <label className="text-sm text-gray-600 mr-2">Show:</label>
                  <select
                    value={pagination.limit}
                    onChange={handleLimitChange}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <button
                  onClick={() =>
                    navigate("/admin-edit-user", {
                      state: { tag: "create-user" },
                    })
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  + Add New User
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No users found.</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Points
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Logs
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Events
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                              user.role === "admin"
                                ? "bg-red-100 text-red-700"
                                : user.role === "organizer"
                                ? "bg-blue-100 text-blue-700"
                                : user.role === "volunteer"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          {user.eco_points || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.approved_logs || 0}/{user.total_logs || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.events_attended || 0}/{user.events_registered || 0}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.eco_points > 0 || user.approved_logs > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.eco_points > 0 || user.approved_logs > 0
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              navigate("/admin-edit-user", {
                                state: { user: user, tag: "edit-user" },
                              })
                            }
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition mr-2"
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => openDeleteModal(user)}
                            disabled={deletingUser === user.id}
                          >
                            {deletingUser === user.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.current_page - 1) * pagination.limit + 1}{" "}
                  to{" "}
                  {Math.min(
                    pagination.current_page * pagination.limit,
                    pagination.total_users
                  )}{" "}
                  of {pagination.total_users} users
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      handlePageChange(pagination.current_page - 1)
                    }
                    disabled={!pagination.has_prev}
                    className={`p-2 rounded ${
                      pagination.has_prev
                        ? "text-gray-600 hover:bg-gray-100"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {[...Array(pagination.total_pages)].map((_, idx) => {
                      const pageNum = idx + 1;
                      // Show only some pages if too many
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.total_pages ||
                        (pageNum >= pagination.current_page - 1 &&
                          pageNum <= pagination.current_page + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded ${
                              pagination.current_page === pageNum
                                ? "bg-green-600 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === pagination.current_page - 2 ||
                        pageNum === pagination.current_page + 2
                      ) {
                        return (
                          <span key={pageNum} className="px-2">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() =>
                      handlePageChange(pagination.current_page + 1)
                    }
                    disabled={!pagination.has_next}
                    className={`p-2 rounded ${
                      pagination.has_next
                        ? "text-gray-600 hover:bg-gray-100"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              ⚠️ Delete User Account
            </h3>
            
            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                Are you sure you want to delete this user account?
              </p>
              
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold text-gray-700">Name:</span>{' '}
                  {deleteModal.user?.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-gray-700">Email:</span>{' '}
                  {deleteModal.user?.email}
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-gray-700">Role:</span>{' '}
                  <span className="capitalize bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">
                    {deleteModal.user?.role}
                  </span>
                </p>
              </div>
              
              {/* Role-specific warnings */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-semibold mb-2">
                  This will permanently delete:
                </p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>User account and profile</li>
                  <li>All recycling logs submitted by this user</li>
                  <li>Event registrations</li>
                  <li>Notifications and achievements</li>
                  
                  {deleteModal.user?.role === 'organizer' && (
                    <>
                      <li className="font-bold text-red-800">All events organized by this user</li>
                      <li className="font-bold text-red-800">Event announcements for their events</li>
                      <li className="font-bold text-red-800">Participant registrations for their events</li>
                      <li className="text-green-700">✓ Recycling logs from events will be preserved (unlinked)</li>
                    </>
                  )}
                  
                  {deleteModal.user?.role === 'volunteer' && (
                    <>
                      <li>All volunteer hours logged</li>
                      <li>Recycling submissions with volunteer hours</li>
                    </>
                  )}
                  
                  {deleteModal.user?.role === 'admin' && (
                    <li className="font-bold text-red-800">Admin privileges and permissions</li>
                  )}
                </ul>
                
                <p className="text-sm text-red-800 font-semibold mt-3">
                  ⚠️ This action cannot be undone!
                </p>
              </div>

              {deleteModal.user?.role === 'organizer' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Note:</span> Students' recycling logs from this organizer's events 
                    will be kept for record-keeping, but will be unlinked from the deleted events.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                disabled={deletingUser}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deletingUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deletingUser ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;