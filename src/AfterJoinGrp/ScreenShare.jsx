import React, { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "../Features/counter/getProfile";
import styled from "styled-components";
import ScreenShareVideo from "./screenShareVideo";
import { setTrue, setFalse } from "../Features/counter/toggleConnectUsers";

const socket = io(import.meta.env.VITE_SERVER_BASE_URL, { transports: ["websocket"] });

// Throttle utility for ICE candidates
const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

const ScreenShare = () => {
    const dispatch = useDispatch();
    const videoRef = useRef(null);
    const peerConnection = useRef(null);
    const localStream = useRef(null);
    const [isSharing, setIsSharing] = useState(false); // Local sharing state
    const [isReceiving, setIsReceiving] = useState(false); // Remote stream state

    const isscreen = useSelector((state) => state.connectedUsers.isScreenOff);
    const { profile } = useSelector((state) => state.user);
    const groupId = useSelector((state) => state.passingGroupId.groupId);

    // const groupId = profile?.user?.groupId;

    useEffect(() => {
        dispatch(fetchUserProfile());
    }, [dispatch]);

    useEffect(() => {
        if (isscreen && !isSharing) {
            console.log("Starting screen sharing...");
            startSharing();
        } else if (!isscreen && isSharing) {
            console.log("Stopping screen sharing via toggle...");
            stopSharing();
        }

        return () => {
            if (!isscreen && isSharing) stopSharing();
        };
    }, [isscreen, isSharing]);

    useEffect(() => {
        if (isSharing && videoRef.current && localStream.current) {
            console.log("Attaching local stream on mount");
            videoRef.current.srcObject = localStream.current;
            videoRef.current.play().catch((e) => console.error("Video play failed:", e));
        }
    }, [isSharing]);

    useEffect(() => {
        socket.on("screen-offer", async ({ offer, senderId }) => {
            console.log("Received screen-offer from:", senderId);
            if (!peerConnection.current) setupPeerConnection();

            try {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
                if (localStream.current) {
                    localStream.current.getTracks().forEach((track) => {
                        console.log("Adding local track to answer:", track);
                        peerConnection.current.addTrack(track, localStream.current);
                    });
                }
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);
                console.log("Sending screen-answer to:", senderId);
                socket.emit("screen-answer", { answer, senderId });
            } catch (error) {
                console.error("Error handling screen-offer:", error);
            }
        });

        socket.on("screen-answer", async ({ answer }) => {
            console.log("Received screen-answer");
            if (peerConnection.current) {
                try {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log("Remote description set successfully");
                } catch (error) {
                    console.error("Error setting remote answer:", error);
                }
            }
        });

        socket.on("screen-ice-candidate", ({ candidate }) => {
            if (candidate && peerConnection.current) {
                console.log("Adding received ICE candidate:", candidate);
                peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) =>
                    console.error("Error adding ICE candidate:", e)
                );
            }
        });

        socket.on("screen-stop-share", () => {
            console.log("Screen sharing stopped by remote peer");
            setIsReceiving(false); // Stop displaying remote stream
            if (isSharing) stopSharing(); // Stop local sharing if active
        });

        return () => {
            socket.off("screen-offer");
            socket.off("screen-answer");
            socket.off("screen-ice-candidate");
            socket.off("screen-stop-share");
        };
    }, [groupId, isSharing]);

    const startSharing = useCallback(async () => {
        if (isSharing) return;

        try {
            console.log("Requesting screen share...");
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { max: 1280 },
                    height: { max: 720 },
                    frameRate: { max: 10 },
                },
                audio: false,
            });

            if (!stream) {
                console.error("No stream received");
                return;
            }

            localStream.current = stream;
            setIsSharing(true);
            dispatch(setTrue("isSharingScreen"));

            setupPeerConnection();

            stream.getTracks().forEach((track) => {
                console.log("Adding track to peer connection:", track);
                peerConnection.current.addTrack(track, stream);
                track.onended = () => {
                    console.log("Screen sharing stopped via Chrome button");
                    socket.emit("screen-stop-share", { groupId });
                    stopSharing();
                };
            });

            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            console.log("Sending screen-offer to group:", groupId);
            socket.emit("screen-offer", { offer, groupId });
        } catch (error) {
            console.error("Error sharing screen:", error);
            setIsSharing(false);
            dispatch(setFalse("isSharingScreen"));
        }
    }, [isSharing, groupId, dispatch]);

    const setupPeerConnection = useCallback(() => {
        console.log("Setting up peer connection...");
        peerConnection.current = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        });

        peerConnection.current.ontrack = (event) => {
            console.log("Received remote track:", event.streams[0]);
            setIsReceiving(true); // Activate remote stream display
            if (videoRef.current) {
                console.log("Attaching remote stream to videoRef");
                videoRef.current.srcObject = event.streams[0];
                videoRef.current.play().catch((e) => console.error("Video play failed:", e));
            } else {
                console.error("videoRef.current is null in ontrack");
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = event.streams[0];
                        videoRef.current.play().catch((e) => console.error("Retry failed:", e));
                    }
                }, 100);
            }
        };

        const throttledIceCandidate = throttle((candidate) => {
            console.log("Sending ICE candidate:", candidate);
            socket.emit("screen-ice-candidate", { candidate, groupId });
        }, 100);

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                throttledIceCandidate(event.candidate);
            }
        };

        peerConnection.current.onconnectionstatechange = () => {
            console.log("Connection state:", peerConnection.current.connectionState);
            if (peerConnection.current.connectionState === "failed") {
                console.error("Peer connection failed");
            }
        };

        socket.emit("screen-started", { groupId });
    }, [groupId]);

    const stopSharing = useCallback(() => {
        console.log("stopSharing called, current state:", { isSharing, isReceiving });
        if (!isSharing) return;

        console.log("Stopping screen share...");
        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => track.stop());
            localStream.current = null;
        }

        if (peerConnection.current) {
            peerConnection.current.ontrack = null;
            peerConnection.current.onicecandidate = null;
            peerConnection.current.close();
            peerConnection.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.load();
        }

        setIsSharing(false);
        setIsReceiving(false); // Ensure both states reset
        dispatch(setFalse("isSharingScreen"));
        socket.emit("screen-stop-share", { groupId });
        console.log("After stopSharing, new state:", { isSharing: false, isReceiving: false });
    }, [isSharing, groupId, dispatch]);

    return (
        <Container>
            {(isSharing || isReceiving) && <ScreenShareVideo ref={videoRef} />}
            {!isSharing && !isReceiving }
        </Container>
    );
};

export default ScreenShare;

const Container = styled.div`
    display: flex;
    align-items: center;
    background-color: #121212;
    padding-left: 90px;
    width: calc(100vw - 80px);
`;

const Placeholder = styled.p`
    color: #fff;
    font-size: 16px;
`;