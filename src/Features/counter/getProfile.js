// src/features/user/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Define the async thunk to fetch user data using token
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token'); // Get token from localStorage

      const response = await fetch(`http://localhost:5000/user/v1/profile`, {
        method: 'GET', // Use GET since we're just fetching data
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Send token in Authorization header
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: {},
    status: 'idle',
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.profile = {};
      localStorage.removeItem('token'); // Clear token on logout
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
