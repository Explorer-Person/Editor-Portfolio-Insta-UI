import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { createEditor, TextNode, ParagraphNode, SerializedEditorState } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';


import {
    HeadingNode,
    QuoteNode,
} from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { ImageNode } from '@/components/nodes/ImageNode';


export function convertLexicalToHtml(jsonContent: SerializedEditorState): string {
    const editor = createEditor({
        nodes: [
            HeadingNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            CodeNode,
            ImageNode,
            TextNode,
            ParagraphNode
        ]
    });

    const editorState = editor.parseEditorState(jsonContent);
    editor.setEditorState(editorState);

    let html = '';
    editor.getEditorState().read(() => {
        html = $generateHtmlFromNodes(editor, null);
    });

    return html;
}



interface Blog {
    id: number;
    title: string;
    slug: string;
    image: string;
    excerpt: string;
    date: string;
    content: string;
    imageNames: string;
    created_at: string;
    jsonModel?: string;
}

export default function BlogContentPage() {
    const router = useRouter();
    const { slug } = router.query;

    const [blog, setBlog] = useState<Blog | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [htmlContent, setHtmlContent] = useState<string>('');

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

    useEffect(() => {
        if (!blog?.jsonModel) return;

        try {
            const parsed = typeof blog.jsonModel === 'string'
                ? JSON.parse(blog.jsonModel)
                : blog.jsonModel;

            const lexicalContent = parsed.content;

            if (!lexicalContent?.root?.children?.length) {
                console.warn('⚠️ Lexical content is empty.');
                setHtmlContent('<p class="text-gray-400 italic">No content available.</p>');
                return;
            }

            let html = convertLexicalToHtml(lexicalContent);
            console.log('🔍 Converted HTML:', html);

            html = html
                .replace(/src="\/upload\//g, `src="${process.env.NEXT_PUBLIC_SERVER_URL}/upload/`)
                .replace(/<img /g, '<img crossorigin="anonymous" ');

            setHtmlContent(html);
        } catch (err) {
            console.error('❌ Failed to parse Lexical JSON:', err);
            setHtmlContent('<p class="text-red-500 italic">Failed to load content.</p>');
        }
    }, [blog?.jsonModel]);


    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this blog?")) return;

        try {
            const res = await fetch(`/api/blog/delete/${slug}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete blog');

            alert('Blog deleted successfully');
            router.push('/blog/list');
        } catch (err: unknown) {
            console.error(err);
            alert('Error deleting blog');
        }
    };

    const handleUpdate = () => {
        router.push(`/blog/edit/${blog?.slug}`);
    };

    if (error) return <div className="text-red-600 p-4">Error: {error}</div>;
    if (!blog) return <div className="text-gray-800 p-4">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 bg-white relative">
            {/* Top-right corner buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={handleUpdate}
                    className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    Update
                </button>
                <button
                    onClick={handleDelete}
                    className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                    Delete
                </button>
            </div>

            <h1 className="text-4xl font-bold mb-4 text-black">{blog.title}</h1>

            <p className="text-gray-700 text-sm mb-6">
                📅 {new Date(blog.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                })}
            </p>

            <div
                className="prose prose-lg text-black max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>
    );
}
