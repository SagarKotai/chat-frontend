import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Loader2, ArrowUp, ArrowLeft } from 'lucide-react';
import { useGetMessagesQuery, useMarkChatReadMutation } from '@/services/messageApi';
import { useGetChatByIdQuery } from '@/services/chatApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setMessageSearchTerm, setSelectedChatId } from '@/features/chat/chatUiSlice';
import { socketManager } from '@/sockets/socketManager';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatData } = useGetChatByIdQuery(chatId);
  const { data, isFetching } = useGetMessagesQuery({ chatId, page, limit: 30 });
  const [markRead] = useMarkChatReadMutation();

  // Reset page when switching chats
  useEffect(() => {
    setPage(1);
  }, [chatId]);

  const messages = useMemo(() => {
    const source = [...(data?.data.data ?? [])].reverse();
    return source.filter((m) => m.content.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chat = chatData?.data;
  const title = chat ? getChatTitle(chat, currentUserId ?? '') : 'Select chat';
  const directPeer = chat && !chat.isGroupChat
    ? chat.participants.find((p) => p._id !== currentUserId)
    : undefined;

  const onLoadOlder = async (): Promise<void> => {
    setPage((p) => p + 1);
  };

  const onMarkRead = async (): Promise<void> => {
    await markRead({ chatId });
    socketManager.emitMessageRead(chatId);
  };

  return (
    <section className='glass flex h-full flex-col rounded-xl overflow-hidden'>
      <header className='flex items-center justify-between border-b p-3 bg-card/60 backdrop-blur-md z-10'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='icon' className='lg:hidden -ml-2 h-8 w-8' onClick={() => dispatch(setSelectedChatId(null))}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h2 className='font-display text-lg font-semibold flex items-center gap-2'>
              {title}
              {!chat?.isGroupChat && directPeer?.isOnline && (
                <span className='flex h-2.5 w-2.5 items-center justify-center relative'>
                  <span className='absolute inline-flex h-2.5 w-2.5 animate-ping-slow rounded-full bg-emerald-400 opacity-75'></span>
                  <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-500'></span>
                </span>
              )}
            </h2>
            <p className='text-xs text-muted-foreground'>
              {chat?.isGroupChat ? 'Group chat' : directPeer?.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {!chat?.isGroupChat && <CallControls chatId={chatId} peerUserId={directPeer?._id} />}
          <div className='relative hidden sm:block'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              value={searchTerm}
              onChange={(e) => dispatch(setMessageSearchTerm(e.target.value))}
              placeholder='Search messages'
              className='h-9 w-40 lg:w-48 pl-8'
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

        {messages.map((message, index) => {
          const msgDate = new Date(message.createdAt).toDateString();
          const prevDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
          const showDate = msgDate !== prevDate;
          
          return (
            <div key={message._id}>
              {showDate && (
                <div className='my-4 flex justify-center'>
                  <span className='rounded-full border border-border/50 bg-secondary/40 px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm'>
                    {new Date(message.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                isOwn={message.sender._id === currentUserId}
                chatId={chatId}
                isGroup={chat?.isGroupChat}
              />
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className='mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground'>
            <TypingIndicator />
            <span>{typingUsers.length === 1 ? 'Someone is typing' : `${typingUsers.length} people are typing`}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className='border-t p-3'>
        <MessageComposer chatId={chatId} />
      </div>
    </section>
  );
}

