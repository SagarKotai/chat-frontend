import { MessageSquareMore } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage(): JSX.Element {
  return (
    <main className='mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4'>
      <Card className='glass w-full max-w-md animate-slide-up'>
        <CardHeader className='space-y-3'>
          <div className='inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
            <MessageSquareMore className='h-5 w-5' />
          </div>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Join your team, friends, and communities with one inbox.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </main>
  );
}
