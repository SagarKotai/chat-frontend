import { memo } from 'react';
import { Search, MessageCircle, Circle } from 'lucide-react';
import { useGetChatsQuery } from '@/services/chatApi';
import { useGetNotificationsQuery } from '@/services/notificationApi';
import { useSearchUsersQuery } from '@/services/userApi';
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

  const { data: chatsData, isLoading } = useGetChatsQuery(undefined, { pollingInterval: 60000 });
  const { data: notificationsData } = useGetNotificationsQuery(
    { page: 1, limit: 100 },
    { pollingInterval: 45000 },
  );
  const { data: usersData } = useSearchUsersQuery(debouncedTerm, { skip: debouncedTerm.length < 2 });

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
                className={`group flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                  selectedChatId === chat._id ? 'bg-primary/12' : 'hover:bg-muted'
                }`}
              >
                <Avatar className='h-10 w-10'>
                  <AvatarImage src={avatar} />
                  <AvatarFallback>{title.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold'>{title}</p>
                  <p className='truncate text-xs text-muted-foreground'>
                    {chat.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
                <div className='flex flex-col items-end gap-1'>
                  {unread > 0 && <Badge>{unread}</Badge>}
                  {!chat.isGroupChat &&
                    (chat.participants.some((p) => p.isOnline && p._id !== currentUser?._id) ? (
                      <Circle className='h-2.5 w-2.5 fill-emerald-400 text-emerald-400' />
                    ) : null)}
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
