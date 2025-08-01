/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';

interface Blog {
    id: string;
    title: string;
    slug: string;
    image: string;
    excerpt: string;
    date: string;
    html: string;
    imageNames: string;
    created_at: string;
}

export default function BlogListPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const res = await fetch('/api/blog/get');
                if (!res.ok) throw new Error('Failed to fetch blogs');
                const data = await res.json();
                console.log('Fetched blogs:', data.blogs);
                setBlogs(data.blogs); // ✅ FIXED HERE
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                    console.error('Fetch error:', err);
                } else {
                    setError('An unknown error occurred');
                    console.error('Fetch error:', err);
                }
            }
        };

        fetchBlogs();
    }, []);

    function handleBlogClick(slug: string) {
        window.location.href = `/blog/content/${slug}`;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold mb-8 text-black">📝 Blog List</h1>

            {error && <p className="text-red-600 text-lg">Error: {error}</p>}
            {!error && blogs.length === 0 && (
                <p className="text-black text-lg">Loading blogs...</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blogs.map((blog) => (
                    <div
                        key={blog.id}
                        onClick={() => handleBlogClick(blog.slug)}
                        className="flex bg-white cursor-pointer bg-gray-100 hover:bg-black text-black hover:text-white transition-colors duration-300 p-4 rounded border border-gray-300 shadow-md rounded-lg overflow-hidden"
                        style={{ minHeight: '180px' }}
                    >
                        {/* Left: Blog Cover Image */}
                        <div style={{ width: '100%', height: '200px', backgroundColor: '#eee' }}>
                            <img
                                src={`${process.env.NEXT_PUBLIC_SERVER_URL}${blog.image}`}
                                crossOrigin="anonymous"
                                alt={blog.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>


                        {/* Right: Blog Info */}
                        <div className="w-3/5 p-4 flex flex-col justify-center">
                            <h2 className="text-xl font-semibold mb-2">{blog.title}</h2>
                            <p className="text-sm mb-2">
                                📅 {new Date(blog.date).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                            <p className="text-md">{blog.excerpt}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );





}
