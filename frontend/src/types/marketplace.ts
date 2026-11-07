export type Category = { id: string; name: string; slug: string };

export type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'SOLD';

export type Post = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  status: PostStatus;
  createdAt: string;
  category: Category;
  author: { id: string; displayName: string };
};
