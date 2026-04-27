import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import classroomsReducer from "./classroomsSlice";
import dailyLogsReducer from "./dailyLogsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    classrooms: classroomsReducer,
    dailyLogs: dailyLogsReducer,
  },
});
