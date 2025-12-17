'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { X, Clock, AlertTriangle, Mic, MicOff, Video, VideoOff, Sparkles } from 'lucide-react';
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
        className="px-4 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors font-medium flex items-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        <span className="hidden md:inline">Finish & Get Feedback</span>
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
  const [hasStarted, setHasStarted] = useState(true); // Interview starts immediately when credentials are present
  const [interviewMode, setInterviewMode] = useState<'full' | 'quick_question' | 'job_specific'>('full');
  const [sessionEnded, setSessionEnded] = useState(false); // Track when session times out
  const [isEndingSession, setIsEndingSession] = useState(false); // Track loading state for ending session

  // Max duration based on mode: 30 min for full, 20 min for job-specific, 5 min for quick question
  const maxDurationSeconds = interviewMode === 'quick_question' ? 5 * 60 : interviewMode === 'job_specific' ? 20 * 60 : 30 * 60;

  // Resolve params and extract LiveKit credentials from URL
  useEffect(() => {
    params.then((p) => setInterviewId(p.id));

    // Check for credentials parameter (base64 encoded JSON)
    const credentialsParam = searchParams.get('credentials');
    const modeParam = searchParams.get('mode');

    if (modeParam === 'quick_question') {
      setInterviewMode('quick_question');
    } else if (modeParam === 'job_specific') {
      setInterviewMode('job_specific');
    }

    if (credentialsParam) {
      try {
        const decoded = JSON.parse(atob(credentialsParam));
        setLivekitUrl(decoded.url);
        setLivekitToken(decoded.token);
      } catch {
        setConnectionError('Invalid session credentials');
      }
    } else {
      // Fallback to legacy URL params
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
    }
  }, [params, searchParams]);

  // Redirect if feature flag is disabled
  useEffect(() => {
    if (aiVideoCoach === false) {
      router.push('/dashboard/interview');
    }
  }, [aiVideoCoach, router]);

  // Ref to track elapsed time for timeout check (avoids nested setState)
  const elapsedTimeRef = useRef(0);

  // Timer for elapsed time - starts when connected
  useEffect(() => {
    if (!isConnected || sessionEnded) return;

    const interval = setInterval(() => {
      elapsedTimeRef.current += 1;
      setElapsedTime(elapsedTimeRef.current);

      // Auto-end for quick questions after max duration
      if (interviewMode === 'quick_question' && elapsedTimeRef.current >= maxDurationSeconds) {
        setSessionEnded(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, interviewMode, maxDurationSeconds, sessionEnded]);

  // Handle session timeout - separate effect to avoid setState during render
  useEffect(() => {
    if (sessionEnded && interviewId) {
      // End the interview and redirect
      fetch(`/api/mock-interviews/${interviewId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ early_exit: false }),
      })
        .catch(console.error)
        .finally(() => {
          router.push(`/dashboard/interview/mock/${interviewId}/feedback`);
        });
    }
  }, [sessionEnded, interviewId, router]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle exit with confirmation
  const handleExitClick = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = useCallback(async () => {
    setIsEndingSession(true);
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
            <div className="flex items-center gap-3">
              {/* Mode indicator for quick questions */}
              {interviewMode === 'quick_question' && (
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wide">
                  Quick Practice
                </span>
              )}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 border border-slate-600">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="font-mono font-bold text-white">{formatTime(elapsedTime)}</span>
                <span className="hidden md:inline text-gray-400 text-sm">/ {formatTime(maxDurationSeconds)}</span>
              </div>
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
                <div className="p-2 rounded-xl bg-purple-500/20">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Ready for your feedback?
                </h2>
              </div>
              <p className="text-gray-400 mb-6">
                You&apos;ll receive AI-powered evaluation on your performance. You can continue practicing or get your results now.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelExit}
                  disabled={isEndingSession}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-600 font-bold text-gray-300 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keep Practicing
                </button>
                <button
                  onClick={handleConfirmExit}
                  disabled={isEndingSession}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-white hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isEndingSession ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Getting Feedback...
                    </>
                  ) : (
                    'Get My Feedback'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
