import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile } from "../../Features/counter/getProfile";
import {
    addRemoteStream,
    removeRemoteStream,
    setMediaStream,
} from "../../Features/counter/videoSlice";
import styled, { keyframes } from "styled-components";
import ConnectedUsers from '../../AfterJoinGrp/connectedUsers';

const socket = io(import.meta.env.VITE_SERVER_BASE_URL, { transports: ["websocket"] });

const RoomJoin = () => {
    const dispatch = useDispatch();
    const [roomId, setRoomId] = useState('');
    const [joined, setJoined] = useState(false);
    const [loading, setLoading] = useState(true);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const localVideoRef = useRef(null);
    const peerConnections = useRef({});
    const localStreamRef = useRef(null);

    const profile = useSelector((state) => state.user.profile);
    const groupId = profile?.user?.groupId;
    const isUserJoinedCall = useSelector((state) => state.connectedUsers.isUserJoinedCall);
    const micToggleBtn = useSelector((state) => state.connectedUsers.isMicoff);
    const VideoToggleBtn = useSelector((state) => state.connectedUsers.isVideooff);
    const isParticipationsActive = useSelector((state) => state.connectedUsers.isToggled);

    useEffect(() => {
        setLoading(true);
        dispatch(fetchUserProfile()).finally(() => setLoading(false));
    }, [dispatch]);

    useEffect(() => {
        if (isUserJoinedCall && groupId) {
            setLoading(true);
            setRoomId(groupId);
            socket.emit("joinRoom", { roomId: groupId });
            setJoined(true);
            setLoading(false);
        }
    }, [isUserJoinedCall, groupId]);

    useEffect(() => {
        const updateTrack = async (type, toggleState) => {
            if (!localStreamRef.current) return;

            if (toggleState) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ [type]: true });
                    const track = stream.getTracks()[0];

                    if (track) {
                        console.log(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} enabled`);
                        localStreamRef.current.addTrack(track);
                    }
                } catch (err) {
                    console.error(`❌ Failed to access ${type}`, err);
                }
            } else {
                localStreamRef.current.getTracks()
                    .filter(track => track.kind === type)
                    .forEach(track => {
                        track.stop();
                        localStreamRef.current.removeTrack(track);
                    });
                console.log(`🚫 ${type.charAt(0).toUpperCase() + type.slice(1)} disabled`);
            }
        };

        updateTrack("audio", micToggleBtn);
        updateTrack("video", VideoToggleBtn);
    }, [micToggleBtn, VideoToggleBtn]);

    useEffect(() => {
        const setupLocalStream = async () => {
            try {
                setLoading(true);
                const stream = new MediaStream();
                localStreamRef.current = stream;
                dispatch(setMediaStream({ id: stream.id }));

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.muted = true;
                }
                console.log("🎤🔇 Mic and Video disabled by default");
            } catch (err) {
                console.error("Failed to access camera/mic", err);
            } finally {
                setLoading(false);
            }
        };

        if (isUserJoinedCall && groupId) {
            setupLocalStream();
        }
    }, [isUserJoinedCall, groupId]);

    const iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        {
            urls: "turn:relay.metered.ca:80",
            username: "free",
            credential: "free"
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ];

    useEffect(() => {
        if (!joined) return;

        const handleUserDisconnected = ({ peerId }) => {
            if (peerConnections.current[peerId]) {
                peerConnections.current[peerId].close();
                delete peerConnections.current[peerId];
            }
            dispatch(removeRemoteStream(peerId));

            setRemoteStreams((prev) => {
                const updated = new Map(prev);
                updated.delete(peerId);
                return updated;
            });
        };

        const createPeerConnection = (peerId) => {
            const peerConnection = new RTCPeerConnection({ iceServers });

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("iceCandidate", { to: peerId, candidate: event.candidate });
                }
            };

            peerConnection.ontrack = (event) => {
                if (event.streams[0]) {
                    setRemoteStreams((prev) => {
                        const updated = new Map(prev);
                        updated.set(peerId, event.streams[0]);
                        return updated;
                    });

                    dispatch(addRemoteStream({ userId: peerId, stream: { id: event.streams[0].id } }));
                }
            };

            peerConnections.current[peerId] = peerConnection;
            return peerConnection;
        };

        socket.on("userDisconnected", handleUserDisconnected);

        return () => {
            socket.off("userDisconnected", handleUserDisconnected);

            Object.values(peerConnections.current).forEach((peer) => peer.close());
            peerConnections.current = {};

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }
        };
    }, [joined]);

    const handleJoinRoom = useCallback(() => {
        if (roomId.trim()) {
            socket.emit('joinRoom', { roomId });
            setJoined(true);
        }
    }, [roomId]);

    const handleLeaveRoom = useCallback(() => {
        if (groupId) {
            socket.emit('leaveRoom', { roomId: groupId });
        }
        setJoined(false);
    }, [groupId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-black">
            {loading ? (
                <p className="text-xl">Loading...</p>
            ) : joined ? (
                <div className="grid grid-cols-3 gap-4 p-4 w-full"></div>
            ) : (
                <p className="text-xl">Waiting to join the group call...</p>
            )}

            {isParticipationsActive && (
                <AnimatedWrapper>
                    <ConnectedUsers localref={localVideoRef} remoteStreams={remoteStreams} localStream={localStreamRef.current} />
                </AnimatedWrapper>
            )}
        </div>
    );
};

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
`;

const AnimatedWrapper = styled.div`
  animation: ${fadeInUp} 0.3s ease-in-out;
`;

export default RoomJoin;
