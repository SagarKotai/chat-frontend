import { useEffect } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useSocketBridge } from '@/hooks/useSocketBridge';
import { setRightPanelOpen, setSelectedChatId } from '@/features/chat/chatUiSlice';
import { useGetChatsQuery } from '@/services/chatApi';
import { useLogoutMutation } from '@/services/authApi';
import { logoutLocally } from '@/features/auth/authSlice';
import { socketManager } from '@/sockets/socketManager';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatCenterPanel } from '@/components/chat/ChatCenterPanel';
import { ChatRightPanel } from '@/components/chat/ChatRightPanel';
import { Button } from '@/components/ui/button';

export default function ChatPage(): JSX.Element {
  useAuthBootstrap();
  useSocketBridge();

  const dispatch = useAppDispatch();
  const selectedChatId = useAppSelector((state) => state.chatUi.selectedChatId);
  const rightPanelOpen = useAppSelector((state) => state.chatUi.rightPanelOpen);
  const { data: chatsData } = useGetChatsQuery();
  const [logout] = useLogoutMutation();

  useEffect(() => {
    const firstChatId = chatsData?.data?.[0]?._id;
    if (!selectedChatId && firstChatId) {
      dispatch(setSelectedChatId(firstChatId));
      socketManager.emitJoinChat(firstChatId);
    }
  }, [chatsData, selectedChatId, dispatch]);

  useEffect(() => {
    if (!selectedChatId) return;
    socketManager.emitJoinChat(selectedChatId);
    return () => {
      socketManager.emitLeaveChat(selectedChatId);
    };
  }, [selectedChatId]);

  const onLogout = async (): Promise<void> => {
    try {
      await logout().unwrap();
    } finally {
      dispatch(logoutLocally());
    }
  };

  return (
    <main className='h-screen p-3'>
      <div className='mb-2 flex items-center justify-between px-1'>
        <h1 className='font-display text-xl font-bold'>PulseChat Workspace</h1>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => dispatch(setRightPanelOpen(!rightPanelOpen))}>
            {rightPanelOpen ? <PanelRightClose className='h-4 w-4' /> : <PanelRightOpen className='h-4 w-4' />}
          </Button>
          <Button variant='secondary' size='sm' onClick={() => void onLogout()}>
            Logout
          </Button>
        </div>
      </div>

      <div className='flex h-[calc(100vh-64px)] w-full gap-3'>
        <div className={`w-full lg:w-[25%] lg:block ${selectedChatId ? 'hidden' : 'block'}`}>
          <ChatSidebar />
        </div>

        <div className={`w-full ${rightPanelOpen ? 'lg:w-[50%]' : 'lg:w-[75%]'} flex-1 lg:flex flex-col ${!selectedChatId ? 'hidden' : 'flex'}`}>
          {selectedChatId ? (
            <ChatCenterPanel chatId={selectedChatId} />
          ) : (
            <div className='glass flex h-full items-center justify-center rounded-xl'>
              <div className='flex flex-col items-center gap-4 text-muted-foreground'>
                <div className='rounded-full bg-secondary p-6'>
                  <svg className='h-12 w-12 text-primary' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                  </svg>
                </div>
                <p className='text-lg font-medium'>Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {rightPanelOpen && selectedChatId && (
          <div className='hidden lg:block lg:w-[25%]'>
            <ChatRightPanel chatId={selectedChatId} />
          </div>
        )}
      </div>
    </main>
  );
}
