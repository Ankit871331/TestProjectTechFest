import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile } from "../../Features/counter/getProfile";
import {
    addRemoteStream,
    removeRemoteStream,
    setLocalVideoRef,
    setMediaStream,
} from "../../Features/counter/videoSlice";
import styled from "styled-components";
import { keyframes } from "styled-components";
import VideoTransmission from '../../AfterJoinGrp/VideoTransmission';
import ConnectedUsers from '../../AfterJoinGrp/connectedUsers';

const socket = io(import.meta.env.VITE_SERVER_BASE_URL, { transports: ["websocket"] });

const RoomJoin = () => {
    const dispatch = useDispatch();
    const [roomId, setRoomId] = useState('');
    const [joined, setJoined] = useState(false);
    const [loading, setLoading] = useState(true); // ✅ Loading state
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);

    const [localStream, setLocalStream] = useState(null);
    const localVideoRef = useRef(null);
    const peerConnections = useRef({});
    const localStreamRef = useRef(null);
    const { profile } = useSelector((state) => state.user);
    const groupId = profile?.user?.groupId; // Target group ID

    const isUserJoinedCall = useSelector((state) => state.connectedUsers.isUserJoinedCall);
    const micToggleBtn = useSelector((state) => state.connectedUsers.isMicoff); // Microphone state from Redux
    const VideoToggleBtn = useSelector((state) => state.connectedUsers.isVideooff);
    const isParticipationsActive = useSelector((state) => state.connectedUsers.isToggled);

    console.log("isparticipation", isParticipationsActive)



    useEffect(() => {
        setLoading(true);
        dispatch(fetchUserProfile())
            .finally(() => setLoading(false));
    }, [dispatch]);


    useEffect(() => {
        if (isUserJoinedCall && groupId) {
            setLoading(true);
            socket.emit("joinRoom", { roomId: groupId });
            setJoined(true);
            setLoading(false);
        }
    }, [isUserJoinedCall, groupId]); // ✅ Automatically joins room when isUserJoinedCall is true


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
        if (isUserJoinedCall && groupId) {
            setRoomId(groupId);

            const setupLocalStream = async () => {
                try {
                    setLoading(true);

                    // Initialize an empty media stream
                    const stream = new MediaStream();
                    localStreamRef.current = stream;
                    setLocalStream(stream);
                    dispatch(setMediaStream({ id: stream.id }));

                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                        localVideoRef.current.muted = true;
                    }

                    console.log("🔇 Mic and Video are disabled by default");

                } catch (err) {
                    console.error("Failed to access camera/mic", err);
                } finally {
                    setLoading(false);
                }
            };


            setupLocalStream();
        }
    }, [isUserJoinedCall, groupId]);



    const iceServers = [
        { urls: "stun:stun.l.google.com:19302" }, // Google's STUN server
        {
            urls: "turn:relay.metered.ca:80", // Example free TURN server
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
        console.log("🟠 useEffect for WebRTC setup - joined:", joined, "roomId:", roomId);
        if (joined) {
            const setupLocalStream = async () => {
                try {
                    console.log("🟠 Setting up local stream");
                    const stream = new MediaStream();
                    localStreamRef.current = stream;

                    // Add silent audio track as a placeholder
                    const audioContext = new AudioContext();
                    const oscillator = audioContext.createOscillator();
                    oscillator.frequency.value = 0; // Silent
                    const destination = audioContext.createMediaStreamDestination();
                    oscillator.connect(destination);
                    oscillator.start();
                    const silentAudioTrack = destination.stream.getAudioTracks()[0];
                    stream.addTrack(silentAudioTrack);
                    console.log("🟠 Added silent audio track to local stream");

                    // Add dummy video track (black canvas)
                    const canvas = document.createElement('canvas');
                    canvas.width = 640;
                    canvas.height = 480;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = 'black';
                    ctx.fillRect(0, 0, 640, 480);
                    const blankVideoTrack = canvas.captureStream().getVideoTracks()[0];
                    stream.addTrack(blankVideoTrack);
                    console.log("🟠 Added blank video track to local stream");

                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                        console.log("🟠 Local video ref assigned stream with silent audio and blank video");
                    }

                    socket.emit('newProducer', {
                        roomId,
                        producerId: socket.id,
                        streamId: stream.id,
                    });
                    console.log("🟠 Emitted newProducer:", socket.id, stream.id);

                    socket.on('existingProducers', async (producers) => {
                        console.log("🟠 Received existingProducers:", producers);
                        if (!producers || producers.length === 0) {
                            console.log("🟠 No existing producers found");
                            return;
                        }
                        for (const producer of producers) {
                            if (producer.producerId !== socket.id) {
                                console.log("🟠 Connecting to existing producer:", producer.producerId);
                                await connectToProducer(producer.producerId);
                            }
                        }
                    });

                    socket.on('newProducerAvailable', async ({ producerId }) => {
                        console.log("📡 New producer available:", producerId);
                        if (producerId !== socket.id) {
                            console.log("🟠 Initiating connection to new producer:", producerId);
                            await connectToProducer(producerId);
                        }
                    });

                    socket.on('offer', async ({ from, offer }) => {
                        console.log("🟠 Received offer from:", from);
                        try {
                            let peerConnection = peerConnections.current[from] || createPeerConnection(from);
                            localStreamRef.current.getTracks().forEach((track) => {
                                console.log("🟠 Adding local track to peer:", track.kind, track.readyState);
                                if (!peerConnection.getSenders().some((sender) => sender.track === track)) {
                                    peerConnection.addTrack(track, localStreamRef.current);
                                }
                            });
                            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                            const answer = await peerConnection.createAnswer();
                            answer.sdp = modifySdp(answer.sdp);
                            await peerConnection.setLocalDescription(answer);
                            socket.emit('answer', { to: from, answer });
                            console.log("🟠 Sent answer to:", from);
                        } catch (e) {
                            console.error("🟠 Error in offer handling:", e);
                        }
                    });

                    socket.on('answer', async ({ from, answer }) => {
                        console.log("🟠 Received answer from:", from);
                        try {
                            const peerConnection = peerConnections.current[from];
                            if (peerConnection && peerConnection.signalingState === 'have-local-offer') {
                                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                                console.log("🟠 Remote description set for:", from);
                            }
                        } catch (e) {
                            console.error("🟠 Error in answer handling:", e);
                        }
                    });

                    socket.on("iceCandidate", ({ from, candidate }) => {
                        console.log("🟠 Received ICE candidate from:", from, candidate);
                        if (!candidate || !candidate.candidate) {
                            console.warn("🟠 Invalid ICE candidate:", candidate);
                            return;
                        }
                        const peerConnection = peerConnections.current[from];
                        if (peerConnection) {
                            peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                                .then(() => console.log("🟠 ICE candidate added for:", from))
                                .catch((e) => console.error("🟠 Error adding ICE candidate:", e));
                        }
                    });

                    socket.on("userDisconnected", ({ peerId }) => {
                        console.log("🟠 User disconnected:", peerId);
                        if (peerConnections.current[peerId]) {
                            peerConnections.current[peerId].close();
                            delete peerConnections.current[peerId];
                        }
                        dispatch(removeRemoteStream(peerId));
                        setRemoteStreams((prev) => {
                            const updated = new Map(prev);
                            updated.delete(peerId);
                            console.log("🟠 Updated remoteStreams after disconnect:", updated);
                            return updated;
                        });
                    });
                } catch (err) {
                    console.error("🟠 Failed to setup local stream:", err);
                }
            };

            const connectToProducer = async (producerId) => {
                if (peerConnections.current[producerId]) {
                    console.warn("🟠 Already connected to producer:", producerId);
                    return;
                }
                console.log("🟠 Creating peer connection for:", producerId);
                const peerConnection = createPeerConnection(producerId);
                localStreamRef.current.getTracks().forEach((track) => {
                    console.log("🟠 Adding local track to new peer:", track.kind, track.readyState);
                    peerConnection.addTrack(track, localStreamRef.current);
                });
                try {
                    const offer = await peerConnection.createOffer();
                    offer.sdp = modifySdp(offer.sdp);
                    await peerConnection.setLocalDescription(offer);
                    socket.emit("offer", { roomId, offer, to: producerId });
                    console.log("🟠 Sent offer to:", producerId);
                } catch (e) {
                    console.error("🟠 Error in connectToProducer:", e);
                }
            };

            const createPeerConnection = (peerId) => {
                console.log("🟠 Initializing RTCPeerConnection for:", peerId);
                const peerConnection = new RTCPeerConnection({ iceServers });

                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log("🟠 Sending ICE candidate to:", peerId, event.candidate);
                        socket.emit("iceCandidate", { to: peerId, candidate: event.candidate });
                    } else {
                        console.log("🟠 All ICE candidates sent for:", peerId);
                    }
                };

                peerConnection.ontrack = (event) => {
                    console.log("🟠 ontrack event triggered for:", peerId, "streams:", event.streams);
                    if (event.streams && event.streams[0]) {
                        const stream = event.streams[0];
                        console.log("🟠 Remote stream tracks received:", stream.getTracks().map(t => ({
                            kind: t.kind,
                            enabled: t.enabled,
                            readyState: t.readyState
                        })));
                        const audioStream = new MediaStream();
                        const videoStream = new MediaStream();
                        stream.getTracks().forEach(track => {
                            if (track.kind === 'audio') audioStream.addTrack(track);
                            else if (track.kind === 'video') videoStream.addTrack(track);
                        });
                        console.log("🟠 Audio tracks:", audioStream.getAudioTracks());
                        console.log("🟠 Video tracks:", videoStream.getVideoTracks());
                        setRemoteStreams((prev) => {
                            const updated = new Map(prev);
                            updated.set(peerId, { audio: audioStream, video: videoStream });
                            console.log("🟠 Updated remoteStreams:", updated);
                            return updated;
                        });
                        if (audioStream.getAudioTracks().length > 0) {
                            const audioElement = new Audio();
                            audioElement.srcObject = audioStream;
                            audioElement.autoplay = true;
                            audioElement.play().catch(e => console.error("🟠 Audio play failed:", e));
                            document.body.appendChild(audioElement);
                            console.log("🟠 Playing audio for:", peerId);
                        }
                    } else {
                        console.warn("🟠 ontrack event with no streams:", event);
                    }
                };

                peerConnection.oniceconnectionstatechange = () => {
                    console.log("🟠 ICE state for", peerId, ":", peerConnection.iceConnectionState);
                    if (peerConnection.iceConnectionState === "failed") {
                        console.error("🟠 ICE connection failed for:", peerId);
                    }
                };

                peerConnections.current[peerId] = peerConnection;
                return peerConnection;
            };

            const modifySdp = (sdp) => {
                sdp = sdp.replace('a=rtpmap:100 VP8/90000', 'a=rtpmap:100 VP9/90000');
                sdp = sdp.replace('b=AS:30', 'b=AS:500');
                return sdp;
            };

            setupLocalStream();

            return () => {
                console.log("🟠 Cleaning up WebRTC useEffect");
                socket.off('existingProducers');
                socket.off('newProducerAvailable');
                socket.off('offer');
                socket.off('answer');
                socket.off('iceCandidate');
                socket.off('userDisconnected');
                Object.values(peerConnections.current).forEach(pc => pc.close());
                peerConnections.current = {};
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(track => track.stop());
                    localStreamRef.current = null;
                }
            };
        }
    }, [joined, roomId]);

    const handleJoinRoom = () => {
        if (roomId.trim() !== '') {
            socket.emit('joinRoom', { roomId });
            setJoined(true);
        }
    };

    const handleLeaveRoom = () => {
        if (groupId) {
            socket.emit('leaveRoom', { roomId: groupId });
        }
        setJoined(false);
    };



    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-black">
            {loading ? (
                <p className="text-xl">Loading...</p> // ✅ Show loading message
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
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AnimatedWrapper = styled.div`
  animation: ${fadeInUp} 0.3s ease-in-out;
`;

export default RoomJoin;
