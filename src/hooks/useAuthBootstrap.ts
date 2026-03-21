import { useEffect } from 'react';
import { useMeQuery } from '@/services/authApi';
import { setCurrentUser } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';

export const useAuthBootstrap = (): void => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.accessToken);
  const { data } = useMeQuery(undefined, { skip: !token, pollingInterval: 120000 });

  useEffect(() => {
    if (data?.success && data.data) {
      dispatch(setCurrentUser(data.data));
    }
  }, [data, dispatch]);
};
