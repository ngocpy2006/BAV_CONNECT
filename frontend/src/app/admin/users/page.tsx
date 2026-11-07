import { Page } from '@/components/page';
import { AdminUsers } from '@/features/admin/users';

export default function AdminUsersPage() {
  return (
    <Page title="Quản lý người dùng">
      <AdminUsers />
    </Page>
  );
}
