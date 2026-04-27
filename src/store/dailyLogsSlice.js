import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

// ─── Thunks ────────────────────────────────────────────────────────────────────

export const fetchDailyLogs = createAsyncThunk(
  'dailyLogs/fetchAll',
  async ({ classroomId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/classrooms/${classroomId}/daily-logs`, { params });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch logs');
    }
  }
);

export const submitDailyLog = createAsyncThunk(
  'dailyLogs/submit',
  async ({ classroomId, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/classrooms/${classroomId}/daily-logs`, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to submit log');
    }
  }
);

export const updateDailyLog = createAsyncThunk(
  'dailyLogs/update',
  async ({ classroomId, logId, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/classrooms/${classroomId}/daily-logs/${logId}`, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update log');
    }
  }
);

export const deleteDailyLog = createAsyncThunk(
  'dailyLogs/delete',
  async ({ classroomId, logId }, { rejectWithValue }) => {
    try {
      await api.delete(`/classrooms/${classroomId}/daily-logs/${logId}`);
      return logId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete log');
    }
  }
);

export const fetchAnalyticsSummary = createAsyncThunk(
  'dailyLogs/fetchSummary',
  async (classroomId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/classrooms/${classroomId}/analytics/summary`);
      return { classroomId, data: res.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch analytics');
    }
  }
);

export const fetchInactiveStudents = createAsyncThunk(
  'dailyLogs/fetchInactive',
  async (inactiveDays = 3, { rejectWithValue }) => {
    try {
      const res = await api.get('/analytics/inactive-students', {
        params: { inactiveDays }
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch inactive students');
    }
  }
);

export const pushWorksheet = createAsyncThunk(
  'dailyLogs/pushWorksheet',
  async ({ classroomId, worksheetId }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/classrooms/${classroomId}/push-worksheet`, { worksheetId });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to push worksheet');
    }
  }
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getTodayStr = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
};

const findTodayLog = (logs) => {
  const today = getTodayStr();
  return logs.find((l) => l.date?.split('T')[0] === today) || null;
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const initialState = {
  logs: [],
  todayLog: null,
  summaries: {},          // keyed by classroomId
  inactiveStudents: null,
  logStatus: 'idle',      // 'loading' | 'idle' | 'success' | 'error'
  submitStatus: 'idle',
  analyticsStatus: 'idle',
  inactiveStatus: 'idle',
  error: null,
};

const dailyLogsSlice = createSlice({
  name: 'dailyLogs',
  initialState,
  reducers: {
    clearLogs: (state) => {
      state.logs = [];
      state.todayLog = null;
    },
    clearSubmitStatus: (state) => {
      state.submitStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {

    // Fetch Logs
    builder
      .addCase(fetchDailyLogs.pending, (state) => { state.logStatus = 'loading'; })
      .addCase(fetchDailyLogs.fulfilled, (state, action) => {
        state.logStatus = 'idle';
        state.logs = action.payload;
        state.todayLog = findTodayLog(action.payload);
      })
      .addCase(fetchDailyLogs.rejected, (state, action) => {
        state.logStatus = 'error';
        state.error = action.payload;
      });

    // Submit Log
    builder
      .addCase(submitDailyLog.pending, (state) => { state.submitStatus = 'loading'; })
      .addCase(submitDailyLog.fulfilled, (state, action) => {
        state.submitStatus = 'success';
        // Prepend so the list stays newest-first
        state.logs.unshift(action.payload);
        state.todayLog = action.payload;
      })
      .addCase(submitDailyLog.rejected, (state, action) => {
        state.submitStatus = 'error';
        state.error = action.payload;
      });

    // Update Log
    builder
      .addCase(updateDailyLog.pending, (state) => { state.submitStatus = 'loading'; })
      .addCase(updateDailyLog.fulfilled, (state, action) => {
        state.submitStatus = 'success';
        const idx = state.logs.findIndex((l) => l.id === action.payload.id);
        if (idx !== -1) state.logs[idx] = action.payload;
        if (state.todayLog?.id === action.payload.id) state.todayLog = action.payload;
      })
      .addCase(updateDailyLog.rejected, (state, action) => {
        state.submitStatus = 'error';
        state.error = action.payload;
      });

    // Delete Log
    builder
      .addCase(deleteDailyLog.fulfilled, (state, action) => {
        state.logs = state.logs.filter((l) => l.id !== action.payload);
        if (state.todayLog?.id === action.payload) state.todayLog = null;
      });

    // Analytics Summary
    builder
      .addCase(fetchAnalyticsSummary.pending, (state) => { state.analyticsStatus = 'loading'; })
      .addCase(fetchAnalyticsSummary.fulfilled, (state, action) => {
        state.analyticsStatus = 'idle';
        state.summaries[action.payload.classroomId] = action.payload.data;
      })
      .addCase(fetchAnalyticsSummary.rejected, (state, action) => {
        state.analyticsStatus = 'error';
        state.error = action.payload;
      });

    // Inactive Students
    builder
      .addCase(fetchInactiveStudents.pending, (state) => { state.inactiveStatus = 'loading'; })
      .addCase(fetchInactiveStudents.fulfilled, (state, action) => {
        state.inactiveStatus = 'idle';
        state.inactiveStudents = action.payload;
      })
      .addCase(fetchInactiveStudents.rejected, (state, action) => {
        state.inactiveStatus = 'error';
        state.error = action.payload;
      });
  },
});

export const { clearLogs, clearSubmitStatus } = dailyLogsSlice.actions;
export default dailyLogsSlice.reducer;
