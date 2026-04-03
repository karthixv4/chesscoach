import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { logout } from "../../store/authSlice";
import { LogOut, User, BookOpen, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChangePasswordModal from "../modals/ChangePasswordModal";

export default function Layout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <BookOpen className="w-6 h-6 text-emerald-400" />
              <span className="font-semibold text-lg tracking-tight">
                ChessCoach
              </span>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-4 pl-4">
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-0 sm:gap-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 hidden sm:block" />
                      <span className="font-medium text-slate-200 truncate max-w-[120px] sm:max-w-none">{user.name}</span>
                    </div>
                    <span className="text-xs sm:text-sm text-emerald-400 capitalize">({user.role})</span>
                  </div>
                  <button
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors shrink-0"
                    title="Change Password"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors shrink-0"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
      
      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen} 
        onClose={() => setIsChangePasswordModalOpen(false)} 
      />
    </div>
  );
}
