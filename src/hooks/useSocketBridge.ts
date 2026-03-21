import { useEffect } from 'react';
import { useAppSelector } from '@/app/hooks';
import { socketManager } from '@/sockets/socketManager';
import { store } from '@/app/store';

export const useSocketBridge = (): void => {
  const token = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (!token) {
      socketManager.disconnect();
      return;
    }

    socketManager.connect(token, store.dispatch, store.getState);

    return () => {
      socketManager.disconnect();
    };
  }, [token]);
};
