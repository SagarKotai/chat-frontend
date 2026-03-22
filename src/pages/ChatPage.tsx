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

      <div className='grid h-[calc(100vh-64px)] grid-cols-12 gap-3'>
        <div className='col-span-12 lg:col-span-3'>
          <ChatSidebar />
        </div>

        <div className={`${rightPanelOpen ? 'col-span-12 lg:col-span-6' : 'col-span-12 lg:col-span-9'}`}>
          {selectedChatId ? (
            <ChatCenterPanel chatId={selectedChatId} />
          ) : (
            <div className='glass flex h-full items-center justify-center rounded-xl'>
              <p className='text-muted-foreground'>Select a chat to start messaging.</p>
            </div>
          )}
        </div>

        {rightPanelOpen && (
          <div className='col-span-12 lg:col-span-3'>
            {selectedChatId ? <ChatRightPanel chatId={selectedChatId} /> : null}
          </div>
        )}
      </div>
    </main>
  );
}
