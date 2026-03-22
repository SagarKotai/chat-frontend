import { useCallback, useEffect, useRef, useState } from 'react';
import { socketManager } from '@/sockets/socketManager';
import { env } from '@/lib/env';

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    ...(env.turnUrl
      ? [
          {
            urls: env.turnUrl,
            username: env.turnUsername,
            credential: env.turnCredential,
          },
        ]
      : []),
  ],
};

interface UseWebRTCCallOptions {
  chatId: string;
}

export const useWebRTCCall = ({ chatId }: UseWebRTCCallOptions) => {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [inCall, setInCall] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setInCall(false);
    setTargetUserId(null);
  }, []);

  const createPeerConnection = useCallback(
    (peerUserId: string) => {
      const peer = new RTCPeerConnection(rtcConfig);

      peer.onicecandidate = (event) => {
        if (!event.candidate) return;
        socketManager.emitCallIceCandidate({
          targetUserId: peerUserId,
          chatId,
          candidate: event.candidate.toJSON(),
        });
      };

      peer.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) setRemoteStream(stream);
      };

      peer.oniceconnectionstatechange = () => {
        const state = peer.iceConnectionState;
        const shouldRestart =
          (state === 'failed' || state === 'disconnected') &&
          !!peerUserId &&
          peer.signalingState !== 'closed';

        if (!shouldRestart) return;

        void (async () => {
          try {
            const restartOffer = await peer.createOffer({ iceRestart: true });
            await peer.setLocalDescription(restartOffer);
            socketManager.emitCallOffer({
              targetUserId: peerUserId,
              chatId,
              sdp: restartOffer,
              video: Boolean(localStreamRef.current?.getVideoTracks().length),
            });
          } catch {
            // Best-effort reconnect path.
          }
        })();
      };

      peerRef.current = peer;
      setTargetUserId(peerUserId);
      return peer;
    },
    [chatId],
  );

  const startCall = useCallback(
    async (peerUserId: string, video: boolean) => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const peer = createPeerConnection(peerUserId);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socketManager.emitCallOffer({
        targetUserId: peerUserId,
        chatId,
        sdp: offer,
        video,
      });

      setInCall(true);
    },
    [chatId, createPeerConnection],
  );

  const endCall = useCallback(() => {
    if (targetUserId) {
      socketManager.emitCallEnd({ targetUserId, chatId });
    }
    cleanup();
  }, [chatId, cleanup, targetUserId]);

  useEffect(() => {
    socketManager.onCallOffer(async (payload) => {
      if (payload.chatId !== chatId) return;

      const accept = window.confirm(`Incoming ${payload.video ? 'video' : 'audio'} call. Accept?`);
      if (!accept) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: payload.video,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const peer = createPeerConnection(payload.fromUserId);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socketManager.emitCallAnswer({
        targetUserId: payload.fromUserId,
        chatId,
        sdp: answer,
      });

      setInCall(true);
    });

    socketManager.onCallAnswer(async (payload) => {
      if (payload.chatId !== chatId) return;
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      setInCall(true);
    });

    socketManager.onCallIceCandidate(async (payload) => {
      if (payload.chatId !== chatId) return;
      if (!peerRef.current) return;
      await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
    });

    socketManager.onCallEnd((payload) => {
      if (payload.chatId !== chatId) return;
      cleanup();
    });

    return () => {
      cleanup();
    };
  }, [chatId, cleanup, createPeerConnection]);

  return {
    inCall,
    localStream,
    remoteStream,
    startCall,
    endCall,
  };
};
