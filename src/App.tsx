import AgoraUIKit, { StylePropInterface } from "agora-react-uikit";
import "agora-react-uikit/dist/index.css";
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
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
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
    LocalMuteAudio: (muted: boolean) => {
      if (localAudioTrack) {
        muted ? localAudioTrack.mute() : localAudioTrack.unmute();
      }
    },
    LocalMuteVideo: (muted: boolean) => {
      if (localVideoTrack) {
        muted ? localVideoTrack.mute() : localVideoTrack.unmute();
      }
    },
    UserJoined: (user: any) => {
      console.log("User joined:", user);
    },
    UserLeft: (user: any) => {
      console.log("User left:", user);
    },
  };

  const styleProps: StylePropInterface = {
    theme: "dark",
    videoMode: { max: "contain" },
    remoteBtnStyles: {
      muteRemoteAudio: {
        // backgroundColor: "transparent",
        display: "none",
      },
      muteRemoteVideo: {
        // backgroundColor: "transparent",
        display: "none",
      },
    },
    localBtnStyles: {
      muteLocalAudio: {
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        display: "none",
      },
      muteLocalVideo: {
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        display: "none",
      },
      switchCamera: {
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        display: "none",
      },
      endCall: { backgroundColor: "blue", display: "none" },
      screenshare: { border: "10px solid red" },
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
      // screenShareCaptureFrameRate: ""
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

    // if (Array.isArray(screenTrack)) {
    //   // If screenTrack is an array, it contains both video and audio tracks
    //   await client.publish(screenTrack);
    // } else {
    //   // If screenTrack is not an array, it's just the video track
    //   await client.publish(screenTrack);
    // }
    await client.publish(screenTrack);
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

  const toggleAudio = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!localAudioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(!localVideoTrack.enabled);
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
      <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
        <AgoraUIKit
          rtcProps={rtcProps}
          callbacks={callbacks}
          styleProps={styleProps}
        />
      </div>
      <div className="controls-container">
        <button onClick={toggleAudio} className="control-btn">
          {localAudioTrack?.enabled ? "Mute Audio" : "Unmute Audio"}
        </button>
        <button onClick={toggleVideo} className="control-btn">
          {localVideoTrack?.enabled ? "Disable Video" : "Enable Video"}
        </button>
        <button onClick={toggleScreenShare} className="control-btn">
          {isScreenSharing ? "Stop Screen Share" : "Start Screen Share"}
        </button>
        <button
          onClick={() => setVideoCall(false)}
          className="control-btn end-call"
        >
          End Call
        </button>
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
