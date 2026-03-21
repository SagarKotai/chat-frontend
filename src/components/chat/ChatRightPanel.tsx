import { useMemo } from 'react';
import { useGetChatByIdQuery } from '@/services/chatApi';
import { useGetMessagesQuery } from '@/services/messageApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getChatTitle } from '@/lib/chat';
import { useAppSelector } from '@/app/hooks';

interface ChatRightPanelProps {
  chatId: string;
}

export function ChatRightPanel({ chatId }: ChatRightPanelProps): JSX.Element {
  const currentUserId = useAppSelector((state) => state.auth.user?._id ?? '');
  const { data: chatData } = useGetChatByIdQuery(chatId);
  const { data: messagesData } = useGetMessagesQuery({ chatId, page: 1, limit: 100 });

  const chat = chatData?.data;
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
        <p className='text-xs text-muted-foreground'>{chat.isGroupChat ? 'Group details' : 'Direct chat'}</p>
      </div>

      <Separator className='my-2' />

      {chat.isGroupChat && (
        <div className='mb-3'>
          <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Members</p>
          <div className='flex flex-wrap gap-2'>
            {chat.participants.map((member) => (
              <Badge key={member._id} variant='secondary'>
                {member.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

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
