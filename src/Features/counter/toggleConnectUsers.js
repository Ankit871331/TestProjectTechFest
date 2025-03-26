// features/toggleSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isToggled: false, // Default value
  isUserJoinedCall: false,
  isMicoff:false,
  isVideooff:false,
};

const toggleConnectUsers = createSlice({
  name: 'toggle',
  initialState,
  reducers: {
    toggleState: (state, action) => {
      const key = action.payload;
      state[key] = !state[key];
    },
    setTrue: (state, action) => {
      const key = action.payload;
      state[key] = true;
    },
    setFalse: (state, action) => {
      const key = action.payload;
      state[key] = false;
    },
  },
});

export const { toggleState, setTrue, setFalse } = toggleConnectUsers.actions;
export default toggleConnectUsers.reducer;
