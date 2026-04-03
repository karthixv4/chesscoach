import { useState } from "react";
import { useDispatch } from "react-redux";
import { X, Key, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { changePassword } from "../../store/authSlice";

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState("");
  
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setStatus("error");
      setErrorMessage("New passwords do not match.");
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setStatus("error");
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const resultAction = await dispatch(
        changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        })
      );

      if (changePassword.fulfilled.match(resultAction)) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(resultAction.payload || "Failed to change password. Please check your current password.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("An unexpected error occurred.");
    }
  };

  const handleClose = () => {
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setStatus("idle");
    setErrorMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl max-w-md w-full border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold">Change Password</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {status === "success" ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Password Updated</h3>
              <p className="text-slate-300 mb-6">
                Your password has been changed successfully.
              </p>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === "error" && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, currentPassword: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-10"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-10"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === "loading" || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
