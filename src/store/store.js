import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import classroomsReducer from "./classroomsSlice";
import dailyLogsReducer from "./dailyLogsSlice";
import reportsReducer from "./reportsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    classrooms: classroomsReducer,
    dailyLogs: dailyLogsReducer,
    reports: reportsReducer,
  },
});

