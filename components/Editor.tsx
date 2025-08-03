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

    useEffect(() => {
        const { min, max } = { min: 10000, max: 99999 };

        if (typeof window === 'undefined') return;

        const cachedId = localStorage.getItem("blogId");

        const determinedId = cachedId
            ? parseInt(cachedId)
            : Math.floor(Math.random() * (max - min + 1)) + min;

        if (!cachedId) {
            localStorage.setItem("blogId", determinedId.toString());
        }

        setMeta(prev => ({
            ...prev,
            id: determinedId.toString(),
        }));
    }, []);

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


    useEffect(() => {
        if (mode === 'edit' && initialData) {
            console.log('💬 initialData.image:', initialData);

            console.log('💬 initialData.id:', initialData.id);

            const strongObj = initialData || meta;

            setMeta({
                id: strongObj.id.toString(),
                title: strongObj.title,
                slug: strongObj.slug,
                excerpt: strongObj.excerpt,
                date: strongObj.date,
                coverImage: strongObj.image,
            });

        }
    }, [mode, initialData]);

    useEffect(() => {
        console.log('✅ Meta updated:', meta);
    }, [meta]);



    useEffect(() => {

        const loadSavedJSON = async () => {
            try {
                
                const res = await fetch(`/api/blog/saveJSON?id=${meta.id}`);
                if (!res.ok) return;

                const response = await res.json();
                const data = response.blog;
                console.log(data)
                const editor = editorRef.current;

                if (editor && data.content) {
                    editor.update(() => {
                        const editorState = editor.parseEditorState(JSON.stringify(data.content));
                        editor.setEditorState(editorState);
                    });
                }

                if (data.image === '') {
                    return
                }

                // ✅ Set default meta values from saved JSON:
                setMeta({
                    id: data.id || '',
                    title: data.title || '',
                    slug: data.slug || '',
                    excerpt: data.excerpt || '',
                    date: data.date || '',
                    coverImage: data.coverImage || '', // assuming saved field is called `image`
                });

            } catch (err) {
                console.error('Failed to load saved editor content:', err);
            }
        };
        loadSavedJSON();

    }, [initialData, meta.id]);

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.getEditorState().read(() => {
                const content = $getRoot().getTextContent();
                console.log('🧾 Current content:', content);
            });
        }
    }, [editorRef.current]);

    const handleMetaSave = async () => {
        if (!editorRef.current) return;

        // Get Lexical's raw JSON editor state
        const jsonContent = editorRef.current.getEditorState().toJSON();

        try {
            const res = await fetch('/api/blog/saveJSON', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...meta,                      // includes: title, slug, excerpt, date, etc.
                    coverImage: meta.coverImage,  // ✅ used as the only image field
                    content: jsonContent,   // ✅ Lexical JSON
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

    useEffect(()=>{
        console.log(editorState);
    },[editorState])

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

        const blogJSON = {
            ...meta,
            image: meta.coverImage,
            content: jsonContent, // ✅ Instead of sending as 'jsonModel'
        };
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

        try {
            // Prepare payload
            const blogData = {
                id: meta.id,
                title: meta.title,
                slug: meta.slug,
                excerpt: meta.excerpt,
                date: meta.date,
                image: meta.coverImage,
                content: html,
                imageNames: imageNamesArray,
                jsonModel: blogJSON,
            };

            let res;
            if (mode === 'edit' && meta.id) {
                res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/blog/update/${meta.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(blogData),
                });
            } else {
                res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/blog/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(blogData),
                });
            }

            const result = await res.json();
            console.log('✅ Blog submitted:', result);

            editorRef.current.update(() => {
                const root = $getRoot();
                root.clear(); // Clear editor after save
            });

            localStorage.removeItem("blogId");

            window.location.href = '/blog/list'; // Redirect
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
                                value={meta.date ? meta.date.split('T')[0] : ''}  // ✅ "1212-12-11"
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
                                        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/blog/upload`, {
                                            method: 'POST',
                                            body: formData,
                                        });

                                        const data = await res.json();

                                        if (res.ok) {
                                            const imageName = `${data.fileName}`;
                                            setMeta(prev => ({ ...prev, coverImage: imageName }));
                                            console.log('✅ Image uploaded:', imageName);
                                        } else {
                                            console.error('❌ Upload failed:', data.error);
                                        }
                                    } catch (err) {
                                        console.error('❌ Network or server error:', err);
                                    }
                                }}
                            />

                            {meta.coverImage && (
                                <img
                                    src={`${process.env.NEXT_PUBLIC_SERVER_URL}/upload/blog/${meta.coverImage}`}
                                    alt="Cover Preview"
                                    className="max-h-40 object-cover rounded shadow"
                                    style={{ width: '100%', height: 'auto' }}
                                    onError={(e) => {
                                        const fallbackURL = meta.coverImage.startsWith('http')
                                            ? meta.coverImage
                                            : `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/${meta.coverImage}`;
                                        e.currentTarget.src = fallbackURL;
                                    }}
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
                                const res = await fetch(`/api/blog/saveJSON?id=${meta.id}`);
                                if (!res.ok) throw new Error('No saved meta');
                                const response = await res.json();
                                const data = response.blog;
                                setMeta({
                                    id: data.id || '',
                                    title: data.title || '',
                                    slug: data.slug || '',
                                    excerpt: data.excerpt || '',
                                    date: data.date || '',
                                    coverImage: data.coverImage,
                                });
                            } catch {
                                // fallback to empty meta
                                const id = localStorage.getItem("blogId")
                                setMeta({
                                    id: id || '',
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
