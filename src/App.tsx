import AgoraUIKit, { StylePropInterface } from "agora-react-uikit";
import AgoraRTC, {
  IAgoraRTCClient,
  ScreenVideoTrackInitConfig,
} from "agora-rtc-sdk-ng";
import { useEffect, useState } from "react";
import "./App.css";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
const CHANNEL = import.meta.env.VITE_AGORA_CHANNEL;
const TOKEN = import.meta.env.VITE_AGORA_TOKEN;

export default function App() {
  const [videoCall, setVideoCall] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenClient, setScreenClient] = useState<IAgoraRTCClient | null>(
    null
  );

  const rtcProps = {
    appId: APP_ID,
    channel: CHANNEL,
    token: TOKEN,
  };

  const callbacks = {
    EndCall: () => setVideoCall(false),
  };

  const styleProps: StylePropInterface = {
    theme: "dark",
    videoMode: { max: "contain" },
    remoteBtnStyles: {
      muteRemoteAudio: { backgroundColor: "rgba(255, 255, 255, 0.4)" },
      muteRemoteVideo: { backgroundColor: "rgba(255, 255, 255, 0.4)" },
    },
    localBtnStyles: {
      muteLocalAudio: { backgroundColor: "rgba(255, 255, 255, 0.4)" },
      muteLocalVideo: { backgroundColor: "rgba(255, 255, 255, 0.4)" },
      switchCamera: { backgroundColor: "rgba(255, 255, 255, 0.4)" },
      endCall: { backgroundColor: "rgba(255, 80, 80, 0.8)" },
    },
    maxViewStyles: {
      borderColor: "#fff",
      borderWidth: 4,
    },
  };

  async function startScreenShare() {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    await client.join(APP_ID, CHANNEL, TOKEN);

    const screenTrackConfig: ScreenVideoTrackInitConfig = {
      encoderConfig: "1080p_1",
      optimizationMode: "detail",
      displaySurface: "browser",
      systemAudio: "include",
      electronScreenSourceId: "",
      extensionId: "",
      scalabiltyMode: "",
      selfBrowserSurface: "include",
      surfaceSwitching: "exclude",
      // screenShareCaptureFrameRate: 30
    };

    let screenTrack;
    try {
      // Try to create screen video track with audio
      screenTrack = await AgoraRTC.createScreenVideoTrack(
        screenTrackConfig,
        "enable"
      );
    } catch (error) {
      console.error("Failed to get screen track with audio:", error);
      // If it fails, try without audio
      screenTrack = await AgoraRTC.createScreenVideoTrack(screenTrackConfig);
    }

    if (Array.isArray(screenTrack)) {
      // If screenTrack is an array, it contains both video and audio tracks
      await client.publish(screenTrack);
    } else {
      // If screenTrack is not an array, it's just the video track
      await client.publish(screenTrack);
    }

    setScreenClient(client);
    setIsScreenSharing(true);
  }

  async function stopScreenShare() {
    if (screenClient) {
      const localTracks = screenClient.localTracks;
      await screenClient.unpublish(localTracks);
      localTracks.forEach((track) => track.close());
      await screenClient.leave();
      setScreenClient(null);
      setIsScreenSharing(false);
    }
  }

  useEffect(() => {
    return () => {
      if (screenClient) {
        stopScreenShare();
      }
    };
  }, []);

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  return videoCall ? (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, overflow: "hidden" }}>
        <AgoraUIKit
          rtcProps={rtcProps}
          callbacks={callbacks}
          styleProps={styleProps}
        />
      </div>
      <div style={{ padding: "10px", textAlign: "center" }}>
        <button
          onClick={toggleScreenShare}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: isScreenSharing ? "green" : "white",
            color: isScreenSharing ? "white" : "black",
            border: "1px solid black",
            cursor: "pointer",
          }}
        >
          {isScreenSharing ? "Stop Screen Share" : "Start Screen Share"}
        </button>
      </div>
    </div>
  ) : (
    <h3 onClick={() => setVideoCall(true)}>Join</h3>
  );
}
