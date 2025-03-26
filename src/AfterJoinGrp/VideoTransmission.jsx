import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function VideoTransmission({remoteStreams}) {
  console.log("remoteStreams before use:", remoteStreams);

  const [streams, setStreams] = useState(new Map());



  return (
    <div className="grid grid-cols-2 gap-4 p-4">
    {Array.from(remoteStreams.entries()).map(([producerId, stream]) => (
  <div key={producerId}>
    <p>User ID: {producerId}</p>
    {stream instanceof MediaStream ? (
      <video
        autoPlay
        playsInline
        ref={(video) => {
          if (video && video.srcObject !== stream) {
            video.srcObject = stream;
          }
        }}
      />
    ) : (
      <p>No video available</p>
    )}
  </div>
))}

    </div>
  );
}
