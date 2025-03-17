import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  groupId: null,
  username: ""
};

const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
    setGroupId: (state, action) => {
      state.groupId = action.payload;
    },
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    resetGroup: (state) => {
      state.groupId = null;
      state.username = "";
    }
  }
});

export const { setGroupId, setUsername, resetGroup } = groupSlice.actions;
export default groupSlice.reducer;
