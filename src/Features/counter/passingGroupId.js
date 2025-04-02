import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  groupId: null,
  ownerId: null,
  username: "",
  lockedGroups: {},
};

const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
    setGroupId: (state, action) => {
      state.groupId = action.payload;
    },
    setOwnerId: (state, action) => {
      state.ownerId = action.payload; // Store owner ID
    },
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    setLockState: (state, action) => {
      const { groupId, lockState } = action.payload;
      state.lockedGroups[groupId] = lockState; // Update only specific group
    },
    resetGroup: (state) => {
      state.groupId = null;
      state.ownerId = null;
      state.username = "";
      state.isLocked = false;
    }
  }
});

export const { setGroupId, setOwnerId, setUsername,setLockState, resetGroup } = groupSlice.actions;
export default groupSlice.reducer;
