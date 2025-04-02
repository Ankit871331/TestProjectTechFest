import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile } from "../../Features/counter/getProfile";
import ConnectedUsers from '../../AfterJoinGrp/connectedUsers'; // Adjust path as needed

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const RoomJoin = () => {
    const dispatch = useDispatch();
    const [joined, setJoined] = useState(false);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const [localStream, setLocalStream] = useState(null);
    const [localVideoStream, setLocalVideoStream] = useState(null);
    const localVideoRef = useRef(null);
    const localAudioRef = useRef(null);
    const peerConnections = useRef({});
    const localStreamRef = useRef(null);
    const { profile } = useSelector((state) => state.user);
    const joinCall = useSelector((state) => state.connectedUsers);

    const isUserJoinedCall = useSelector((state) => state.connectedUsers.isUserJoinedCall);
    const micToggleBtn = useSelector((state) => state.connectedUsers.isMicoff);
    const VideoToggleBtn = useSelector((state) => state.connectedUsers.isVideooff);
    const isParticipationsActive = useSelector((state) => state.connectedUsers.isToggled);

    console.log("micToggleBtn", micToggleBtn);
    console.log("VideoToggleBtn", VideoToggleBtn);
    const groupId = useSelector((state) => state.passingGroupId.groupId);
    // const groupId = profile?.user?.groupId;
    // const userName = profile?.user?.name;
    // console.log("name", userName);

    useEffect(() => {
        dispatch(fetchUserProfile());
    }, [dispatch]);

    // Set up local stream
    useEffect(() => {
        const setupLocalStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                stream.getAudioTracks().forEach(track => track.enabled = !micToggleBtn);
                stream.getVideoTracks().forEach(track => track.enabled = !VideoToggleBtn);

                localStreamRef.current = stream;
                setLocalStream(stream);

                const videoTracks = stream.getVideoTracks();
                const audioTracks = stream.getAudioTracks();
                const videoOnlyStream = new MediaStream(videoTracks);
                setLocalVideoStream(videoOnlyStream);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = videoOnlyStream;
                }

                if (audioTracks.length > 0 && localAudioRef.current) {
                    const audioStream = new MediaStream(audioTracks);
                    localAudioRef.current.srcObject = audioStream;
                    localAudioRef.current.play().catch(e => console.error("Local audio play failed:", e));
                }
            } catch (err) {
                console.error('Failed to access camera/mic', err);
            }
        };

        setupLocalStream();
    }, []);


    useEffect(() => {
        if (!localStreamRef.current) return;

        const videoTracks = localStreamRef.current.getVideoTracks();
        if (videoTracks.length > 0) {
            videoTracks[0].enabled = !VideoToggleBtn; // Toggle video track
        }
    }, [VideoToggleBtn]);


    useEffect(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !micToggleBtn);
        }
    }, [micToggleBtn]);

    // Join room only when groupId and localStream are ready
    useEffect(() => {
        if (groupId && localStream && !joined) {
            handleJoinRoom();
        }
    }, [groupId, localStream, joined]);

    const iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "turn:relay.metered.ca:80", username: "free", credential: "free" },
        { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" }
    ];

    useEffect(() => {
        if (joined && localStream) {
            const setupWebRTC = async () => {
                try {
                    const stream = localStreamRef.current;
                    if (!stream) throw new Error("Local stream not initialized");

                    socket.emit('newProducer', {
                        roomId: groupId,
                        producerId: socket.id,
                        streamId: stream.id,
                        userName: profile?.user?.name || "Unknown User",
                    });

                    socket.on('existingProducers', async (producers) => {
                        for (const producer of producers) {
                            if (producer.producerId !== socket.id) {
                                await connectToProducer(producer.producerId, producer.userName);
                            }
                        }
                    });

                    socket.on('newProducerAvailable', async ({ producerId, userName }) => {
                        if (producerId !== socket.id) {
                            await connectToProducer(producerId, userName);
                        }
                    });

                    socket.on('offer', async ({ from, offer }) => {
                        try {
                            let peerConnection = peerConnections.current[from] || createPeerConnection(from);
                            localStreamRef.current.getTracks().forEach((track) => {
                                if (!peerConnection.getSenders().some((sender) => sender.track === track)) {
                                    peerConnection.addTrack(track, localStreamRef.current);
                                }
                            });
                            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                            const answer = await peerConnection.createAnswer();
                            answer.sdp = modifySdp(answer.sdp);
                            await peerConnection.setLocalDescription(answer);
                            socket.emit('answer', { to: from, answer });
                        } catch (e) {
                            console.error("Error in offer:", e);
                        }
                    });

                    socket.on('answer', async ({ from, answer }) => {
                        try {
                            const peerConnection = peerConnections.current[from];
                            if (peerConnection && peerConnection.signalingState === 'have-local-offer') {
                                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                            }
                        } catch (e) {
                            console.error("Error in answer:", e);
                        }
                    });

                    socket.on("iceCandidate", ({ from, candidate }) => {
                        console.log(`📥 Received ICE Candidate from ${from}:`, candidate);
                        if (!candidate || !candidate.candidate) return;
                        const peerConnection = peerConnections.current[from];
                        if (peerConnection) {
                            peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                                .catch((error) => console.error("Error adding ICE Candidate:", error));
                        }
                    });

                    socket.on("userDisconnected", ({ peerId }) => {
                        if (peerConnections.current[peerId]) {
                            peerConnections.current[peerId].close();
                            delete peerConnections.current[peerId];
                        }
                        setRemoteStreams((prev) => {
                            const updated = new Map(prev);
                            updated.delete(peerId);
                            return updated;
                        });
                    });
                } catch (err) {
                    console.error('Failed to set up WebRTC:', err);
                }
            };

            const connectToProducer = async (producerId, userName) => {
                console.log("🔵 connectToProducer:", producerId, userName);
                if (peerConnections.current[producerId]) return;
                const peerConnection = createPeerConnection(producerId, userName);
                localStreamRef.current.getTracks().forEach((track) => {
                    peerConnection.addTrack(track, localStreamRef.current);
                });
                const offer = await peerConnection.createOffer();
                offer.sdp = modifySdp(offer.sdp);
                await peerConnection.setLocalDescription(offer);
                socket.emit("offer", { roomId: groupId, offer, to: producerId });
            };

            const createPeerConnection = (peerId, userName) => {
                const peerConnection = new RTCPeerConnection({ iceServers });

                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit("iceCandidate", { to: peerId, candidate: event.candidate });
                    }
                };

                peerConnection.ontrack = (event) => {
                    if (event.streams && event.streams[0]) {
                        const fullStream = event.streams[0];
                        const videoTracks = fullStream.getVideoTracks();
                        const videoOnlyStream = new MediaStream(videoTracks);
                        setRemoteStreams((prev) => {
                            const updated = new Map(prev);
                            updated.set(peerId, { stream: videoOnlyStream, userName });
                            console.log("Updated remoteStreams:", Array.from(updated.entries()));
                            return updated;
                        });

                        const audioTracks = fullStream.getAudioTracks();
                        if (audioTracks.length > 0) {
                            const audioStream = new MediaStream(audioTracks);
                            const audioElement = new Audio();
                            audioElement.srcObject = audioStream;
                            audioElement.autoplay = true;
                            audioElement.volume = 1.0;
                            audioElement.play().catch(e => console.error("Remote audio play failed:", e));
                            document.body.appendChild(audioElement);
                            console.log(`Playing audio for ${peerId} (${userName})`);
                        }
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

            setupWebRTC();

            return () => {
                socket.off('offer');
                socket.off('answer');
                socket.off('iceCandidate');
                socket.off('newProducerAvailable');
                socket.off('existingProducers');
                socket.off('userDisconnected');

                Object.values(peerConnections.current).forEach((peerConnection) => peerConnection.close());
                peerConnections.current = {};

                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach((track) => track.stop());
                    localStreamRef.current = null;
                }
            };
        }
    }, [joined, groupId, localStream]); // Added localStream as dependency

    const toggleMic = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
                console.log(`Mic ${track.enabled ? 'enabled' : 'disabled'}`);
            });
        }
    };

    const toggleCamera = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
                console.log(`Camera ${track.enabled ? 'enabled' : 'disabled'}`);
            });
        }
    };

    const handleJoinRoom = () => {
        if (groupId) {
            socket.emit('joinRoom', { roomId: groupId });
            setJoined(true);
        }
    };

    const handleLeaveRoom = () => {
        socket.emit('leaveRoom', { roomId: groupId });
        setJoined(false);
    };

    return (
        <div >
            {joined ? (

                <ConnectedUsers
                    localVideoStream={localVideoStream}
                    remoteStreams={remoteStreams}

                />
            ) : (
                <div className="bg-gray-200 p-8 rounded-lg shadow-lg">
                    <h1 className="text-2xl mb-4">Joining Room...</h1>
                </div>
            )}

            <audio ref={localAudioRef} autoPlay />
        </div>
    );
};

export default RoomJoin;