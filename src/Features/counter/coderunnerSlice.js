import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

console.log("Hello from CodeRunner Slice");

// Controller reference for stopping execution
let controller = null;

// Async thunk to execute code via API using fetch
export const runCode = createAsyncThunk(
  "coderunner/runCode",
  async ({ language, code }, { rejectWithValue }) => {
    console.log("Requesting code execution:", { language, code });

    // Abort previous request (if any)
    if (controller) controller.abort();

    // Create a new AbortController instance
    controller = new AbortController();
    const { signal } = controller;

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/user/v1/coderunner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
        signal, // Attach the signal for request cancellation
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.output || "Code execution failed. Please try again.");
      }

      console.log("Execution response:", data.output);
      return data.output || "No output generated.";
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("Code execution stopped by user.");
        return rejectWithValue("Execution Stopped!");
      }

      console.error("Code execution error:", error.message);
      return rejectWithValue(error.message || "Code execution failed. Please try again.");
    }
  }
);

// Action to stop execution
export const stopCode = () => (dispatch) => {
  if (controller) {
    controller.abort(); // Abort the request
    controller = null; // Reset controller
  }
  dispatch({ type: "coderunner/stopCode" });
};

const coderunnerSlice = createSlice({
  name: "coderunner",
  initialState: {
    output: "",
    isLoading: false,
    error: null,
  },
  reducers: {
    clearOutput: (state) => {
      state.output = "";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.output = "Executing...";
      })
      .addCase(runCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.output = action.payload;
      })
      .addCase(runCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.output = ""; // Clear output if execution fails
      })
      .addCase("coderunner/stopCode", (state) => {
        state.isLoading = false;
        state.output = "Execution Stopped!";
        state.error = null;
      });
  },
});

export const { clearOutput } = coderunnerSlice.actions;
export default coderunnerSlice.reducer;
