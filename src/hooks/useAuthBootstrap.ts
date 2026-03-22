import { useEffect } from 'react';
import { useMeQuery } from '@/services/authApi';
import { setCurrentUser } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { ensureE2EEKeyPair } from '@/lib/e2ee';
import { useUpsertE2EEKeyMutation } from '@/services/userApi';

export const useAuthBootstrap = (): void => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.accessToken);
  const { data } = useMeQuery(undefined, { skip: !token });
  const [upsertE2EEKey] = useUpsertE2EEKeyMutation();

  useEffect(() => {
    if (data?.success && data.data) {
      dispatch(setCurrentUser(data.data));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (!token || !data?.data) return;

    void (async () => {
      try {
        const keys = await ensureE2EEKeyPair();
        if (keys.rotated || !data.data.publicKey || data.data.publicKey !== keys.publicKey) {
          await upsertE2EEKey({
            deviceId: keys.deviceId,
            publicKey: keys.publicKey,
          }).unwrap();
        }
      } catch {
        // E2E bootstrap should not block chat usage.
      }
    })();
  }, [token, data, upsertE2EEKey]);
};
