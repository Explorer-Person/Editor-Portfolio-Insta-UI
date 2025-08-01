import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Editor from '@/components/Editor';

interface Blog {
    id: number;
    title: string;
    slug: string;
    image: string;
    excerpt: string;
    date: string;
    content: string;
    imageNames: string;
    jsonModel: string;
    created_at: string;
}

export default function EditBlogPage() {
    const router = useRouter();
    const { slug } = router.query;

    const [blog, setBlog] = useState<Blog | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        const fetchBlog = async () => {
            try {
                const res = await fetch(`/api/blog/getOne/${slug}`);
                if (!res.ok) throw new Error('Failed to fetch blog');
                const data = await res.json();
                setBlog(data.blog);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                    console.error(err);
                } else {
                    setError('An unknown error occurred');
                    console.error(err);
                }
            }
        };

        fetchBlog();
    }, [slug]);

    if (error) return <div className="text-red-600 p-4">Error: {error}</div>;
    if (!blog) return <div className="text-gray-800 p-4">Loading...</div>;

    return <Editor initialData={blog} mode="edit" />;
}
