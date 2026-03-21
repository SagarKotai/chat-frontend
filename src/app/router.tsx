import { lazy, Suspense } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { Skeleton } from '@/components/ui/skeleton';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function RouteLoader(): JSX.Element {
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center p-6'>
      <Skeleton className='h-[80vh] w-full rounded-2xl' />
    </main>
  );
}

function ProtectedLayout(): JSX.Element {
  const token = useAppSelector((state) => state.auth.accessToken);
  if (!token) return <Navigate to='/login' replace />;
  return <Outlet />;
}

function PublicLayout(): JSX.Element {
  const token = useAppSelector((state) => state.auth.accessToken);
  if (token) return <Navigate to='/chat' replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={<RouteLoader />}>
        <PublicLayout />
      </Suspense>
    ),
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: (
      <Suspense fallback={<RouteLoader />}>
        <ProtectedLayout />
      </Suspense>
    ),
    children: [{ path: '/chat', element: <ChatPage /> }],
  },
  { path: '/', element: <Navigate to='/chat' replace /> },
  { path: '*', element: <NotFoundPage /> },
]);
