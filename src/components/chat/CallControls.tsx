import { useEffect, useRef } from 'react';
import { PhoneCall, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';

interface CallControlsProps {
  chatId: string;
  peerUserId?: string;
}

export function CallControls({ chatId, peerUserId }: CallControlsProps): JSX.Element {
  const { inCall, startCall, endCall, localStream, remoteStream } = useWebRTCCall({ chatId });
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className='flex items-center gap-2'>
      {!inCall ? (
        <>
          <Button
            type='button'
            size='sm'
            variant='outline'
            disabled={!peerUserId}
            onClick={() => peerUserId && void startCall(peerUserId, false)}
          >
            <PhoneCall className='mr-1 h-4 w-4' /> Call
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            disabled={!peerUserId}
            onClick={() => peerUserId && void startCall(peerUserId, true)}
          >
            <Video className='mr-1 h-4 w-4' /> Video
          </Button>
        </>
      ) : (
        <Button type='button' size='sm' variant='destructive' onClick={() => endCall()}>
          <PhoneOff className='mr-1 h-4 w-4' /> End
        </Button>
      )}

      <video ref={localVideoRef} autoPlay muted playsInline className='hidden h-16 w-24 rounded-md border object-cover lg:block' />
      <video ref={remoteVideoRef} autoPlay playsInline className='hidden h-16 w-24 rounded-md border object-cover lg:block' />
    </div>
  );
}
