import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const resultAction = await dispatch(loginUser({ email, password }));
    
    if (loginUser.fulfilled.match(resultAction)) {
      const user = resultAction.payload.user;
      if (user.role === "trainer") {
        navigate("/trainer");
      } else {
        navigate("/student");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-emerald-500/10 rounded-full">
            <BookOpen className="w-12 h-12 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-center mb-2 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-slate-400 text-center mb-8 text-sm">
          Sign in to your coaching dashboard
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-slate-200 outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-slate-200 outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 px-4 rounded-xl font-medium transition-colors bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {status === "loading" ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
