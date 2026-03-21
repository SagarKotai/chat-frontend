import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage(): JSX.Element {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4'>
      <h1 className='font-display text-4xl font-bold'>404</h1>
      <p className='text-muted-foreground'>The page you requested does not exist.</p>
      <Button asChild>
        <Link to='/chat'>Back to chat</Link>
      </Button>
    </main>
  );
}
