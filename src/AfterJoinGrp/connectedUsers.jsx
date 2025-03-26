import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGroups } from "../Features/counter/createGroup";
import { fetchUserProfile } from "../Features/counter/getProfile";
import styled from "styled-components";


export default function ConnectedUsers({ localref, remoteStreams, localStream }) {
  console.log("remoteStreams", remoteStreams)
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);
  const userId = profile?.user?._id; // Current user's ID
  const groupId = profile?.user?.groupId; // Target group ID
  const groupsState = useSelector((state) => state.group);

  const micToggleBtn = useSelector((state) => state.connectedUsers.isMicoff); // Microphone state from Redux
  const VideoToggleBtn = useSelector((state) => state.connectedUsers.isVideooff);



  // Find the group matching the groupId
  const targetGroup = groupsState?.groups?.find(
    (group) => group._id === groupId
  );
  let participants = targetGroup?.connectedUsers || []; // Fetch connected users of the group

  // Make a copy and sort participants to place the logged-in user's card first
  const sortedParticipants = [...participants].sort((a, b) =>
    a.userId === userId ? -1 : b.userId === userId ? 1 : 0
  );


  const videoRefs = useRef(new Map());

  useEffect(() => {
    console.log("Checking video refs...");
    videoRefs.current.forEach((video, producerId) => {
      console.log(`Checking video for producer: ${producerId}`, video);
      const streamObj = remoteStreams.get(producerId);
      const videoStream = streamObj?.video;

      if (video && videoStream && video.srcObject !== videoStream) {
        console.log("Assigning video stream to element...");
        video.srcObject = videoStream;
      }
    });
  }, [remoteStreams]);


  useEffect(() => {
    dispatch(fetchGroups());
    dispatch(fetchUserProfile());
  }, [dispatch]);

  return (
    <Container>
      <CardsContainer>
        <ParticipantsGrid>
          {sortedParticipants.map((user, index) => (
            <ParticipantBox key={index}>
              <Rectangle>
                <Circle>
                  {userId === user.userId
                    ? "Y" // Display "Y" for "You"
                    : user.name.charAt(0).toUpperCase()} {/* First capital letter */}
                </Circle>
                <Name>
                  {userId === user.userId
                    ? "You" // Replace their name with "You"
                    : user.name}
                </Name>
                {/* Show local video for the current user */}
                {userId === user.userId ? (
                  <LocalVideo
                    autoPlay
                    playsInline
                    ref={(video) => {
                      if (video && video.srcObject !== localStream) {
                        console.log("Setting local stream:", localStream);
                        video.srcObject = localStream;
                      }
                    }}
                  />
                ) : (
                  <>

                    {Array.from(remoteStreams.entries()).map(([producerId, streamObj]) => {
                      return (
                        <video
                          key={producerId}
                          autoPlay
                          playsInline
                          ref={(video) => {
                            console.log("Video ref callback executed:", video);
                            if (video && streamObj?.video instanceof MediaStream) {
                              console.log("Setting video source for:", producerId);
                              video.srcObject = streamObj.video;
                            }
                          }}
                        />
                      );
                    })}

                  </>
                )}

              </Rectangle>
            </ParticipantBox>
          ))}
        </ParticipantsGrid>
      </CardsContainer>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const CardsContainer = styled.div`
  width: 92vw;
  max-width: 700px;
  height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);

  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ParticipantsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  justify-content: center;
  align-items: center;
  padding: 20px;
  width: 100%;
`;

const ParticipantBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Rectangle = styled.div`
  background-color: #2d2f2b;
  padding: 15px;
  width: 250px;
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
`;

const Circle = styled.div`
  width: 60px;
  height: 60px;
  background-color: #00bfff;
  color: white;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 10px;
`;

const Name = styled.div`
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  color: #74d5e4;
  word-wrap: break-word;
  max-width: 70px;
`;

const LocalVideo = styled.video`
  width: 100%;
  height: auto;
  border-radius: 10px;
  margin-top: 10px;
`;

const ParticipantVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover; /* Ensure the video fits the card */
  border-radius: 10px;
`;
