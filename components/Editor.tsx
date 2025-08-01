/* eslint-disable @next/next/no-img-element */
'use client';

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useState, useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeNode } from '@lexical/code';
import { ListNode, ListItemNode } from '@lexical/list';
import { ImageNode } from '@/components/nodes/ImageNode';
import { Toolbar } from '@/components/Toolbar';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $getRoot, EditorState, LexicalEditor } from 'lexical';
import { BlogContent } from '@/public/blog';
import { InitialBlogData } from '@/interfaces/response';




const theme = {
    heading: {
        h1: 'text-3xl font-bold mt-4 mb-2',
        h2: 'text-2xl font-semibold mt-4 mb-2',
        h3: 'text-xl font-medium mt-4 mb-2',
    },
};

function onError(error: string | Error) {
    console.error(error);
}

function MyOnChangePlugin({ onChange }: { onChange: (text: string) => void }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        const handleEditorChange = (editorState: EditorState) => {
            editorState.read(() => {
                const textContent = getEditorTextContent();
                onChange(textContent);
            });
        };

        const getEditorTextContent = (): string => {
            return editor.getEditorState().read(() => {
                return editor.getRootElement()?.textContent || '';
            });
        };

        const unregister = editor.registerUpdateListener(({ editorState }) => {
            handleEditorChange(editorState);
        });

        return () => {
            unregister();
        };
    }, [editor, onChange]);

    return null;
}

export function EditorRefPlugin({ editorRef }: { editorRef: React.RefObject<LexicalEditor | null> }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        editorRef.current = editor;
    }, [editor, editorRef]);

    return null;
}

type LexicalSerializedNode = {
    type: string;
    src?: string;
    children?: LexicalSerializedNode[];
};

const uploadImagesFromBlogJson = async () => {
    try {
        // 1. Load saved blog JSON (assuming JSON includes `content` as Lexical JSON)
        const res = await fetch('/blog.json');
        if (!res.ok) throw new Error('Failed to load blog.json');

        const blogData = await res.json();
        const imageFilenames: string[] = [];

        // 2. Traverse editor JSON content to extract image file names
        const traverse = (node: LexicalSerializedNode) => {
            if (node.type === 'image' && node.src) {
                const parts = node.src.split('/');
                const fileName = parts[parts.length - 1];
                imageFilenames.push(fileName);
            }
            if (Array.isArray(node.children)) {
                node.children.forEach(traverse);
            }
        };

        if (blogData.content?.root?.children) {
            blogData.content.root.children.forEach(traverse);
            const parts = blogData.coverImage.split('/');
            const fileName = parts[parts.length - 1];
            imageFilenames.push(fileName)
        } else {
            console.warn('⚠️ No editor content found in blogData.content');
            return;
        }

        // 3. Create FormData with binary images
        const formData = new FormData();
        for (const fileName of imageFilenames) {
            try {
                const imageRes = await fetch(`/upload/${encodeURIComponent(fileName)}`);
                if (!imageRes.ok) {
                    console.warn(`⚠️ Skipping ${fileName}, fetch failed with status ${imageRes.status}`);
                    continue;
                }

                const blob = await imageRes.blob();
                formData.append('images', blob, fileName);
            } catch (e) {
                console.warn(`⚠️ Skipping ${fileName}, fetch error:`, e);
            }
        }

        // 4. POST to backend upload route
        const uploadRes = await fetch('http://localhost:5000/api/blog/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await uploadRes.json();
        if (uploadRes.ok) {
            console.log('✅ Uploaded images:', result.uploaded);
        } else {
            console.error('❌ Upload error:', result.error);
        }

    } catch (err) {
        console.error('❌ Failed to extract/send images:', err);
    }
};


import JSZip from 'jszip';

export const downloadImageBundle = async (slug: string): Promise<string[]> => {
    const res = await fetch(`/api/blog/download/${slug}`);

    if (!res.ok) {
        console.error('❌ Failed to fetch zip');
        return [];
    }

    const blob = await res.blob();
    const zip = await JSZip.loadAsync(blob);

    const imageUrls: string[] = [];

    // Extract each image and convert to ObjectURL
    for (const filename of Object.keys(zip.files)) {
        const file = zip.files[filename];
        if (!file.dir && /\.(png|jpg|jpeg|gif|webp)$/i.test(filename)) {
            const fileData = await file.async('blob');
            const objectUrl = URL.createObjectURL(fileData);
            imageUrls.push(objectUrl);
        }
    }

    return imageUrls;
};



const extractImageNamesFromContent = (contentJSON: BlogContent): string[] => {
    const imageNames: string[] = [];

    const traverse = (node: LexicalSerializedNode) => {
        if (node.type === 'image' && node.src) {
            const parts = node.src.split('/');
            const fileName = parts[parts.length - 1];
            imageNames.push(fileName);
        }
        if (Array.isArray(node.children)) {
            node.children.forEach(traverse);
        }
    };

    if (contentJSON.root?.children) {
        contentJSON.root.children.forEach(traverse);
    }

    return imageNames;
};

interface EditorProps {
    initialData?: InitialBlogData | null;
    mode?: 'create' | 'edit';
}

export default function Editor({ initialData, mode }: EditorProps) {
    const [editorState, setEditorState] = useState<string | null>(null);
    const editorRef = useRef<LexicalEditor>(null); // Store editor instance

    const [showMetaModal, setShowMetaModal] = useState(false);
    const [meta, setMeta] = useState({
        id: '',
        title: '',
        slug: '',
        excerpt: '',
        date: '',
        coverImage: '',
    });

    console.log(editorState)
    const initialConfig = {
        namespace: 'MyEditor',
        theme,
        onError,
        nodes: [
            HeadingNode,
            QuoteNode,
            CodeNode,
            ListNode,
            ListItemNode,
            ImageNode,
        ],
        editorRef, // capture editor instance
    };

    async function createJson(content: string, id: string) {
        // Parse content if it's stringified, otherwise use directly
        const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;

        const blogJson = {
            id: id,
            title: parsedContent.title,
            slug: parsedContent.slug,
            excerpt: parsedContent.excerpt,
            date: parsedContent.date,
            image: parsedContent.image,
            content: parsedContent.content, // Lexical JSON
        };

        try {
            const res = await fetch('/api/blog/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(blogJson),
            });

            const result = await res.json();
            console.log('✅ blog.json saved:', result.message);
        } catch (err) {
            console.error('❌ Failed to save blog.json:', err);
        }
    }


    useEffect(() => {
        if (mode === 'edit' && initialData) {
            console.log('💬 initialData.image:', initialData.image);

            console.log('💬 initialData.id:', initialData.id);

            setMeta({
                id: initialData.id.toString() || '',
                title: initialData.title || '',
                slug: initialData.slug || '',
                excerpt: initialData.excerpt || '',
                date: initialData.date || '',
                coverImage: initialData.image?.startsWith('/upload/')
                    ? initialData.image
                    : initialData.image?.replace('http://localhost:5000', '') || '',
            });

            createJson(initialData.jsonModel, initialData.id.toString()); // your raw Lexical JSON
        }
    }, [mode, initialData]);



    useEffect(() => {
        
        const loadSavedJSON = async () => {
            try {
                const res = await fetch('/api/blog/save');
                if (!res.ok) return;

                const data = await res.json();
                const editor = editorRef.current;

                if (editor && data.content) {
                    editor.update(() => {
                        const editorState = editor.parseEditorState(data.content);
                        editor.setEditorState(editorState);
                    });
                }

                if(data.image === ''){
                    return
                }

                // ✅ Set default meta values from saved JSON:
                setMeta({
                    id: data.id || '',
                    title: data.title || '',
                    slug: data.slug || '',
                    excerpt: data.excerpt || '',
                    date: data.date || '',
                    coverImage: data.image || '', // assuming saved field is called `image`
                });

            } catch (err) {
                console.error('Failed to load saved editor content:', err);
            }
        };

        loadSavedJSON();
    }, []);

    const handleMetaSave = async () => {
        if (!editorRef.current) return;

        // Get Lexical's raw JSON editor state
        const jsonContent = editorRef.current.getEditorState().toJSON();

        try {
            const res = await fetch('/api/blog/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...meta,
                    image: meta.coverImage, // used in your DB for cover image
                    content: jsonContent, // Save JSON instead of HTML
                }),
            });

            const result = await res.json();
            console.log('Blog saved as JSON:', result);
            setShowMetaModal(false);
        } catch (err) {
            console.error('Error submitting blog:', err);
        }
    };

    function onChange(editorState: string) {
        setEditorState(editorState);
    }

    function copyHTMLToClipboard() {
        if (!editorRef.current || typeof navigator === 'undefined' || !navigator.clipboard) {
            console.error('Clipboard API not available');
            return;
        }

        if (editorRef.current) {
            const editor = editorRef.current;

            editor.getEditorState().read(() => {
                const html = $generateHtmlFromNodes(editor, null);
                navigator.clipboard.writeText(html)
                    .then(() => console.log('HTML copied to clipboard'))
                    .catch(err => console.error('Failed to copy HTML:', err));
            });
        }

    }

    const handleSubmit = async () => {
        if (!editorRef.current) return;

        const jsonContent = editorRef.current.getEditorState().toJSON();
        let imageNamesArray: string[] = [];

        if (jsonContent.root?.type === 'root') {
            const content: BlogContent = jsonContent as BlogContent;
            imageNamesArray = extractImageNamesFromContent(content);
            console.log('Extracted image names:', imageNamesArray);
        }

        let html = '';
        editorRef.current.getEditorState().read(() => {
            html = $generateHtmlFromNodes(editorRef.current!, null);
        });

        const blogJSON = await fetch('/api/blog/save');
        if (!blogJSON.ok) return;

        const data = await blogJSON.json();

        const formData = new FormData();
        formData.append('title', meta.title);
        formData.append('slug', meta.slug);
        formData.append('excerpt', meta.excerpt);
        formData.append('date', meta.date);
        formData.append('image', meta.coverImage); // cover image
        formData.append('content', html);
        formData.append('imageNames', JSON.stringify(imageNamesArray));
        formData.append('jsonModel', JSON.stringify(data));


        try {

            if (mode === 'edit' && meta.id) {
                // ✅ UPDATE (PUT) request to your client API
                const res = await fetch(`/api/blog/update/${meta.id}`, {
                    method: 'PUT',
                    body: formData,
                });

                const result = await res.json();
                console.log('✅ Blog updated:', result);
            } else {
                // ✅ CREATE (POST) request to direct backend
                const res = await fetch('http://localhost:5000/api/blog/save', {
                    method: 'POST',
                    body: formData,
                });

                const result = await res.json();
                console.log('✅ Blog created:', result);
            }

            await uploadImagesFromBlogJson();

            await fetch('/api/blog/cleanup', {
                method: 'POST',
            });

            editorRef.current.update(() => {
                const root = $getRoot();
                root.clear(); // removes all nodes from the editor
            });

            window.location.href = '/blog/list'; // Redirect to blog list

            setShowMetaModal(false);
        } catch (err) {
            console.error('❌ Error submitting blog:', err);
        }
    };



    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="max-w-3xl mx-auto">
                <Toolbar />
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable
                            className="border p-4 min-h-[300px] rounded-md shadow-sm"
                        />
                    }
                    placeholder={<div className="text-gray-400">Start writing...</div>}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <AutoFocusPlugin />
                <MyOnChangePlugin onChange={onChange} />
                <EditorRefPlugin editorRef={editorRef} />

                {showMetaModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white text-black p-6 rounded-lg max-w-2xl w-full shadow-lg">
                            <h2 className="text-xl font-bold mb-4">Meta Info</h2>

                            {/* Meta Fields */}
                            <input
                                type="text"
                                placeholder="Title"
                                value={meta.title}
                                onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded bg-white text-black placeholder-gray-500"
                            />
                            <input
                                type="text"
                                placeholder="Slug"
                                value={meta.slug}
                                onChange={(e) => setMeta({ ...meta, slug: e.target.value })}
                                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded bg-white text-black placeholder-gray-500"
                            />
                            <input
                                type="text"
                                placeholder="Excerpt"
                                value={meta.excerpt}
                                onChange={(e) => setMeta({ ...meta, excerpt: e.target.value })}
                                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded bg-white text-black placeholder-gray-500"
                            />
                            <input
                                type="date"
                                value={meta.date}
                                onChange={(e) => setMeta({ ...meta, date: e.target.value })}
                                className="w-full mb-4 px-3 py-2 border border-gray-300 rounded bg-white text-black"
                            />

                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const formData = new FormData();
                                    formData.append('image', file);

                                    try {
                                        const res = await fetch('/api/blog/upload', {
                                            method: 'POST',
                                            body: formData,
                                        });
                        

                                        const data = await res.json();
                                        const imageUrl = `/upload/${data.fileName}`; // assuming this is your static path

                                        setMeta((prev) => ({
                                            ...prev,
                                            coverImage: imageUrl,
                                        }));
                                    } catch (err) {
                                        console.error('Image upload failed:', err);
                                    }
                                }}
                                className="w-full mb-4 px-3 py-2 border border-gray-300 rounded bg-white text-black"
                            />
                            {meta.coverImage && (
                                <img    
                                    src={`http://localhost:5000${meta.coverImage}`}
                                    alt="Cover Preview"
                                    className="max-h-40 object-cover rounded shadow"
                                    style={{ width: '100%', height: 'auto' }}
                                />
                            )}

                            {/* Copy Button Below */}
                            {typeof window !== 'undefined' && (
                                <button
                                    onClick={copyHTMLToClipboard}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Copy HTML
                                </button>
                            )}

                            {/* Modal Buttons */}
                            <div className="flex justify-between">
                                <button
                                    onClick={() => setShowMetaModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMetaSave}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Submit Blog
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* Add Meta Info Button */}
                <div className="mt-4">
                    <button
                        onClick={async () => {
                            if (!editorRef.current) return;

                            try {
                                const res = await fetch('/api/blog/save');
                                if (!res.ok) throw new Error('No saved meta');
                                const data = await res.json();

                                setMeta({
                                    id: data.id || '',
                                    title: data.title || '',
                                    slug: data.slug || '',
                                    excerpt: data.excerpt || '',
                                    date: data.date || '',
                                    coverImage: data.image || '',
                                });
                            } catch {
                                // fallback to empty meta
                                setMeta({
                                    id: '',
                                    title: '',
                                    slug: '',
                                    excerpt: '',
                                    date: '',
                                    coverImage: '',
                                });
                            }

                            setShowMetaModal(true);
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Add Meta Info
                    </button>
                </div>
                {/* Submit Button */}
                <div className="mt-6">
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Submit Blog
                    </button>
                </div>
            </div>
        </LexicalComposer>
    );
}
