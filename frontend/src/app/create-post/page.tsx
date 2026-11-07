import { Page } from '@/components/page';
import { CreatePostForm } from '@/features/marketplace/create-post-form';

export default function CreatePostPage() {
  return (
    <Page title="Đăng tin">
      <CreatePostForm />
    </Page>
  );
}
