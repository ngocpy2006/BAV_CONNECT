import { Notice, Page } from '@/components/page';
import { AuthForm } from '@/features/auth/auth-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  return (
    <Page title="Đăng nhập">
      {(await searchParams).registered === '1' && (
        <Notice>Tài khoản đã được tạo. Bạn có thể đăng nhập.</Notice>
      )}
      <AuthForm mode="login" />
    </Page>
  );
}
