import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk for creating a group
export const createGroup = createAsyncThunk(
    "groups/createGroup",
    async (groupData, { rejectWithValue }) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/user/v1/createGroup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(groupData), // Includes Topic, Language, NumberOfMembers
            });

            if (!response.ok) {
                throw new Error("Failed to create group");
            }

            return await response.json(); // Expecting { _id, Topic, Language, NumberOfMembers, ... }
        } catch (error) {
            return rejectWithValue(error.message || "An unknown error occurred.");
        }
    }
);

// Async thunk for fetching groups from the database
export const fetchGroups = createAsyncThunk(
    "groups/fetchGroups",
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/user/v1/getGroupData`);

            if (!response.ok) {
                throw new Error("Failed to fetch groups");
            }

            return await response.json(); // Expecting array of groups with NumberOfMembers
        } catch (error) {
            return rejectWithValue(error.message || "An unknown error occurred.");
        }
    }
);

const groupSlice = createSlice({
    name: "groups",
    initialState: {
        groups: [],
        loading: false,
        error: null,
    },
    reducers: {
        addNewGroup: (state, action) => {
            const newGroup = action.payload;

            // Prevent duplicate groups before adding
            const exists = state.groups.some((group) => group._id === newGroup._id);
            if (!exists) {
                state.groups = [...state.groups, newGroup]; // newGroup includes NumberOfMembers
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Handle group creation
            .addCase(createGroup.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createGroup.fulfilled, (state, action) => {
                state.loading = false;

                // Prevent duplicate groups
                const exists = state.groups.some((group) => group._id === action.payload._id);
                if (!exists) {
                    state.groups.push(action.payload); // payload includes NumberOfMembers
                }
            })
            .addCase(createGroup.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to create group";
            })

            // Handle fetching groups
            .addCase(fetchGroups.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGroups.fulfilled, (state, action) => {
                state.loading = false;
                state.groups = action.payload; // payload includes NumberOfMembers for each group
            })
            .addCase(fetchGroups.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch groups";
            });
    },
});

export const { addNewGroup } = groupSlice.actions;
export default groupSlice.reducer;