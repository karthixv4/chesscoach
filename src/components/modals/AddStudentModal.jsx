import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Mail, User, Key, Eye, EyeOff } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createClassroom } from "../../store/classroomsSlice";
import api from "../../lib/api";

export default function AddStudentModal({ onClose, trainerId, student }) {
  const dispatch = useDispatch();
  const { status } = useSelector((state) => state.classrooms);
  const [name, setName] = useState(student?.studentName || "");
  const [email, setEmail] = useState(""); // Email is not stored in classroom state currently, but we'll keep the field
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!student) {
      setIsSubmitting(true);
      setErrorMsg("");
      try {
        await api.post("/auth/register", {
          name: name,
          email: email,
          password: password,
          role: "student",
        });

        await dispatch(
          createClassroom({
            studentEmail: email,
          }),
        ).unwrap();

        setName("");
        setEmail("");
        setPassword("");
        onClose();
      } catch (err) {
        setErrorMsg(
          err.response?.data?.error || 
          err.response?.data?.message || 
          err.message || 
          "Failed to create student"
        );
      } finally {
        setIsSubmitting(false);
      }
    }
    // Note: Add update classroom dispatch here if/when backend supports it
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                {student ? "Edit Student" : "Add New Student"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Student Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="student@example.com"
                />
              </div>
            </div>

            {!student && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Initial Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-10 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Enter initial password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || status === "loading"}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting || status === "loading" ? "Saving..." : (student ? "Save Changes" : "Add Student")}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
