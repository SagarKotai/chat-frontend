import { memo } from 'react';
import { format } from 'date-fns';
import { CheckCheck, File, Pin } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleReaction } from '@/features/message/messageUiSlice';
import { pinMessage, unpinMessage } from '@/features/chat/chatUiSlice';
import type { Message } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  chatId: string;
}

function MessageBubbleInner({ message, isOwn, chatId }: MessageBubbleProps): JSX.Element {
  const dispatch = useAppDispatch();
  const [showPicker, setShowPicker] = useState(false);
  const reactions = useAppSelector((state) => state.messageUi.reactionsByMessageId[message._id] ?? []);
  const isPinned = useAppSelector((state) =>
    (state.chatUi.pinnedMessageIdsByChat[chatId] ?? []).includes(message._id),
  );

  return (
    <div className={`group mb-2 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[78%] animate-slide-up rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isOwn ? 'bg-primary text-primary-foreground' : 'bg-card'
        }`}
      >
        {message.replyTo?.content && (
          <div className='mb-1 rounded-md border border-border/60 bg-muted/80 p-1 text-xs text-muted-foreground'>
            Reply to: {message.replyTo.content.slice(0, 90)}
          </div>
        )}

        {message.contentType === 'text' && <p className='whitespace-pre-wrap break-words'>{message.content}</p>}

        {message.contentType !== 'text' && message.fileUrl && (
          <div className='space-y-2'>
            {message.contentType === 'image' ? (
              <img src={message.fileUrl} alt={message.fileName || 'image'} className='max-h-64 rounded-lg object-cover' />
            ) : (
              <a
                href={message.fileUrl}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-2 rounded-lg border border-border/60 px-2 py-1 text-xs'
              >
                <File className='h-3 w-3' />
                {message.fileName || 'Attachment'}
              </a>
            )}
            {message.content ? <p className='text-sm'>{message.content}</p> : null}
          </div>
        )}

        <div className='mt-1 flex items-center justify-end gap-2 text-[10px] opacity-80'>
          {message.isEdited && <span>edited</span>}
          <span>{format(new Date(message.createdAt), 'p')}</span>
          {isOwn && <CheckCheck className='h-3 w-3' />}
        </div>

        {reactions.length > 0 && (
          <div className='mt-1 flex flex-wrap gap-1'>
            {reactions.map((reaction) => (
              <Badge key={reaction} variant='secondary'>
                {reaction}
              </Badge>
            ))}
          </div>
        )}

        <div className='absolute -top-3 right-0 hidden items-center gap-1 rounded-full border bg-card p-1 shadow group-hover:flex'>
          <Button size='icon' variant='ghost' className='h-7 w-7' onClick={() => setShowPicker((v) => !v)}>
            😊
          </Button>
          <Button
            size='icon'
            variant='ghost'
            className='h-7 w-7'
            onClick={() => dispatch(isPinned ? unpinMessage({ chatId, messageId: message._id }) : pinMessage({ chatId, messageId: message._id }))}
          >
            <Pin className={`h-3.5 w-3.5 ${isPinned ? 'text-primary' : ''}`} />
          </Button>
        </div>

        {showPicker && (
          <div className='absolute z-20 mt-1'>
            <EmojiPicker
              width={280}
              lazyLoadEmojis
              onEmojiClick={(emojiData) => {
                dispatch(toggleReaction({ messageId: message._id, emoji: emojiData.emoji }));
                setShowPicker(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleInner);
