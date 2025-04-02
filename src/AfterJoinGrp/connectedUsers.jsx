import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { fetchGroups } from '../Features/counter/createGroup';
import { useDispatch, useSelector } from 'react-redux';

const ConnectedUsers = ({ localVideoStream, remoteStreams }) => {
    console.log("remoteStreamsremoteStreams", remoteStreams);
    const dispatch = useDispatch();
    const localVideoRef = useRef(null);
    const videoRefs = useRef(new Map());
    const micToggleBtn = useSelector((state) => state.connectedUsers.isMicoff);
    const VideoToggleBtn = useSelector((state) => state.connectedUsers.isVideooff);
    const { profile } = useSelector((state) => state.user);
    const groupsState = useSelector((state) => state.group);
    const groupId = useSelector((state) => state.passingGroupId.groupId);
    const userName = profile?.user?.name;
    const userId = profile?.user?._id;

    const currentGroup = groupsState?.groups?.find((group) => group._id === groupId);
    const connectedUsers = currentGroup?.connectedUsers || [];
    const filteredUsers = connectedUsers.filter(user => user.userId !== userId);

    // Array of border colors to cycle through
    const borderColors = [
        '#00bfff', // Deep Sky Blue
        '#ff6b6b', // Coral
        '#4ecdc4', // Turquoise
        '#45b7d1', // Light Blue
        '#96c93d', // Lime Green
        '#ffa502', // Orange
    ];

    useEffect(() => {
        if (localVideoRef.current && localVideoStream && localVideoRef.current.srcObject !== localVideoStream) {
            console.log("✅ Setting local video stream...");
            localVideoRef.current.srcObject = localVideoStream;
        }
    }, [localVideoStream]);

    useEffect(() => {
        dispatch(fetchGroups());
    }, [dispatch]);

    useEffect(() => {
        remoteStreams.forEach((streamObj, producerId) => {
            const videoElement = videoRefs.current.get(producerId);
            const videoStream = streamObj?.stream;

            if (!videoElement) {
                console.error(`🚨 Video element for ${producerId} is NULL!`);
                return;
            }

            if (!(videoStream instanceof MediaStream)) {
                console.error(`🚨 Invalid MediaStream for ${producerId}`, videoStream);
                return;
            }

            if (videoElement.srcObject !== videoStream) {
                console.log(`✅ Assigning video stream for ${producerId}`);
                videoElement.srcObject = videoStream;
            }
        });
    }, [remoteStreams]);

    return (
        <Container>
            <ParticipantsGrid>
                {/* Local Stream */}
                {localVideoStream && (
                    <ParticipantBox>
                        <Rectangle borderColor={borderColors[0]}>
                            <Circle>{userName?.charAt(0).toUpperCase() || "Y"}</Circle>
                            <Name>You</Name>
                            <Video ref={localVideoRef} autoPlay playsInline muted />
                        </Rectangle>
                    </ParticipantBox>
                )}

                {/* All Connected Users */}
                {filteredUsers.map((user, index) => {
                    const streamData = Array.from(remoteStreams.entries())[index];
                    const producerId = streamData?.[0] || `user-${index}`;
                    const stream = streamData?.[1]?.stream;

                    console.log(`🎥 Rendering connected user: ${user.name}`);
                    return (
                        <ParticipantBox key={user.id || index}>
                            <Rectangle
                                borderColor={borderColors[(index + 1) % borderColors.length]}
                            >
                                <Circle>{user.name?.charAt(0).toUpperCase() || "U"}</Circle>
                                <Name>{user.name || "Unknown"}</Name>
                                <Video
                                    autoPlay
                                    playsInline
                                    ref={(video) => {
                                        if (video) {
                                            videoRefs.current.set(producerId, video);
                                            if (stream && video.srcObject !== stream) {
                                                console.log(`✅ Assigning stream for ${user.name}`);
                                                video.srcObject = stream;
                                            }
                                        }
                                    }}
                                />
                            </Rectangle>
                        </ParticipantBox>
                    );
                })}
            </ParticipantsGrid>
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;
    padding: 80px 20px;
    box-sizing: border-box;
`;

const ParticipantsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 40px;
    width: 100%;
    max-width: 1200px;
    height: calc(100vh - 100px);
    overflow-y: scroll;
    padding: 10px;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
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
    overflow: hidden;
    border: 3px solid ${props => props.borderColor || '#00bfff'}; // Dynamic border color
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); // Optional: adds subtle shadow
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
    max-width: 100px;
    margin-bottom: 10px;
`;

const Video = styled.video`
    width: 100%;
    height: 70%;
    border-radius: 10px;
    object-fit: cover;
`;

export default ConnectedUsers;