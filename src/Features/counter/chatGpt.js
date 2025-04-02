import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Define the async thunk for fetching OpenAI response
export const fetchChatGptResponse = createAsyncThunk(
    "chatGpt/fetchResponse",
    async (prompt, { rejectWithValue }) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/user/v1/openAI`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) throw new Error("Failed to fetch response");

            const data = await response.json();
            return data.reply;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Create the slice
const chatGptSlice = createSlice({
    name: "chatGpt",
    initialState: {
        response: "",
        loading: false,
        error: null,
    },
    reducers: {}, // No manual reducers needed for async operations
    extraReducers: (builder) => {
        builder
            .addCase(fetchChatGptResponse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchChatGptResponse.fulfilled, (state, action) => {
                state.loading = false;
                state.response = action.payload;
            })
            .addCase(fetchChatGptResponse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default chatGptSlice.reducer;
