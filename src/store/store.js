import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import classroomsReducer from "./classroomsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    classrooms: classroomsReducer,
  },
});
