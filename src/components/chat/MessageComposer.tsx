import { useMemo, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
import { Paperclip, SendHorizonal, SmilePlus, Mic, StopCircle } from 'lucide-react';
import { useSendMessageMutation } from '@/services/messageApi';
import { socketManager } from '@/sockets/socketManager';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setDraft, setVoiceRecording } from '@/features/message/messageUiSlice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGetChatByIdQuery } from '@/services/chatApi';

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
  const fileRef = useRef<HTMLInputElement>(null);

  const recipientIds = useMemo(() => {
    const participants = chatData?.data.participants ?? [];
    return participants.map((p) => p._id).filter((id) => id !== userId);
  }, [chatData, userId]);

  const submit = async (): Promise<void> => {
    if (!draft.trim() && !selectedFile) return;

    try {
      const res = await sendMessage({
        chatId,
        content: draft,
        file: selectedFile,
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
          onClick={() => dispatch(setVoiceRecording(!isRecording))}
          title='Voice message UI'
        >
          {isRecording ? <StopCircle className='h-4 w-4' /> : <Mic className='h-4 w-4' />}
        </Button>

        <Button size='icon' onClick={() => void submit()} disabled={isLoading}>
          <SendHorizonal className='h-4 w-4' />
        </Button>
      </div>

      <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
        <div>{selectedFile ? `Attachment: ${selectedFile.name}` : 'No attachment'}</div>
        <div>{isRecording ? 'Voice recording UI active...' : 'Voice message ready'}</div>
      </div>
    </div>
  );
}
