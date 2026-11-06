import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'react-router-dom';
import { toApiError } from '@/shared/api/errors';
import { applyFieldErrors } from '@/shared/forms/applyFieldErrors';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { AuthLayout } from '../components/AuthLayout';
import { FormAlert } from '../components/FormAlert';
import { signupSchema, type SignupFormValues } from '../types';
import { useAuth } from '../useAuth';

export function SignupPage() {
  const { signup } = useAuth();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '' },
  });

  const onSubmit = async ({ full_name, email, password }: SignupFormValues) => {
    try {
      await signup({ full_name, email, password }); // signs up, then logs in
    } catch (e) {
      const err = toApiError(e);
      if (err.status === 409) {
        setError('email', { type: 'server', message: err.message || 'This email is already registered' });
        return;
      }
      if (applyFieldErrors(err, setError, ['full_name', 'email', 'password'])) return;
      setError('root', { message: err.message });
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="It takes less than a minute.">
      <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Full name" autoComplete="name" placeholder="Asha Sharma" error={errors.full_name?.message} {...register('full_name')} />
        <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />
        {errors.root?.message && <FormAlert kind="error">{errors.root.message}</FormAlert>}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-semibold text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
