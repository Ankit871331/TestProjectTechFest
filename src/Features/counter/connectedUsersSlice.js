// src/features/connectedUsers/connectedUsersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ✅ Thunk to fetch connected users
export const fetchConnectedUsers = createAsyncThunk(
  'connectedUsers/fetchConnectedUsers',
  async (groupId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/user/v1/group/:groupId/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch connected users');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ✅ Thunk to add a user to the group
export const addUserToGroup = createAsyncThunk(
  'connectedUsers/addUserToGroup',
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/user/v1/group/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add user to group');
      }

      const data = await response.json();
      return { groupId, userId, ...data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 🎯 Create the slice
const connectedUsersSlice = createSlice({
  name: 'connectedUsers',
  initialState: {
    users: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearConnectedUsers: (state) => {
      state.users = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Connected Users
      .addCase(fetchConnectedUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchConnectedUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchConnectedUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Add User to Group
      .addCase(addUserToGroup.fulfilled, (state, action) => {
        state.users.push(action.payload);
      });
  },
});

export const { clearConnectedUsers } = connectedUsersSlice.actions;
export default connectedUsersSlice.reducer;
