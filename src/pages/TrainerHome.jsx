import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { setActiveClassroom, fetchClassrooms } from "../store/classroomsSlice";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ChevronRight,
  Activity,
  BookOpen,
  CheckCircle,
  Trash2,
  Edit2,
} from "lucide-react";
import AddStudentModal from "../components/modals/AddStudentModal";
import ConfirmationModal from "../components/modals/ConfirmationModal";

export default function TrainerHome() {
  const { classrooms, status, error } = useSelector((state) => state.classrooms);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    dispatch(fetchClassrooms());
  }, [dispatch]);

  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleSelectStudent = (classroomId) => {
    dispatch(setActiveClassroom(classroomId));
    navigate(`/classroom/${classroomId}`);
  };

  if (status === "loading" && classrooms.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-slate-500 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Trainer Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your students and classrooms
          </p>
        </div>
        <button
          onClick={() => setIsAddStudentModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Add Student
        </button>
      </header>

      <AnimatePresence>
        {isAddStudentModalOpen && (
          <AddStudentModal
            trainerId={user?.id || "t1"}
            student={editingStudent || undefined}
            onClose={() => {
              setIsAddStudentModalOpen(false);
              setEditingStudent(null);
            }}
          />
        )}

        <ConfirmationModal
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={() => {
            confirmation.onConfirm();
            setConfirmation((prev) => ({ ...prev, isOpen: false }));
          }}
          onClose={() =>
            setConfirmation((prev) => ({ ...prev, isOpen: false }))
          }
        />
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">
                Active Students
              </p>
              <p className="text-2xl font-semibold">{classrooms.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">
                Pending Evaluations
              </p>
              <p className="text-2xl font-semibold">
                {classrooms.reduce(
                  (acc, c) =>
                    acc +
                    (c.homework || []).filter((h) => h.status?.toLowerCase() === "submitted").length,
                  0,
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">
                Total Lessons
              </p>
              <p className="text-2xl font-semibold">
                {classrooms.reduce((acc, c) => acc + (c.lessons || []).length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold">Your Students</h2>
        </div>
        <div className="divide-y divide-slate-700/50">
          {classrooms.map((classroom, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={classroom.id}
              onClick={() => handleSelectStudent(classroom.id)}
              className="p-4 sm:p-6 hover:bg-slate-700/30 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-semibold text-slate-300">
                  {classroom.studentName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-lg group-hover:text-emerald-400 transition-colors">
                    {classroom.studentName}
                  </h3>
                  <p className="text-sm text-slate-400 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    {(classroom.lessons || []).length} Lessons •{" "}
                    {(classroom.homework || []).length} Assignments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start mt-2 sm:mt-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingStudent({
                      id: classroom.id,
                      studentName: classroom.studentName,
                    });
                    setIsAddStudentModalOpen(true);
                  }}
                  className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
