import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';

import { fetchUserProfile } from "../../Features/counter/getProfile";

// import IceServerProvider from './IceServerProvider';

const socket = io(import.meta.env.VITE_SOCKETIO, { transports: ["websocket"] });

const RoomJoin = () => {
      const dispatch = useDispatch();

    const [roomId, setRoomId] = useState('');
    const [joined, setJoined] = useState(false);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const [localStream, setLocalStream] = useState(null);
    const localVideoRef = useRef(null);
    const peerConnections = useRef({});
    const localStreamRef = useRef(null);
    const { profile } = useSelector((state) => state.user);
    const groupId = profile?.user?.groupId; // Target group ID
    console.log("grororor",groupId)

  useEffect(() => {

    dispatch(fetchUserProfile());
  }, [dispatch]);


    useEffect(() => {
        const setupLocalStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    setLocalStream(localVideoRef.current.srcObject);
                }
            } catch (err) {
                console.error('Failed to access camera/mic', err);
            }
        };

        setupLocalStream();
    }, []);


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
        if (joined) {
            const setupLocalStream = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    localStreamRef.current = stream;

                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }

                    socket.emit('newProducer', {
                        roomId,
                        producerId: socket.id,
                        streamId: stream.id,
                    });

                    socket.on('existingProducers', async (producers) => {
                        for (const producer of producers) {
                            if (producer.producerId !== socket.id) {
                                await connectToProducer(producer.producerId);
                            }
                        }
                    });

                    socket.on('newProducerAvailable', async ({ producerId }) => {
                        if (producerId !== socket.id) {
                            await connectToProducer(producerId);
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
                            console.error("error in offer", e);
                        }
                    });

                    socket.on('answer', async ({ from, answer }) => {
                        try {
                            const peerConnection = peerConnections.current[from];
                            if (peerConnection && peerConnection.signalingState === 'have-local-offer') {
                                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                            }
                        } catch (e) {
                            console.error("error in answer", e);
                        }
                    });

                    socket.on("iceCandidate", ({ from, candidate }) => {
                        console.log(`📥 Received ICE Candidate from ${from}:`, candidate);

                        if (!candidate || !candidate.candidate) {
                            console.warn("⚠️ Received an invalid ICE Candidate:", candidate);
                            return;
                        }

                        const peerConnection = peerConnections.current[from];
                        if (peerConnection) {
                            peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                                .then(() => console.log(`✅ ICE Candidate added successfully`))
                                .catch((error) => console.error("❌ Error adding ICE Candidate:", error));
                        } else {
                            console.warn(`⚠️ No PeerConnection found for ${from}`);
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
                            return new Map(updated);
                        });
                    });
                } catch (err) {
                    console.error('Failed to access camera/mic', err);
                }
            };

            const connectToProducer = async (producerId) => {
                if (peerConnections.current[producerId]) {
                    console.warn(`Already connected to producer: ${producerId}`);
                    return;
                }

                const peerConnection = createPeerConnection(producerId);

                localStreamRef.current.getTracks().forEach((track) => {
                    peerConnection.addTrack(track, localStreamRef.current);
                });

                const offer = await peerConnection.createOffer();
                offer.sdp = modifySdp(offer.sdp);
                await peerConnection.setLocalDescription(offer);
                socket.emit("offer", { roomId, offer, to: producerId });
            };

            const createPeerConnection = (peerId) => {
                const peerConnection = new RTCPeerConnection({ iceServers });

                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log(`📤 Sending ICE Candidate:`, event.candidate);
                        socket.emit("iceCandidate", { to: peerId, candidate: event.candidate });
                    } else {
                        console.log("ℹ️ No more ICE candidates");
                    }
                };

                peerConnection.ontrack = (event) => {
                    if (event.streams && event.streams[0]) {
                        setRemoteStreams((prev) => {
                            const updated = new Map(prev);
                            updated.set(peerId, event.streams[0]);
                            return updated;
                        });
                    }
                };

                peerConnection.oniceconnectionstatechange = () => {
                    console.log(`🔄 ICE Connection State Changed: ${peerConnection.iceConnectionState}`);
                };

                peerConnection.onsignalingstatechange = () => {
                    console.log(`🔄 Signaling State Changed: ${peerConnection.signalingState}`);
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
                socket.off('offer');
                socket.off('answer');
                socket.off('iceCandidate');
                socket.off('newProducerAvailable');
                socket.off('existingProducers');
                socket.off('peerLeft');

                Object.values(peerConnections.current).forEach((peerConnection) => peerConnection.close());
                peerConnections.current = {};

                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach((track) => track.stop());
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
        socket.emit('leaveRoom', { roomId });

        setJoined(false);
    };



    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
            {!joined ? (
                <div className="bg-gray-200 p-8 rounded-lg shadow-lg">

                    <h1 className="text-2xl mb-4">Join a Room</h1>
                    <input
                        type="text"
                        placeholder="Enter Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="p-2 rounded w-full text-black"
                    />
                    <button
                        onClick={handleJoinRoom}
                        className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Join Room
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4 p-4 w-full">

                    {Array.from(remoteStreams.entries()).map(([producerId, stream], index) => {
                        // console.log(`Stream ${index + 1}: Producer ID: ${producerId}, Stream ID: ${stream?.id}`);

                        return (
                            <div key={producerId} className="bg-gray-100 rounded-lg p-2">
                                <p className="text-center font-bold">User ID: {producerId}</p>
                                <video
                                    autoPlay
                                    ref={(video) => {
                                        if (video && video.srcObject !== stream) {

                                            video.srcObject = stream;
                                        }
                                    }}
                                    className="w-full h-auto rounded-lg"
                                    style={{ border: '2px solid red' }}
                                />
                            </div>
                        );
                    })}

                </div>
            )}
            <div className="bg-gray-100 rounded-lg p-2">
                <p className="text-center font-bold">Your Video</p>
                <video ref={localVideoRef} autoPlay muted className="w-full h-auto rounded-lg" style={{ border: '2px solid red' }} />
            </div>
        </div>


    );
};

export default RoomJoin;
