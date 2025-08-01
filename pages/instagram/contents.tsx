'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2, RefreshCcw } from 'lucide-react';

type InstaContent = {
    id: number;
    link: string;
    type: string;
    img_index?: number;
    postURL: string;
};

export function InstaMediaCard({ id, link, type, postURL }: InstaContent) {
    const [fallbackToImage, setFallbackToImage] = useState(false);
    const [imageLoadFailed, setImageLoadFailed] = useState(false);

    const srcURL = `http://localhost:5000/api/instagram/media/${id}`;

    const isVideo = useMemo(() => {
        try {
            const url = new URL(link);
            url.searchParams.delete('bytestart');
            url.searchParams.delete('byteend');
            return url.pathname.endsWith('.mp4');
        } catch (e) {
            console.warn("Invalid media URL", link);
            return false;
        }
    }, [link]);

    return (
        <div className="min-w-[300px] max-w-xs shrink-0 p-4 border rounded-md bg-white shadow-sm snap-start">
            {!fallbackToImage && isVideo ? (
                <video
                    src={srcURL}
                    controls
                    crossOrigin="anonymous"
                    onError={() => {
                        console.warn("🎥 Video failed, falling back to image.");
                        setFallbackToImage(true);
                    }}
                    className="w-full h-56 object-cover bg-black"
                />
            ) : !imageLoadFailed ? (
                <img
                    src={srcURL}
                    crossOrigin="anonymous"
                    alt="Instagram media"
                    onError={() => {
                        console.warn("🖼️ Image load failed, not retrying.");
                        setImageLoadFailed(true);
                    }}
                    className="w-full h-56 object-cover"
                />
            ) : (
                <div className="w-full h-56 flex items-center justify-center bg-gray-100 text-sm text-gray-500">
                    ⚠️ Media not available
                </div>
            )}

            <a
                href={postURL}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 underline text-sm mt-2 block"
            >
                View on Instagram
            </a>
        </div>
    );
}

export default function InstagramContentsPage() {
    const [contents, setContents] = useState<InstaContent[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchContentsFromDB = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/instagram/getfromdb');
            const data = await res.json();
            if (res.status === 404 || !Array.isArray(data)) {
                setContents([]);
            } else {
                setContents(data);
            }
        } catch (err) {
            console.error('❌ Error fetching from DB:', err);
            setContents([]);
        }
    };

    const triggerInstaSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/instagram/savetodb');
            if (!res.ok) throw new Error('Failed to fetch/scrape');
            await fetchContentsFromDB();
        } catch (err) {
            console.error('❌ Scrape error:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchContentsFromDB();
    }, []);

    // 🔁 Group items by postURL
    const grouped = useMemo(() => {
        const map = new Map<string, InstaContent[]>();
        contents.forEach((item) => {
            const group = map.get(item.postURL) || [];
            group.push(item);
            map.set(item.postURL, group);
        });
        return Array.from(map.entries());
    }, [contents]);

    return (
        <main className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">📸 Instagram Contents</h1>
                    <button
                        onClick={triggerInstaSave}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin w-5 h-5" />
                                Fetching...
                            </>
                        ) : (
                            <>
                                <RefreshCcw className="w-5 h-5" />
                                Fetch & Save
                            </>
                        )}
                    </button>
                </div>

                {contents.length === 0 ? (
                    <p className="text-center text-gray-500 text-lg">No Content Available</p>
                ) : (
                    <div className="space-y-10">
                        {grouped.map(([postURL, group], i) => (
                            <div key={i}>
                                <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory">
                                    {group.map((item) => (
                                        <InstaMediaCard
                                            key={item.id}
                                            id={item.id}
                                            link={item.link}
                                            type={item.type}
                                            postURL={item.postURL}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
