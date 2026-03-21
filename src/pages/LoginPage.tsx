import { MessageSquareMore } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage(): JSX.Element {
  return (
    <main className='mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4'>
      <Card className='glass w-full max-w-md animate-slide-up'>
        <CardHeader className='space-y-3'>
          <div className='inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
            <MessageSquareMore className='h-5 w-5' />
          </div>
          <CardTitle>Welcome to PulseChat</CardTitle>
          <CardDescription>Sign in to continue your conversations in real time.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
