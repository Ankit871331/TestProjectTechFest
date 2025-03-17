// features/toggleSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isToggled: false, // Default value
};

const toggleConnectUsers = createSlice({
  name: 'toggle',
  initialState,
  reducers: {
    toggle: (state) => {
      state.isToggled = !state.isToggled; // Toggles between true and false
    },
    setTrue: (state) => {
      state.isToggled = true; // Sets the state to true
    },
    setFalse: (state) => {
      state.isToggled = false; // Sets the state to false
    },
  },
});

export const { toggle, setTrue, setFalse } = toggleConnectUsers.actions;
export default toggleConnectUsers.reducer;
