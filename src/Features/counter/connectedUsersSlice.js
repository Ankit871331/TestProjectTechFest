import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { io } from "socket.io-client";

// Initialize Socket.IO
const socket = io(import.meta.env.VITE_SOCKETIO);

// ✅ Thunk to add a user to the group via API
export const addUserToGroup = createAsyncThunk(
  "connectedUsers/addUserToGroup",
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/user/v1/group/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId, userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add user to group");
      }

      const data = await response.json();
      return { groupId, userId, ...data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ✅ Create Redux slice
const connectedUsersSlice = createSlice({
  name: "connectedUsers",
  initialState: {
    users: [], // ✅ Store all connected users in a single array
    status: "idle",
    error: null,
  },
  reducers: {
    clearConnectedUsers: (state) => {
      state.users = [];
    },
    // ✅ Handle user updates from socket event
    updateConnectedUsers: (state, action) => {
      state.users = action.payload; // ✅ Directly replace users array
    },
  },
  extraReducers: (builder) => {
    builder
      // Add User to Group
      .addCase(addUserToGroup.fulfilled, (state, action) => {
        state.users.push(action.payload);
      });
  },
});

// ✅ Fetch users whenever a socket event occurs
export const setupSocketListeners = (dispatch) => {
  const fetchConnectedUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/user/v1/group/connect`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      dispatch(updateConnectedUsers(data)); // ✅ Update Redux state
    } catch (error) {
      console.error("Error fetching connected users:", error);
    }
  };

  socket.on("userJoined", () => {
    console.log("User joined");
    fetchConnectedUsers(); // ✅ Fetch latest users
  });

  socket.on("userRemoved", () => {
    console.log("User removed");
    fetchConnectedUsers(); // ✅ Fetch latest users
  });
};

export const { clearConnectedUsers, updateConnectedUsers } = connectedUsersSlice.actions;
export default connectedUsersSlice.reducer;
