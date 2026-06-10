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

export const setMonthlyTarget = createAsyncThunk('classrooms/setMonthlyTarget', async ({ classroomId, targetData }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/classrooms/${classroomId}/targets`, targetData);
    return { classroomId, target: res.data.monthlyTarget };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to set target');
  }
});

export const deleteMonthlyTarget = createAsyncThunk('classrooms/deleteMonthlyTarget', async ({ classroomId, month, year }, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/classrooms/${classroomId}/targets`, { params: { month, year } });
    return { classroomId, month: res.data.month, year: res.data.year };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to delete target');
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


export const updateSession = createAsyncThunk('sessions/update', async ({ classroomId, sessionId, sessionData }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/classrooms/${classroomId}/sessions/${sessionId}`, sessionData);
    return { classroomId, session: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to update session');
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

export const fetchStudentSessions = createAsyncThunk('sessions/fetchByStudent', async ({ studentId, startDate, endDate }, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/sessions/student/${studentId}${queryString}`);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch student sessions');
  }
});

export const fetchTrainerSessions = createAsyncThunk('sessions/fetchByTrainer', async ({ startDate, endDate } = {}, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/sessions/trainer${queryString}`);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch trainer sessions');
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
    const res = await api.patch(`/classrooms/${classroomId}/homework/${homeworkId}`, homeworkData);
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

export const requestRework = createAsyncThunk('homework/rework', async ({ classroomId, homeworkId, feedback }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/classrooms/${classroomId}/homework/${homeworkId}/rework`, { feedback });
    return { classroomId, homework: res.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to request rework for homework');
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
  trainerSessions: [],
  activeClassroom: null,
  status: 'idle',
  detailsStatus: 'idle', // tracks fetchClassroomDetails loading
  trainerSessionsStatus: 'idle',
  studentSessionsStatus: 'idle',
  error: null,
};

const updateActiveIfMatch = (state, classroomId, updateFn) => {
  let updatedActive = false;
  const c1 = state.classrooms.find(c => c.id === classroomId);
  if (c1) {
    updateFn(c1);
    // If activeClassroom is the exact same object reference, it was updated.
    if (state.activeClassroom === c1) {
      updatedActive = true;
    }
  }
  if (!updatedActive && state.activeClassroom?.id === classroomId) {
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
    builder.addCase(fetchClassroomDetails.pending, (state) => { state.detailsStatus = 'loading'; })
      .addCase(fetchClassroomDetails.fulfilled, (state, action) => {
        state.detailsStatus = 'idle';
        const idx = state.classrooms.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) {
          state.classrooms[idx] = action.payload;
        } else {
          state.classrooms.push(action.payload);
        }
        if (state.activeClassroom?.id === action.payload.id) {
          state.activeClassroom = action.payload;
        }
      })
      .addCase(fetchClassroomDetails.rejected, (state, action) => {
        state.detailsStatus = 'idle';
        state.error = action.payload;
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

    // Targets
    builder.addCase(setMonthlyTarget.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        if (!c.monthlyTargets) c.monthlyTargets = [];
        const idx = c.monthlyTargets.findIndex(t => t.month === action.payload.target.month && t.year === action.payload.target.year);
        if (idx !== -1) {
          c.monthlyTargets[idx] = action.payload.target;
        } else {
          c.monthlyTargets.push(action.payload.target);
          c.monthlyTargets.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          });
        }
      });
    });

    builder.addCase(deleteMonthlyTarget.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        if (c.monthlyTargets) {
          c.monthlyTargets = c.monthlyTargets.filter(t => !(t.month === action.payload.month && t.year === action.payload.year));
        }
      });
    });

    // Sessions

    builder.addCase(createSession.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        if (!c.sessions) c.sessions = [];
        c.sessions.unshift(action.payload.session);
      });
    });
    builder.addCase(updateSession.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        const idx = c.sessions.findIndex(s => s.id === action.payload.session.id);
        if (idx !== -1) c.sessions[idx] = action.payload.session;
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
    builder.addCase(fetchStudentSessions.pending, (state) => {
      state.studentSessionsStatus = 'loading';
    });
    builder.addCase(fetchStudentSessions.fulfilled, (state, action) => {
      state.studentSessionsStatus = 'idle';
      state.studentSessions = action.payload;
    });
    builder.addCase(fetchStudentSessions.rejected, (state) => {
      state.studentSessionsStatus = 'idle';
    });

    builder.addCase(fetchTrainerSessions.pending, (state) => {
      state.trainerSessionsStatus = 'loading';
    });
    builder.addCase(fetchTrainerSessions.fulfilled, (state, action) => {
      state.trainerSessionsStatus = 'idle';
      state.trainerSessions = action.payload;
    });
    builder.addCase(fetchTrainerSessions.rejected, (state) => {
      state.trainerSessionsStatus = 'idle';
    });


    // Homework
    builder.addCase(createHomework.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        if (!c.homework) c.homework = [];
        c.homework.unshift(action.payload.homework);
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
      const { classroomId, homework } = action.payload;
      updateActiveIfMatch(state, classroomId, (active) => {
        const idx = active.homework.findIndex(h => h.id === homework.id);
        if (idx !== -1) active.homework[idx] = homework;
      });
    });

    // Rework Homework
    builder.addCase(requestRework.fulfilled, (state, action) => {
      const { classroomId, homework } = action.payload;
      updateActiveIfMatch(state, classroomId, (active) => {
        const idx = active.homework.findIndex(h => h.id === homework.id);
        if (idx !== -1) active.homework[idx] = homework;
      });
    });

    // Materials
    builder.addCase(createMaterial.fulfilled, (state, action) => {
      updateActiveIfMatch(state, action.payload.classroomId, (c) => {
        if (!c.materials) c.materials = [];
        c.materials.unshift(action.payload.material);
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
