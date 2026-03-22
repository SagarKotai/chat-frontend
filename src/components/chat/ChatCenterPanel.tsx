import { useMemo, useState } from 'react';
import { Search, Loader2, ArrowUp } from 'lucide-react';
import { useGetMessagesQuery, useMarkChatReadMutation } from '@/services/messageApi';
import { useGetChatByIdQuery } from '@/services/chatApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setMessageSearchTerm } from '@/features/chat/chatUiSlice';
import { socketManager } from '@/sockets/socketManager';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { CallControls } from '@/components/chat/CallControls';
import { getChatTitle } from '@/lib/chat';

interface ChatCenterPanelProps {
  chatId: string;
}

export function ChatCenterPanel({ chatId }: ChatCenterPanelProps): JSX.Element {
  const [page, setPage] = useState(1);
  const dispatch = useAppDispatch();
  const searchTerm = useAppSelector((state) => state.chatUi.messageSearchTerm);
  const typingUsers = useAppSelector((state) => state.messageUi.typingByChatId[chatId] ?? []);
  const currentUserId = useAppSelector((state) => state.auth.user?._id);
  const pinned = useAppSelector((state) => state.chatUi.pinnedMessageIdsByChat[chatId] ?? []);

  const { data: chatData } = useGetChatByIdQuery(chatId);
  const { data, isFetching } = useGetMessagesQuery({ chatId, page, limit: 30 });
  const [markRead] = useMarkChatReadMutation();

  const messages = useMemo(() => {
    const source = [...(data?.data.data ?? [])].reverse();
    return source.filter((m) => m.content.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  const chat = chatData?.data;
  const title = chat ? getChatTitle(chat, currentUserId ?? '') : 'Select chat';
  const directPeerId =
    chat && !chat.isGroupChat
      ? chat.participants.find((participant) => participant._id !== currentUserId)?._id
      : undefined;

  const onLoadOlder = async (): Promise<void> => {
    setPage((p) => p + 1);
  };

  const onMarkRead = async (): Promise<void> => {
    await markRead({ chatId });
    socketManager.emitMessageRead(chatId);
  };

  return (
    <section className='glass flex h-full flex-col rounded-xl'>
      <header className='flex items-center justify-between border-b p-3'>
        <div>
          <h2 className='font-display text-lg font-semibold'>{title}</h2>
          <p className='text-xs text-muted-foreground'>{chat?.isGroupChat ? 'Group' : 'Direct message'}</p>
        </div>

        <div className='flex items-center gap-2'>
          {!chat?.isGroupChat && <CallControls chatId={chatId} peerUserId={directPeerId} />}
          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              value={searchTerm}
              onChange={(e) => dispatch(setMessageSearchTerm(e.target.value))}
              placeholder='Search messages'
              className='h-9 w-48 pl-8'
            />
          </div>
          <Button variant='outline' size='sm' onClick={() => void onMarkRead()}>
            Mark read
          </Button>
        </div>
      </header>

      {!!pinned.length && (
        <div className='border-b px-3 py-2 text-xs text-muted-foreground'>
          <Badge variant='secondary'>{pinned.length} pinned</Badge>
        </div>
      )}

      <ScrollArea className='flex-1 p-3'>
        <div className='mb-3 flex justify-center'>
          <Button variant='ghost' size='sm' onClick={() => void onLoadOlder()}>
            <ArrowUp className='mr-1 h-4 w-4' /> Load older
          </Button>
        </div>

        {isFetching && (
          <div className='mb-3 flex items-center justify-center text-muted-foreground'>
            <Loader2 className='h-4 w-4 animate-spin' />
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={message.sender._id === currentUserId}
            chatId={chatId}
          />
        ))}

        {typingUsers.length > 0 && (
          <p className='mt-2 text-xs text-muted-foreground'>
            {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} users are typing...`}
          </p>
        )}
      </ScrollArea>

      <div className='border-t p-3'>
        <MessageComposer chatId={chatId} />
      </div>
    </section>
  );
}
