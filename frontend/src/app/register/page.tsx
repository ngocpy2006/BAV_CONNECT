import { Page } from '@/components/page';
import { AuthForm } from '@/features/auth/auth-form';

export default function RegisterPage() {
  return (
    <Page title="Đăng ký">
      <AuthForm mode="register" />
    </Page>
  );
}
