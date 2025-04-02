import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

const MediaControls = ({ localStream }) => {
  const micToggleBtn = useSelector((state) => state.connectedUsers.isMicoff); // Microphone state from Redux
  const VideoToggleBtn = useSelector((state) => state.connectedUsers.isVideooff); // Video state from Redux

  // Handle microphone state based on Redux value
  useEffect(() => {
    const audioTrack = localStream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !micToggleBtn; // Enable mic if `micToggleBtn` is false, disable if true
      console.log(audioTrack.enabled ? 'Microphone is ON' : 'Microphone is OFF');
    }
  }, [micToggleBtn, localStream]); // Re-run whenever `micToggleBtn` changes

  // Handle video state based on Redux value
  useEffect(() => {
    const videoTrack = localStream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !VideoToggleBtn; // Enable video if `VideoToggleBtn` is false, disable if true
      console.log(videoTrack.enabled ? 'Video is ON' : 'Video is OFF');
    }
  }, [VideoToggleBtn, localStream]); // Re-run whenever `VideoToggleBtn` changes

  return (
    <div>
      <p>Microphone is currently {micToggleBtn ? 'OFF' : 'ON'}</p>
      <p>Video is currently {VideoToggleBtn ? 'OFF' : 'ON'}</p>
    </div>
  );
};

export default MediaControls;
