import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'react-router-dom';
import { config } from '@/shared/config';
import { toApiError } from '@/shared/api/errors';
import { applyFieldErrors } from '@/shared/forms/applyFieldErrors';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { AuthLayout } from '../components/AuthLayout';
import { FormAlert } from '../components/FormAlert';
import { loginSchema, type LoginFormValues } from '../types';
import { useAuth } from '../useAuth';
import { readRedirectState } from '../redirectState';

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const { reason } = readRedirectState(location.state);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // No navigate() here: once status becomes "authenticated", <GuestOnlyRoute> redirects.
  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
    } catch (e) {
      const err = toApiError(e);
      if (applyFieldErrors(err, setError, ['email', 'password'])) return;
      setError('root', { message: err.status === 401 ? 'Incorrect email or password' : err.message });
    }
  };

  const fillDemo = () => {
    setValue('email', config.demo.email, { shouldValidate: true });
    setValue('password', config.demo.password, { shouldValidate: true });
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to grab your seats before they're gone.">
      {reason === 'expired' && <FormAlert kind="info">Your session expired. Please log in again.</FormAlert>}

      {config.mocks.has('auth') && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div>
            <p className="font-semibold">Mock mode</p>
            <p className="font-mono text-xs">{config.demo.email} / {config.demo.password}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={fillDemo}>Use demo</Button>
        </div>
      )}

      <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        {errors.root?.message && <FormAlert kind="error">{errors.root.message}</FormAlert>}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to TicketRush?{' '}
        <Link to="/signup" state={location.state} className="font-semibold text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
