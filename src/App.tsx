import AgoraUIKit, { layout } from "agora-react-uikit";
import "agora-react-uikit/dist/index.css";
import AgoraRTC, {
  IAgoraRTCClient,
  ScreenVideoTrackInitConfig,
} from "agora-rtc-sdk-ng";
import React, { CSSProperties, useEffect, useState } from "react";
const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
const AGORA_CHANNEL = import.meta.env.VITE_AGORA_CHANNEL;
const AGORA_TOKEN = import.meta.env.VITE_AGORA_TOKEN;

const App: React.FunctionComponent = () => {
  const [videocall, setVideocall] = useState(true);
  const [isHost, setHost] = useState(true);
  const [isPinned, setPinned] = useState(false);
  const [username, setUsername] = useState("");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenClient, setScreenClient] = useState<IAgoraRTCClient | null>(
    null
  );

  const rtcProps = {
    appId: APP_ID,
    channel: AGORA_CHANNEL,
    token: AGORA_TOKEN,
    role: isHost ? "host" : "audience",
    layout: isPinned ? layout.pin : layout.grid,
    enableScreensharing: true,
    disableRtm: false,
  };

  const startScreenShare = async () => {
    // Create a new Agora client for screen sharing
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    try {
      // Attempt to join the channel
      await client.join(rtcProps.appId, rtcProps.channel, rtcProps.token);

      // Configuration for screen sharing
      const screenTrackConfig: ScreenVideoTrackInitConfig = {
        encoderConfig: "1080p_1",
        optimizationMode: "detail",
        // displaySurface: "browser",
        // systemAudio: "include",
      };

      // Attempt to create a screen sharing track
      let screenTrack;
      try {
        screenTrack = await AgoraRTC.createScreenVideoTrack(
          screenTrackConfig,
          "enable"
        );
      } catch (error) {
        console.error("Failed to get screen track with audio:", error);
        screenTrack = await AgoraRTC.createScreenVideoTrack(screenTrackConfig);
      }

      // If screenTrack is null or undefined, it means the user cancelled screen sharing
      if (!screenTrack) {
        console.error(
          "No screen track created. User might have cancelled screen sharing."
        );
        await client.leave(); // Leave the channel if no track is created
        return;
      }

      // Publish the screen track
      await client.publish(screenTrack);
      setScreenClient(client);
      setIsScreenSharing(true);
    } catch (error) {
      console.error("Error starting screen share:", error);
      // Ensure client leaves the channel if any error occurs
      await client.leave();
    }
  };

  const stopScreenShare = async () => {
    if (screenClient) {
      const localTracks = screenClient.localTracks;
      await screenClient.unpublish(localTracks);
      localTracks.forEach((track) => track.close());
      await screenClient.leave();
      setScreenClient(null);
      setIsScreenSharing(false);
    }
  };

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  useEffect(() => {
    return () => {
      if (screenClient) {
        stopScreenShare();
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.videoContainer}>
        <h1 style={styles.heading}>Agora React Web UI Kit</h1>
        {videocall ? (
          <>
            <div style={styles.nav}>
              {/* <p style={{ fontSize: 20, width: 200 }}>
                You're {isHost ? "a host" : "an audience"}
              </p>
              <p style={styles.btn} onClick={() => setHost(!isHost)}>
                Change Role
              </p> */}
              <p style={styles.btn} onClick={() => setPinned(!isPinned)}>
                Change Layout
              </p>
              <p style={styles.btn} onClick={toggleScreenShare}>
                {isScreenSharing ? "Stop Screen Share" : "Start Screen Share"}
              </p>
            </div>
            <AgoraUIKit
              rtcProps={{
                appId: APP_ID,
                channel: AGORA_CHANNEL,
                token: AGORA_TOKEN,
                role: isHost ? "host" : "audience",
                layout: isPinned ? layout.pin : layout.grid,
                // enableScreensharing: true,
                disableRtm: false,
              }}
              rtmProps={{ username: username || "user", displayUsername: true }}
              callbacks={{
                EndCall: () => setVideocall(false),
              }}
            />
          </>
        ) : (
          <div style={styles.nav}>
            <input
              style={styles.input}
              placeholder="nickname"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            />
            <h3 style={styles.btn} onClick={() => setVideocall(true)}>
              Start Call
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flex: 1,
    backgroundColor: "#007bff22",
  },
  heading: { textAlign: "center" as const, marginBottom: 0 },
  videoContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  } as CSSProperties,
  nav: { display: "flex", justifyContent: "space-around" },
  btn: {
    backgroundColor: "#007bff",
    cursor: "pointer",
    borderRadius: 5,
    padding: "4px 8px",
    color: "#ffffff",
    fontSize: 20,
  },
  input: { display: "flex", height: 24, alignSelf: "center" } as CSSProperties,
};

export default App;
