import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

// --- Thunks ---
export const fetchClassrooms = createAsyncThunk('classrooms/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/classrooms');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch classrooms');
  }
});

export const fetchClassroomDetails = createAsyncThunk('classrooms/fetchDetails', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/classrooms/${id}`);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch classroom');
  }
});

export const createClassroom = createAsyncThunk('classrooms/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/classrooms', data);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to create classroom');
  }
});

export const deleteClassroom = createAsyncThunk('classrooms/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/classrooms/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to delete student');
  }
});

export const addNotes = createAsyncThunk('classrooms/addNotes', async ({ classroomId, notes }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/classrooms/${classroomId}/notes`, { notes });
    return { classroomId, notes: res.data.notes };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to add notes');
  }
});

// Sessions
export const createSession = createAsyncThunk('sessions/create', async ({ classroomId, sessionData }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/classrooms/${classroomId}/sessions`, sessionData);
    return { classroomId, session: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to create session');
  }
});


export const updateSessionStatus = createAsyncThunk('sessions/updateStatus', async ({ classroomId, sessionId, data }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/classrooms/${classroomId}/sessions/${sessionId}/status`, data);
    return { classroomId, session: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to update session');
  }
});

export const deleteSession = createAsyncThunk('sessions/delete', async ({ classroomId, sessionId }, { rejectWithValue }) => {
  try {
    await api.delete(`/classrooms/${classroomId}/sessions/${sessionId}`);
    return { classroomId, sessionId };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to delete session');
  }
});

export const fetchStudentSessions = createAsyncThunk('sessions/fetchByStudent', async (studentId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/sessions/student/${studentId}`);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch student sessions');
  }
});

// Lessons
export const createLesson = createAsyncThunk('lessons/create', async ({ classroomId, lessonData }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/classrooms/${classroomId}/lessons`, lessonData);
    return { classroomId, lesson: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to create lesson');
  }
});

export const updateLesson = createAsyncThunk('lessons/update', async ({ classroomId, lessonId, lessonData }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/classrooms/${classroomId}/lessons/${lessonId}`, lessonData);
    return { classroomId, lesson: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to update lesson');
  }
});

export const deleteLesson = createAsyncThunk('lessons/delete', async ({ classroomId, lessonId }, { rejectWithValue }) => {
  try {
    await api.delete(`/classrooms/${classroomId}/lessons/${lessonId}`);
    return { classroomId, lessonId };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to delete lesson');
  }
});

export const markLessonRead = createAsyncThunk('lessons/markRead', async ({ classroomId, lessonId }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/classrooms/${classroomId}/lessons/${lessonId}/read`);
    return { classroomId, lesson: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to mark lesson read');
  }
});

// Homework
export const createHomework = createAsyncThunk('homework/create', async ({ classroomId, homeworkData }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/classrooms/${classroomId}/homework`, homeworkData);
    return { classroomId, homework: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to create homework');
  }
});

export const updateHomework = createAsyncThunk('homework/update', async ({ classroomId, homeworkId, homeworkData }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/classrooms/${classroomId}/homework/${homeworkId}`, homeworkData);
    return { classroomId, homework: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to update homework');
  }
});

export const deleteHomework = createAsyncThunk('homework/delete', async ({ classroomId, homeworkId }, { rejectWithValue }) => {
  try {
    await api.delete(`/classrooms/${classroomId}/homework/${homeworkId}`);
    return { classroomId, homeworkId };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to delete homework');
  }
});

export const submitHomework = createAsyncThunk('homework/submit', async ({ classroomId, homeworkId, submissionData }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/classrooms/${classroomId}/homework/${homeworkId}/submit`, submissionData);
    return { classroomId, homework: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to submit homework');
  }
});

export const evaluateHomework = createAsyncThunk('homework/evaluate', async ({ classroomId, homeworkId, evaluationData }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/classrooms/${classroomId}/homework/${homeworkId}/evaluate`, evaluationData);
    return { classroomId, homework: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to evaluate homework');
  }
});

// Materials
export const createMaterial = createAsyncThunk('materials/create', async ({ classroomId, materialData }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/classrooms/${classroomId}/materials`, materialData);
    return { classroomId, material: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to create material');
  }
});

export const updateMaterial = createAsyncThunk('materials/update', async ({ classroomId, materialId, materialData }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/classrooms/${classroomId}/materials/${materialId}`, materialData);
    return { classroomId, material: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to update material');
  }
});

export const deleteMaterial = createAsyncThunk('materials/delete', async ({ classroomId, materialId }, { rejectWithValue }) => {
  try {
    await api.delete(`/classrooms/${classroomId}/materials/${materialId}`);
    return { classroomId, materialId };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to delete material');
  }
});

// Notifications
export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/notifications');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch notifications');
  }
});

export const createNotification = createAsyncThunk('notifications/create', async ({ classroomId, data }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/classrooms/${classroomId}/notifications`, data);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to create notification');
  }
});

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (notificationId, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/notifications/${notificationId}/read`);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to mark notification read');
  }
});

// --- Slice ---
const initialState = {
  classrooms: [],
  notifications: [],
  studentSessions: [],
  activeClassroom: null,
  status: 'idle',
  error: null,
};

const updateActiveIfMatch = (state, classroomId, updateFn) => {
  const c1 = state.classrooms.find(c => c.id === classroomId);
  if (c1) updateFn(c1);
  if (state.activeClassroom?.id === classroomId) {
    updateFn(state.activeClassroom);
  }
};

const classroomsSlice = createSlice({
  name: 'classrooms',
  initialState,
  reducers: {
    setActiveClassroom: (state, action) => {
      state.activeClassroom = state.classrooms.find(c => c.id === action.payload) || null;
    },
    clearClassrooms: (state) => {
      state.classrooms = [];
      state.activeClassroom = null;
      state.notifications = [];
    }
  },
  extraReducers: (builder) => {
    // Fetch Classrooms
    builder.addCase(fetchClassrooms.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchClassrooms.fulfilled, (state, action) => {
        state.status = 'idle';
        state.classrooms = action.payload;
        if (state.activeClassroom) {
          state.activeClassroom = state.classrooms.find(c => c.id === state.activeClassroom.id) || null;
        }
      })
      .addCase(fetchClassrooms.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload;
      });

    // Fetch Details
    builder.addCase(fetchClassroomDetails.fulfilled, (state, action) => {
      const idx = state.classrooms.findIndex(c => c.id === action.payload.id);
      if (idx !== -1) {
        state.classrooms[idx] = action.payload;
      } else {
        state.classrooms.push(action.payload);
      }
      if (state.activeClassroom?.id === action.payload.id) {
        state.activeClassroom = action.payload;
      }
    });

    // Create Classroom
    builder.addCase(createClassroom.fulfilled, (state, action) => {
      state.classrooms.push(action.payload);
    });

    // Delete Classroom
    builder.addCase(deleteClassroom.fulfilled, (state, action) => {
      state.classrooms = state.classrooms.filter(c => c.id !== action.payload);
      if (state.activeClassroom?.id === action.payload) {
        state.activeClassroom = null;
      }
    });

    // Notes
    builder.addCase(addNotes.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        c.notes = action.payload.notes;
      });
    });

    // Sessions
    builder.addCase(createSession.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        c.sessions.push(action.payload.session);
      });
    });
    builder.addCase(updateSessionStatus.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        const idx = c.sessions.findIndex(s => s.id === action.payload.session.id);
        if (idx !== -1) c.sessions[idx] = action.payload.session;
      });
    });

    builder.addCase(deleteSession.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        c.sessions = c.sessions.filter(s => s.id !== action.payload.sessionId);
      });
    });
    builder.addCase(fetchStudentSessions.fulfilled, (state, action) => {
      state.studentSessions = action.payload;
    });

    // Lessons
    builder.addCase(createLesson.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        c.lessons.push(action.payload.lesson);
      });
    });
    builder.addCase(updateLesson.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        const idx = c.lessons.findIndex(l => l.id === action.payload.lesson.id);
        if (idx !== -1) c.lessons[idx] = action.payload.lesson;
      });
    });
    builder.addCase(deleteLesson.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        c.lessons = c.lessons.filter(l => l.id !== action.payload.lessonId);
      });
    });
    builder.addCase(markLessonRead.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        const idx = c.lessons.findIndex(l => l.id === action.payload.lesson.id);
        if (idx !== -1) c.lessons[idx] = action.payload.lesson;
      });
    });

    // Homework
    builder.addCase(createHomework.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        c.homework.push(action.payload.homework);
      });
    });
    builder.addCase(updateHomework.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        const idx = c.homework.findIndex(h => h.id === action.payload.homework.id);
        if (idx !== -1) c.homework[idx] = action.payload.homework;
      });
    });
    builder.addCase(deleteHomework.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        c.homework = c.homework.filter(h => h.id !== action.payload.homeworkId);
      });
    });
    builder.addCase(submitHomework.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        const idx = c.homework.findIndex(h => h.id === action.payload.homework.id);
        if (idx !== -1) c.homework[idx] = action.payload.homework;
      });
    });
    builder.addCase(evaluateHomework.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        const idx = c.homework.findIndex(h => h.id === action.payload.homework.id);
        if (idx !== -1) c.homework[idx] = action.payload.homework;
      });
    });

    // Materials
    builder.addCase(createMaterial.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        c.materials.push(action.payload.material);
      });
    });
    builder.addCase(updateMaterial.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        const idx = c.materials.findIndex(m => m.id === action.payload.material.id);
        if (idx !== -1) c.materials[idx] = action.payload.material;
      });
    });
    builder.addCase(deleteMaterial.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        c.materials = c.materials.filter(m => m.id !== action.payload.materialId);
      });
    });

    // Notifications
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.notifications = action.payload;
    });
    builder.addCase(createNotification.fulfilled, (state, action) => {
      state.notifications.unshift(action.payload);
    });
    builder.addCase(markNotificationRead.fulfilled, (state, action) => {
      const idx = state.notifications.findIndex(n => n.id === action.payload.id);
      if (idx !== -1) state.notifications[idx] = action.payload;
    });
  }
});

export const { setActiveClassroom, clearClassrooms } = classroomsSlice.actions;

export default classroomsSlice.reducer;
