import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

// ── Thunks ───────────────────────────────────────────────────────────────────

export const generateReport = createAsyncThunk(
  'reports/generate',
  async ({ classroomId, month, year }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/classrooms/${classroomId}/reports/generate`, { month, year });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to generate report');
    }
  }
);

export const fetchReports = createAsyncThunk(
  'reports/fetchAll',
  async (classroomId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/classrooms/${classroomId}/reports`);
      return { classroomId, reports: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch reports');
    }
  }
);

export const saveDraft = createAsyncThunk(
  'reports/saveDraft',
  async ({ classroomId, reportId, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/classrooms/${classroomId}/reports/${reportId}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to save draft');
    }
  }
);

export const publishReport = createAsyncThunk(
  'reports/publish',
  async ({ classroomId, reportId }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/classrooms/${classroomId}/reports/${reportId}/publish`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to publish report');
    }
  }
);

export const acknowledgeReport = createAsyncThunk(
  'reports/acknowledge',
  async ({ classroomId, reportId }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/classrooms/${classroomId}/reports/${reportId}/acknowledge`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to acknowledge report');
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const upsertReport = (state, report) => {
  const idx = state.reports.findIndex(r => r.id === report.id);
  if (idx !== -1) {
    state.reports[idx] = report;
  } else {
    state.reports.unshift(report);
  }
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState: {
    reports: [],
    status: 'idle',
    saveStatus: 'idle', // separate status for autosave indicator
    error: null,
  },
  reducers: {
    clearReports: (state) => {
      state.reports = [];
    },
  },
  extraReducers: (builder) => {
    // Generate
    builder
      .addCase(generateReport.pending, (state) => { state.status = 'loading'; })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.status = 'idle';
        upsertReport(state, action.payload);
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload;
      });

    // Fetch all
    builder
      .addCase(fetchReports.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.status = 'idle';
        state.reports = action.payload.reports;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload;
      });

    // Save draft (autosave — uses saveStatus not status)
    builder
      .addCase(saveDraft.pending, (state) => { state.saveStatus = 'saving'; })
      .addCase(saveDraft.fulfilled, (state, action) => {
        state.saveStatus = 'saved';
        upsertReport(state, action.payload);
      })
      .addCase(saveDraft.rejected, (state, action) => {
        state.saveStatus = 'error';
        state.error = action.payload;
      });

    // Publish
    builder
      .addCase(publishReport.fulfilled, (state, action) => {
        upsertReport(state, action.payload);
      });

    // Acknowledge
    builder
      .addCase(acknowledgeReport.fulfilled, (state, action) => {
        upsertReport(state, action.payload);
      });
  },
});

export const { clearReports } = reportsSlice.actions;
export default reportsSlice.reducer;
