import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  useGetChatByIdQuery,
  useMuteParticipantMutation,
  useUnmuteParticipantMutation,
} from '@/services/chatApi';
import { useGetChatSummaryQuery, useGetMessagesQuery } from '@/services/messageApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getChatTitle, getDirectChatPeer } from '@/lib/chat';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';

interface ChatRightPanelProps {
  chatId: string;
}

export function ChatRightPanel({ chatId }: ChatRightPanelProps): JSX.Element {
  const currentUserId = useAppSelector((state) => state.auth.user?._id ?? '');
  const { data: chatData } = useGetChatByIdQuery(chatId);
  const { data: messagesData } = useGetMessagesQuery({ chatId, page: 1, limit: 100 });
  const { data: summaryData } = useGetChatSummaryQuery({ chatId });
  const [muteParticipant] = useMuteParticipantMutation();
  const [unmuteParticipant] = useUnmuteParticipantMutation();

  const chat = chatData?.data;
  const directPeer = chat ? getDirectChatPeer(chat, currentUserId) : undefined;
  const isCurrentUserAdmin = Boolean(chat?.groupAdmins?.some((admin) => admin._id === currentUserId));
  const mediaMessages = useMemo(
    () => (messagesData?.data.data ?? []).filter((m) => m.contentType !== 'text' && m.fileUrl),
    [messagesData],
  );

  if (!chat) {
    return (
      <aside className='glass h-full rounded-xl p-4'>
        <p className='text-sm text-muted-foreground'>No chat selected</p>
      </aside>
    );
  }

  return (
    <aside className='glass h-full rounded-xl p-3'>
      <div className='mb-3 text-center'>
        <Avatar className='mx-auto mb-2 h-16 w-16'>
          <AvatarImage src={chat.avatar} />
          <AvatarFallback>{getChatTitle(chat, currentUserId).slice(0, 1)}</AvatarFallback>
        </Avatar>
        <h3 className='font-display text-base font-semibold'>{getChatTitle(chat, currentUserId)}</h3>
        <p className='text-xs text-muted-foreground'>
          {chat.isGroupChat
            ? 'Group details'
            : directPeer?.isOnline
              ? 'Online'
              : directPeer?.lastSeen
                ? `Last seen ${formatDistanceToNow(new Date(directPeer.lastSeen), { addSuffix: true })}`
                : 'Offline'}
        </p>
      </div>

      <Separator className='my-2' />

      {chat.isGroupChat && (
        <div className='mb-3'>
          <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Members</p>
          <div className='flex flex-wrap gap-2'>
            {chat.participants.map((member) => (
              <div key={member._id} className='flex items-center gap-1'>
                <Badge variant='secondary'>{member.name}</Badge>
                {isCurrentUserAdmin && member._id !== currentUserId && (
                  (chat.mutedUsers ?? []).some((entry) => entry.user._id === member._id) ? (
                    <Button
                      size='sm'
                      variant='ghost'
                      className='h-6 px-2 text-[10px]'
                      onClick={() => void unmuteParticipant({ id: chatId, userId: member._id })}
                    >
                      Unmute
                    </Button>
                  ) : (
                    <Button
                      size='sm'
                      variant='ghost'
                      className='h-6 px-2 text-[10px]'
                      onClick={() => void muteParticipant({ id: chatId, userId: member._id, minutes: 60 })}
                    >
                      Mute 1h
                    </Button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator className='my-2' />

      <div className='mb-3'>
        <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Smart Summary</p>
        <p className='text-xs text-muted-foreground'>{summaryData?.data.title || 'Generating summary...'}</p>
        <p className='mt-1 text-xs text-muted-foreground'>Messages analyzed: {summaryData?.data.totalMessages ?? 0}</p>
        <div className='mt-2 flex flex-wrap gap-1'>
          {(summaryData?.data.highlights ?? []).map((item) => (
            <Badge key={item} variant='outline' className='text-[10px]'>
              {item}
            </Badge>
          ))}
        </div>
      </div>

      <Separator className='my-2' />

      <div>
        <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Media & Files</p>
        <ScrollArea className='h-[55vh]'>
          <div className='grid grid-cols-2 gap-2 pr-2'>
            {mediaMessages.map((message) => (
              <a
                key={message._id}
                href={message.fileUrl}
                target='_blank'
                rel='noreferrer'
                className='overflow-hidden rounded-lg border bg-card'
              >
                {message.contentType === 'image' ? (
                  <img src={message.fileUrl} alt={message.fileName} className='h-24 w-full object-cover' />
                ) : (
                  <div className='flex h-24 items-center justify-center px-2 text-center text-xs'>
                    {message.fileName || 'Attachment'}
                  </div>
                )}
              </a>
            ))}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
