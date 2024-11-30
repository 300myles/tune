import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:8006");

const VideoCallApp = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  

  useEffect(() => {
    socket.on("connection", () => setIsConnected(true));

    socket.on("callOffer", async ({ offer, from }) => {
      if (!peerConnection.current) createPeerConnection();

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("callAnswer", { answer, target: from });
    });

    socket.on("callAnswer", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (candidate) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => socket.disconnect();
  }, []);

  const createPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          target: "target-socket-id", // Replace with actual target ID
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
  };

  const startCall = async () => {
    createPeerConnection();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    stream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, stream);
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("offer", { offer, target: "target-socket-id" }); // Replace with target ID
    setIsCalling(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.videoContainer}>
        <div style={styles.localVideoWrapper}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={styles.localVideo}
          />
          <p style={styles.label}>You</p>
        </div>
        <div style={styles.remoteVideoWrapper}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={styles.remoteVideo}
          />
          <p style={styles.label}>Caller</p>
        </div>
      </div>

      <div style={styles.controls}>
        {!isCalling ? (
          <button style={styles.button} onClick={startCall}>
            Start Call
          </button>
        ) : (
          <p style={styles.status}>Calling...</p>
        )}
        <p style={styles.connectionStatus}>
          {isConnected ? "Connected" : "Disconnected"}
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    height: "100vh",
    color: "#fff",
  },
  videoContainer: {
    display: "flex",
    flexDirection: "row",
    gap: "10px",
    justifyContent: "center",
    width: "80%",
    height: "70%",
  },
  localVideoWrapper: {
    position: "relative",
    width: "45%",
    border: "2px solid #4caf50",
    borderRadius: "10px",
    overflow: "hidden",
  },
  localVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  remoteVideoWrapper: {
    position: "relative",
    width: "45%",
    border: "2px solid #f44336",
    borderRadius: "10px",
    overflow: "hidden",
  },
  remoteVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  label: {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "#fff",
    padding: "5px 10px",
    borderRadius: "5px",
    fontSize: "14px",
  },
  controls: {
    marginTop: "20px",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#4caf50",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  buttonHover: {
    backgroundColor: "#45a049",
  },
  status: {
    fontSize: "18px",
    fontWeight: "bold",
  },
  connectionStatus: {
    marginTop: "10px",
    fontSize: "14px",
  },
};

export default VideoCallApp;
