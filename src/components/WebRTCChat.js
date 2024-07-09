import React, { useContext, useEffect, useRef, useState } from 'react';
import SocketClientContext from "../context/SocketClientContext";

const WebRTCChat = ({ localID, remoteID }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localIdRef = useRef(null);
  const remoteIdRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [localPeer, setLocalPeer] = useState(null);

  const obj = useContext(SocketClientContext);
  const { socketClient: client } = obj;

  useEffect(() => {
    const iceServers = {
      iceServer: {
        urls: "stun:stun.l.google.com:19302"
      }
    };
    const peer = new RTCPeerConnection(iceServers);
    setLocalPeer(peer);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(error => {
        console.log(error);
      });

    return () => {
      // Cleanup
      if (localPeer) {
        localPeer.close();
      }
    };
  }, []);

  useEffect(() => {
    if (localStream && localPeer) {
      localStream.getTracks().forEach(track => {
        localPeer.addTrack(track, localStream);
      });

      localPeer.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      localPeer.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = {
            type: "candidate",
            lable: event.candidate.sdpMLineIndex,
            id: event.candidate.candidate,
          };
          console.log("Sending Candidate", candidate);
          client.publish({
            destination: "/app/candidate",
            body: {
              "toUser": remoteID,
              "fromUser": localID,
              "candidate": candidate
            }
          });
        }
      };

      client.subscribe('/user/' + localID + "/topic/call", (call) => {
        const remoteID = call.body;
        console.log("Remote ID: " + remoteID);

        localPeer.createOffer().then(description => {
          localPeer.setLocalDescription(description);
          console.log("Setting Description", description);
          client.publish({
            destination: "/app/offer",
            body: {
              "toUser": remoteID,
              "fromUser": localID,
              "offer": description
            }
          });
        });
      });

      client.subscribe('/user/' + localID + "/topic/offer", (offer) => {
        const o = JSON.parse(offer.body)["offer"];
        localPeer.setRemoteDescription(new RTCSessionDescription(o));
        localPeer.createAnswer().then(description => {
          localPeer.setLocalDescription(description);
          client.publish({
            destination: "/app/answer",
            body: {
              "toUser": remoteID,
              "fromUser": localID,
              "answer": description
            }
          });
        });
      });

      client.subscribe('/user/' + localID + "/topic/answer", (answer) => {
        const o = JSON.parse(answer.body)["answer"];
        localPeer.setRemoteDescription(new RTCSessionDescription(o));
      });

      client.subscribe('/user/' + localID + "/topic/candidate", (answer) => {
        const o = JSON.parse(answer.body)["candidate"];
        const iceCandidate = new RTCIceCandidate({
          sdpMLineIndex: o["lable"],
          candidate: o["id"],
        });
        localPeer.addIceCandidate(iceCandidate);
      });

      client.publish({
        destination: "/app/addUser",
        body: localID
      });
    }
  }, [localStream, localPeer, client]);

  const call = () => {
    client.publish({
      destination: "/app/call",
      body: {
        "callTo": remoteID,
        "callFrom": localID
      }
    });
  };

  const testConnection = () => {
    client.publish({
      destination: "/app/testServer",
      body: "Test Server"
    });
  };

  return (
    <div>
      <h1>WebRTC Test</h1>
      <video ref={localVideoRef} autoPlay muted style={{ width: '400px', height: '400px', backgroundColor: 'black' }}></video>
      <video ref={remoteVideoRef} autoPlay style={{ width: '400px', height: '400px', backgroundColor: 'black' }}></video>
      <fieldset>
        <input type="text" ref={localIdRef} placeholder="Enter Your ID" defaultValue={localID} />
      </fieldset>
      <fieldset>
        <input type="text" ref={remoteIdRef} placeholder="Enter Remote ID" defaultValue={remoteID} />
        <button onClick={call}>Call</button>
      </fieldset>
      <button onClick={testConnection}>Test Connection</button>
    </div>
  );
};

export default WebRTCChat;
