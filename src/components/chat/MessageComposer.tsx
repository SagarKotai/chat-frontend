import { useMemo, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
import { Paperclip, SendHorizonal, SmilePlus, Mic, StopCircle } from 'lucide-react';
import { useGetSmartRepliesQuery, useSendMessageMutation } from '@/services/messageApi';
import { socketManager } from '@/sockets/socketManager';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setDraft, setVoiceRecording } from '@/features/message/messageUiSlice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGetChatByIdQuery } from '@/services/chatApi';
import { encryptForPublicKey } from '@/lib/e2ee';

interface MessageComposerProps {
  chatId: string;
}

export function MessageComposer({ chatId }: MessageComposerProps): JSX.Element {
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const draft = useAppSelector((state) => state.messageUi.draftByChatId[chatId] ?? '');
  const isRecording = useAppSelector((state) => state.messageUi.voiceRecording);
  const userId = useAppSelector((state) => state.auth.user?._id);
  const { data: chatData } = useGetChatByIdQuery(chatId);
  const dispatch = useAppDispatch();
  const [sendMessage, { isLoading }] = useSendMessageMutation();
  const { data: smartRepliesData } = useGetSmartRepliesQuery({ chatId });
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const recipientIds = useMemo(() => {
    const participants = chatData?.data.participants ?? [];
    return participants.map((p) => p._id).filter((id) => id !== userId);
  }, [chatData, userId]);

  const directPeer = useMemo(() => {
    const chat = chatData?.data;
    if (!chat || chat.isGroupChat) return undefined;
    return chat.participants.find((participant) => participant._id !== userId);
  }, [chatData, userId]);

  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: 'audio/webm' });
        const voiceFile = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(voiceFile);

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };

      recorder.start();
      dispatch(setVoiceRecording(true));
    } catch {
      toast.error('Microphone permission denied or unavailable');
    }
  };

  const stopRecording = (): void => {
    mediaRecorderRef.current?.stop();
    dispatch(setVoiceRecording(false));
  };

  const submit = async (): Promise<void> => {
    if (!draft.trim() && !selectedFile) return;

    try {
      let contentToSend = draft;
      let encryptedFor: Record<string, string> | undefined;
      let isEncrypted = false;

      if (draft.trim() && directPeer?.publicKey && userId) {
        const ownPublicKey = chatData?.data.participants.find((participant) => participant._id === userId)
          ?.publicKey;

        if (ownPublicKey) {
          encryptedFor = {
            [directPeer._id]: await encryptForPublicKey(directPeer.publicKey, draft),
            [userId]: await encryptForPublicKey(ownPublicKey, draft),
          };
          contentToSend = '';
          isEncrypted = true;
        }
      }

      const res = await sendMessage({
        chatId,
        content: contentToSend,
        file: selectedFile,
        isEncrypted,
        encryptedFor,
      }).unwrap();

      socketManager.emitMessageNew(chatId, res.data, recipientIds);
      dispatch(setDraft({ chatId, text: '' }));
      setSelectedFile(undefined);
      setShowEmoji(false);
      socketManager.emitTypingStop(chatId);
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message ?? 'Failed to send message';
      toast.error(message);
    }
  };

  return (
    <div className='relative rounded-xl border bg-card p-2'>
      {showEmoji && (
        <div className='absolute bottom-20 left-2 z-20'>
          <EmojiPicker
            width={300}
            lazyLoadEmojis
            onEmojiClick={(emojiData) => dispatch(setDraft({ chatId, text: draft + emojiData.emoji }))}
          />
        </div>
      )}

      <div className='flex items-end gap-2'>
        <input
          ref={fileRef}
          type='file'
          hidden
          onChange={(e) => setSelectedFile(e.target.files?.[0])}
          accept='image/*,video/*,audio/*,.pdf,.doc,.docx,.zip'
        />

        <Button size='icon' variant='ghost' onClick={() => setShowEmoji((v) => !v)}>
          <SmilePlus className='h-4 w-4' />
        </Button>

        <Button size='icon' variant='ghost' onClick={() => fileRef.current?.click()}>
          <Paperclip className='h-4 w-4' />
        </Button>

        <Textarea
          value={draft}
          onChange={(e) => {
            dispatch(setDraft({ chatId, text: e.target.value }));
            socketManager.emitTypingStart(chatId);
          }}
          onBlur={() => socketManager.emitTypingStop(chatId)}
          placeholder='Type a message...'
          className='min-h-[44px] max-h-32 resize-none'
        />

        <Button
          size='icon'
          variant={isRecording ? 'destructive' : 'ghost'}
          onClick={() => (isRecording ? stopRecording() : void startRecording())}
          title='Record voice note'
        >
          {isRecording ? <StopCircle className='h-4 w-4' /> : <Mic className='h-4 w-4' />}
        </Button>

        <Button size='icon' onClick={() => void submit()} disabled={isLoading}>
          <SendHorizonal className='h-4 w-4' />
        </Button>
      </div>

      <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
        <div>{selectedFile ? `Attachment: ${selectedFile.name}` : 'No attachment'}</div>
        <div>{isRecording ? 'Recording voice note...' : 'Voice note ready'}</div>
      </div>

      {(smartRepliesData?.data?.length ?? 0) > 0 && (
        <div className='mt-2 flex flex-wrap gap-2'>
          {smartRepliesData?.data.slice(0, 3).map((reply) => (
            <Button
              key={reply}
              type='button'
              size='sm'
              variant='outline'
              className='h-7 text-xs'
              onClick={() => dispatch(setDraft({ chatId, text: reply }))}
            >
              {reply}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
