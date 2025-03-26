import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  remoteStreams:{}, // Stores remote users' video streams
  localVideoRef: null, // Stores local video reference
  mediaStream: null, // Stores the user's media stream
};

const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    // ✅ Add or Update a Remote Stream
    addRemoteStream: (state, action) => {
      state.remoteStreams = {
          ...state.remoteStreams,
          [action.payload.userId]: action.payload.streamId  // ✅ Store only streamId
      };
  },


    removeRemoteStream: (state, action) => {
        const updatedStreams = { ...state.remoteStreams };
        delete updatedStreams[action.payload];  // ✅ Use `delete` for plain object
        state.remoteStreams = updatedStreams;  // ✅ Update state with modified object
    },


    // ✅ Set Local Video Reference
    setLocalVideoRef: (state, action) => {
      state.localVideoRef = action.payload;
    },

    // ✅ Set MediaStream (Local Video/Audio)
    setMediaStream: (state, action) => {
        state.localStreamId = action.payload.id; // ✅ Store only the ID
    },

    // ✅ Clear All Streams (Reset)
    clearAllStreams: (state) => {
      state.remoteStreams.clear();
      state.localVideoRef = null;
      state.mediaStream = null;
    },
  },
});

export const {
  addRemoteStream,
  removeRemoteStream,
  setLocalVideoRef,
  setMediaStream,
  clearAllStreams,
} = videoSlice.actions;

export default videoSlice.reducer;
