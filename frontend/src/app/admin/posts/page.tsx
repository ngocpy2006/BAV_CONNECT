import { Page } from '@/components/page';
import { Moderation } from '@/features/admin/moderation';

export default function AdminPostsPage() {
  return (
    <Page title="Bài đăng chờ duyệt">
      <Moderation />
    </Page>
  );
}
