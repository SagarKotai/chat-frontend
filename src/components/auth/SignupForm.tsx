import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, UserRound, Sparkles } from 'lucide-react';
import { useRegisterMutation } from '@/services/authApi';
import { setAccessToken, setCurrentUser } from '@/features/auth/authSlice';
import { useAppDispatch } from '@/app/hooks';
import { signupSchema, type SignupFormValues } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SignupForm(): JSX.Element {
  const [registerUser, { isLoading }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupFormValues): Promise<void> => {
    try {
      const result = await registerUser(values).unwrap();
      dispatch(setAccessToken(result.data.accessToken));
      dispatch(setCurrentUser(result.data.user));
      toast.success('Account created successfully');
      navigate('/chat');
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message ?? 'Signup failed';
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div>
        <label className='mb-1 block text-sm font-medium'>Name</label>
        <div className='relative'>
          <UserRound className='absolute left-3 top-3.5 h-4 w-4 text-muted-foreground' />
          <Input {...register('name')} placeholder='Jane Cooper' className='pl-9' />
        </div>
        {errors.name && <p className='mt-1 text-xs text-destructive'>{errors.name.message}</p>}
      </div>

      <div>
        <label className='mb-1 block text-sm font-medium'>Email</label>
        <div className='relative'>
          <Mail className='absolute left-3 top-3.5 h-4 w-4 text-muted-foreground' />
          <Input {...register('email')} type='email' placeholder='you@company.com' className='pl-9' />
        </div>
        {errors.email && <p className='mt-1 text-xs text-destructive'>{errors.email.message}</p>}
      </div>

      <div>
        <label className='mb-1 block text-sm font-medium'>Password</label>
        <div className='relative'>
          <Lock className='absolute left-3 top-3.5 h-4 w-4 text-muted-foreground' />
          <Input {...register('password')} type='password' placeholder='At least 8 chars' className='pl-9' />
        </div>
        {errors.password && <p className='mt-1 text-xs text-destructive'>{errors.password.message}</p>}
      </div>

      <Button type='submit' className='w-full' disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create Account'}
        <Sparkles className='h-4 w-4' />
      </Button>

      <p className='text-center text-sm text-muted-foreground'>
        Already have an account?{' '}
        <Link to='/login' className='font-semibold text-primary hover:underline'>
          Sign in
        </Link>
      </p>
    </form>
  );
}
