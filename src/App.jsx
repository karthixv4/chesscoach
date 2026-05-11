import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store/store";
import { fetchMe } from "./store/authSlice";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import TrainerHome from "./pages/TrainerHome";
import StudentHome from "./pages/StudentHome";
import Classroom from "./pages/Classroom";

function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated, status, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      dispatch(fetchMe());
    }
  }, [dispatch]);



  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-slate-500 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const getHomeRoute = () => {
    if (!user) return "/";
    return user.role === "trainer" ? "/trainer" : "/student";
  };

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <Login />}
        />
        <Route
          path="/trainer"
          element={isAuthenticated && user?.role === "trainer" ? <TrainerHome /> : <Navigate to="/" replace />}
        />
        <Route
          path="/student"
          element={isAuthenticated && user?.role === "student" ? <StudentHome /> : <Navigate to="/" replace />}
        />
        <Route
          path="/classroom/:id"
          element={isAuthenticated ? <Classroom /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
