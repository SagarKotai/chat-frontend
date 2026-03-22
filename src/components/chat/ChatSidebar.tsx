import { memo } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Search, MessageCircle } from 'lucide-react';
import { useGetChatsQuery } from '@/services/chatApi';
import { useGetNotificationsQuery } from '@/services/notificationApi';
import { useSearchUsersQuery } from '@/services/userApi';
import { useSearchGroupChatsQuery } from '@/services/chatApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setSearchTerm, setSelectedChatId } from '@/features/chat/chatUiSlice';
import { useAccessOrCreateChatMutation } from '@/services/chatApi';
import { getChatAvatar, getChatTitle } from '@/lib/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { CreateGroupDialog } from '@/components/chat/CreateGroupDialog';

function SidebarInner(): JSX.Element {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const selectedChatId = useAppSelector((state) => state.chatUi.selectedChatId);
  const searchTerm = useAppSelector((state) => state.chatUi.searchTerm);
  const debouncedTerm = useDebounce(searchTerm, 350);

  const { data: chatsData, isLoading } = useGetChatsQuery();
  const { data: notificationsData } = useGetNotificationsQuery({ page: 1, limit: 100 });
  const { data: usersData } = useSearchUsersQuery(debouncedTerm, { skip: debouncedTerm.length < 2 });
  const { data: groupSearchData } = useSearchGroupChatsQuery(debouncedTerm, {
    skip: debouncedTerm.length < 2,
  });

  const [accessOrCreateChat] = useAccessOrCreateChatMutation();

  const chats = chatsData?.data ?? [];
  const unreadByChat = (notificationsData?.data.data ?? []).reduce<Record<string, number>>((acc, item) => {
    if (!item.chat?._id || item.isRead) return acc;
    acc[item.chat._id] = (acc[item.chat._id] ?? 0) + 1;
    return acc;
  }, {});

  const onPickSearchedUser = async (userId: string): Promise<void> => {
    const chat = await accessOrCreateChat({ userId }).unwrap();
    dispatch(setSelectedChatId(chat.data._id));
    dispatch(setSearchTerm(''));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'p');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  return (
    <aside className='glass h-full rounded-xl border p-3'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Avatar className='h-9 w-9'>
            <AvatarImage src={currentUser?.avatar} />
            <AvatarFallback>{currentUser?.name?.slice(0, 1) ?? 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className='text-sm font-semibold'>{currentUser?.name ?? 'User'}</p>
            <p className='text-xs text-muted-foreground'>Realtime online</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className='mb-3 flex items-center gap-2'>
        <CreateGroupDialog />
      </div>

      <div className='relative mb-3'>
        <Search className='pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
        <Input
          value={searchTerm}
          onChange={(e) => dispatch(setSearchTerm(e.target.value))}
          placeholder='Search users or chats...'
          className='pl-9'
        />
      </div>

      {debouncedTerm.length >= 2 && (usersData?.data?.length ?? 0) > 0 && (
        <div className='mb-3 space-y-1 rounded-lg border p-2'>
          {usersData?.data.map((user) => (
            <button
              key={user._id}
              className='flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted'
              onClick={() => void onPickSearchedUser(user._id)}
            >
              <Avatar className='h-8 w-8'>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{user.name}</p>
                <p className='truncate text-xs text-muted-foreground'>{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {debouncedTerm.length >= 2 && (groupSearchData?.data?.length ?? 0) > 0 && (
        <div className='mb-3 space-y-1 rounded-lg border p-2'>
          <p className='px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
            Groups
          </p>
          {groupSearchData?.data.map((chat) => (
            <button
              key={chat._id}
              className='flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted'
              onClick={() => dispatch(setSelectedChatId(chat._id))}
            >
              <Avatar className='h-8 w-8'>
                <AvatarImage src={chat.avatar} />
                <AvatarFallback>{(chat.name || 'G').slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{chat.name || 'Untitled Group'}</p>
                <p className='truncate text-xs text-muted-foreground'>
                  {chat.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <ScrollArea className='h-[calc(100%-170px)]'>
        <div className='space-y-1 pr-2'>
          {isLoading && <p className='p-2 text-sm text-muted-foreground'>Loading chats...</p>}
          {chats.map((chat) => {
            const title = getChatTitle(chat, currentUser?._id ?? '');
            const avatar = getChatAvatar(chat, currentUser?._id ?? '');
            const unread = unreadByChat[chat._id] ?? 0;

            return (
              <button
                key={chat._id}
                onClick={() => dispatch(setSelectedChatId(chat._id))}
                className={`group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all ${
                  selectedChatId === chat._id 
                    ? 'bg-primary/10 border border-primary/20 shadow-[0_2px_10px_-3px_rgba(var(--primary),0.1)]' 
                    : 'hover:bg-muted/60 border border-transparent'
                }`}
              >
                <div className='relative shrink-0'>
                  <Avatar className='h-11 w-11 shadow-sm'>
                    <AvatarImage src={avatar} />
                    <AvatarFallback>{title.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  {!chat.isGroupChat && chat.participants.some((p) => p.isOnline && p._id !== currentUser?._id) && (
                    <span className='absolute bottom-0 right-0 flex h-3.5 w-3.5'>
                      <span className='absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-emerald-400 opacity-75'></span>
                      <span className='relative inline-flex h-3.5 w-3.5 rounded-full border-[2.5px] border-background bg-emerald-500'></span>
                    </span>
                  )}
                </div>
                <div className='min-w-0 flex-1 py-1'>
                  <div className='flex items-center justify-between mb-0.5'>
                    <p className='truncate text-sm font-semibold'>{title}</p>
                    {chat.lastMessage && (
                      <span className={`shrink-0 pl-2 text-[10px] ${unread > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className='flex items-center justify-between gap-2'>
                    <p className={`truncate text-xs ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {chat.lastMessage?.content || 'No messages yet'}
                    </p>
                    {unread > 0 && (
                      <Badge className='flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full px-1 text-[10px] leading-none'>
                        {unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {!isLoading && chats.length === 0 && (
            <div className='mt-8 px-2 text-center text-muted-foreground'>
              <MessageCircle className='mx-auto mb-2 h-6 w-6' />
              <p className='text-sm'>No chats yet. Search users to start.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

export const ChatSidebar = memo(SidebarInner);
