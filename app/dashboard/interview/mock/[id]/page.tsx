'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { X, Clock, AlertTriangle, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import {
  LiveKitRoom,
  VideoTrack,
  useLocalParticipant,
  useTracks,
  RoomAudioRenderer,
  useVoiceAssistant,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

interface MockInterviewPageProps {
  params: Promise<{ id: string }>;
}

// Component to render the AI agent's video using the voice assistant hook
function AgentVideo() {
  // useVoiceAssistant automatically handles avatar worker track association
  const { agent, videoTrack, audioTrack, state } = useVoiceAssistant();

  // Debug logging
  useEffect(() => {
    console.log('[AgentVideo] Voice assistant state:', state);
    console.log('[AgentVideo] Agent:', agent ? {
      identity: agent.identity,
      name: agent.name,
    } : null);
    console.log('[AgentVideo] Video track:', videoTrack ? {
      source: videoTrack.source,
      trackName: videoTrack.publication?.trackName,
      sid: videoTrack.publication?.trackSid,
    } : null);
    console.log('[AgentVideo] Audio track:', audioTrack ? 'present' : 'missing');
  }, [agent, videoTrack, audioTrack, state]);

  // Show connecting state
  if (state === 'connecting' || state === 'initializing' || !agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div className="w-32 h-32 rounded-full bg-slate-700 mx-auto flex items-center justify-center">
              <Video className="w-12 h-12 text-slate-500" />
            </div>
          </div>
          <p className="text-gray-400 font-medium">Connecting to interviewer...</p>
          <p className="text-gray-500 text-sm mt-2">State: {state || 'initializing'}</p>
        </div>
      </div>
    );
  }

  // Agent connected but no video track (audio-only agent or avatar loading)
  if (!videoTrack) {
    const isSpeaking = state === 'speaking';
    const isThinking = state === 'thinking';
    const isListening = state === 'listening';

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          {/* Animated avatar placeholder */}
          <div className={`relative w-40 h-40 mx-auto mb-6 ${isSpeaking ? 'animate-pulse' : ''}`}>
            {/* Outer ring animation when speaking */}
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-40 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-30 animate-ping animation-delay-150" />
              </>
            )}
            {/* Thinking animation */}
            {isThinking && (
              <div className="absolute inset-0 rounded-full border-4 border-purple-400 border-t-transparent animate-spin" />
            )}
            {/* Main avatar circle */}
            <div className={`relative w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ${isListening ? 'ring-4 ring-green-400/50' : ''}`}>
              <span className="text-5xl font-bold text-white">AI</span>
            </div>
          </div>

          <p className="text-white text-xl font-bold mb-2">{agent.name || 'AI Interviewer'}</p>

          {/* State indicator */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            isSpeaking ? 'bg-purple-500/20 text-purple-300' :
            isThinking ? 'bg-yellow-500/20 text-yellow-300' :
            isListening ? 'bg-green-500/20 text-green-300' :
            'bg-slate-700 text-gray-400'
          }`}>
            {isSpeaking && (
              <>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                Speaking...
              </>
            )}
            {isThinking && (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                Thinking...
              </>
            )}
            {isListening && (
              <>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Listening to you...
              </>
            )}
            {!isSpeaking && !isThinking && !isListening && (
              <>
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Ready
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render the avatar video track
  return (
    <VideoTrack
      trackRef={videoTrack}
      className="w-full h-full object-cover"
    />
  );
}

// Component for local user controls
function LocalControls({ onDisconnect }: { onDisconnect: () => void }) {
  const { localParticipant } = useLocalParticipant();
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCamEnabled, setIsCamEnabled] = useState(true);

  const toggleMic = async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(!isMicEnabled);
      setIsMicEnabled(!isMicEnabled);
    }
  };

  const toggleCam = async () => {
    if (localParticipant) {
      await localParticipant.setCameraEnabled(!isCamEnabled);
      setIsCamEnabled(!isCamEnabled);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleMic}
        className={`p-3 rounded-full transition-colors ${
          isMicEnabled
            ? 'bg-slate-700 text-white hover:bg-slate-600'
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
        title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>
      <button
        onClick={toggleCam}
        className={`p-3 rounded-full transition-colors ${
          isCamEnabled
            ? 'bg-slate-700 text-white hover:bg-slate-600'
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
        title={isCamEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {isCamEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>
      <button
        onClick={onDisconnect}
        className="px-4 py-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
      >
        <X className="w-5 h-5" />
        <span className="hidden md:inline">End Interview</span>
      </button>
    </div>
  );
}

// Local video preview in corner
function LocalVideoPreview() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const { localParticipant } = useLocalParticipant();

  const localVideoTrack = tracks.find(
    (track) => track.participant?.identity === localParticipant?.identity
  );

  if (!localVideoTrack) {
    return (
      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
        <VideoOff className="w-8 h-8 text-slate-500" />
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={localVideoTrack}
      className="w-full h-full object-cover scale-x-[-1]"
    />
  );
}

export default function MockInterviewPage({ params }: MockInterviewPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { aiVideoCoach } = useFlags();

  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Resolve params and extract LiveKit credentials from URL
  useEffect(() => {
    params.then((p) => setInterviewId(p.id));

    const urlParam = searchParams.get('url');
    const tokenParam = searchParams.get('token');

    if (urlParam && tokenParam) {
      try {
        setLivekitUrl(atob(urlParam));
        setLivekitToken(atob(tokenParam));
      } catch {
        setConnectionError('Invalid session credentials');
      }
    } else {
      setConnectionError('Missing session credentials. Please start a new interview.');
    }
  }, [params, searchParams]);

  // Redirect if feature flag is disabled
  useEffect(() => {
    if (aiVideoCoach === false) {
      router.push('/dashboard/interview');
    }
  }, [aiVideoCoach, router]);

  // Timer for elapsed time
  useEffect(() => {
    if (!hasStarted) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle exit with confirmation
  const handleExitClick = () => {
    if (hasStarted) {
      setShowExitConfirm(true);
    } else {
      router.push('/dashboard/interview');
    }
  };

  const handleConfirmExit = useCallback(async () => {
    if (interviewId) {
      try {
        await fetch(`/api/mock-interviews/${interviewId}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ early_exit: true }),
        });
      } catch (err) {
        console.error('Error ending interview:', err);
      }
      // Redirect to feedback page instead of interview prep
      router.push(`/dashboard/interview/mock/${interviewId}/feedback`);
    } else {
      router.push('/dashboard/interview');
    }
  }, [interviewId, router]);

  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  const handleStartInterview = () => {
    setIsReady(true);
    setHasStarted(true);
  };

  const handleRoomConnected = () => {
    setIsConnected(true);
  };

  const handleRoomDisconnected = useCallback(() => {
    setIsConnected(false);
    // If disconnected unexpectedly after starting, redirect to feedback page
    if (hasStarted && !showExitConfirm && interviewId) {
      // Call end API then redirect
      fetch(`/api/mock-interviews/${interviewId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ early_exit: false }),
      }).catch(console.error);
      router.push(`/dashboard/interview/mock/${interviewId}/feedback`);
    }
  }, [hasStarted, showExitConfirm, interviewId, router]);

  // Feature flag loading state
  if (aiVideoCoach === undefined) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Connection error state
  if (connectionError) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-6">{connectionError}</p>
          <button
            onClick={() => router.push('/dashboard/interview')}
            className="px-6 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Pre-interview instructions screen
  if (!isReady) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between p-4 md:p-6">
          <button
            onClick={handleExitClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="hidden md:inline font-medium">Exit</span>
          </button>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
                Ready for Your Mock Interview?
              </h1>
              <p className="text-lg text-gray-400 max-w-lg mx-auto">
                You&apos;ll practice behavioral interview questions with our AI interviewer for up to 30 minutes.
              </p>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-8">
              <h2 className="text-lg font-bold text-white mb-4">Before you begin:</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-400 text-sm font-bold">1</span>
                  </div>
                  <span className="text-gray-300">
                    <strong className="text-white">Allow camera &amp; microphone access</strong> when prompted
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-400 text-sm font-bold">2</span>
                  </div>
                  <span className="text-gray-300">
                    <strong className="text-white">Find a quiet space</strong> with good lighting
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-400 text-sm font-bold">3</span>
                  </div>
                  <span className="text-gray-300">
                    <strong className="text-white">Use the STAR method</strong> for behavioral questions (Situation, Task, Action, Result)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-400 text-sm font-bold">4</span>
                  </div>
                  <span className="text-gray-300">
                    <strong className="text-white">Speak naturally</strong> - the AI interviewer will respond conversationally
                  </span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <button
                onClick={handleStartInterview}
                className="px-10 py-5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.4)] font-black text-white text-xl transition-all duration-200"
              >
                Start Interview
              </button>
              <p className="mt-4 text-gray-500 text-sm">
                You can exit at any time by clicking the X button
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full-screen interview view with LiveKit
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
      {livekitUrl && livekitToken ? (
        <LiveKitRoom
          serverUrl={livekitUrl}
          token={livekitToken}
          connect={true}
          video={true}
          audio={true}
          onConnected={handleRoomConnected}
          onDisconnected={handleRoomDisconnected}
          className="flex flex-col h-full"
        >
          {/* Room audio renderer for agent's voice */}
          <RoomAudioRenderer />

          {/* Header Bar */}
          <div className="flex items-center justify-between p-3 md:p-4 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 border border-slate-600">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="font-mono font-bold text-white">{formatTime(elapsedTime)}</span>
              <span className="hidden md:inline text-gray-400 text-sm">/ 30:00</span>
            </div>

            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                  Connecting...
                </span>
              )}
            </div>
          </div>

          {/* Video area */}
          <div className="flex-1 relative bg-slate-900">
            {/* Agent video (main view) */}
            <div className="absolute inset-0">
              <AgentVideo />
            </div>

            {/* Local video preview (picture-in-picture) */}
            <div className="absolute bottom-4 right-4 w-48 h-36 md:w-64 md:h-48 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl">
              <LocalVideoPreview />
            </div>
          </div>

          {/* Control bar */}
          <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-center">
            <LocalControls onDisconnect={handleExitClick} />
          </div>
        </LiveKitRoom>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400 font-medium">Initializing video session...</p>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-yellow-500/20">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                </div>
                <h2 className="text-xl font-bold text-white">End Interview Early?</h2>
              </div>
              <p className="text-gray-400 mb-6">
                Are you sure you want to end this mock interview? Your progress will be saved, but the session will be marked as incomplete.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelExit}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-600 font-bold text-gray-300 hover:bg-slate-700 transition-colors"
                >
                  Continue Interview
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/50 font-bold text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  End Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
