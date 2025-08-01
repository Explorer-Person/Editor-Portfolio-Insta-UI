'use client';

import { Project } from '@/interfaces/response';
import { use, useEffect, useState } from 'react';

type Props = {
    mode: 'create' | 'edit';
    initialData?: Project | null;
};

export default function CreateProjectPage({ mode, initialData }: Props) {

    const [form, setForm] = useState<Project>({
        id: 0,
        title: '',
        description: '',
        mainImage: '',
        imageFiles: [],
        videoFiles: [],
        hashtags: '',
        githubLink: '',
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };
    const saveProjectJson = async (data: Project) => {
        if (!data) return;

        const payload = {
            id: data.id || 0,
            title: data.title || '',
            description: data.description || '',
            mainImage: data.mainImage || '',
            imageFiles: data.imageFiles || '',
            videoFiles: data.videoFiles || '',
            hashtags: data.hashtags || '',
            githubLink: data.githubLink || '',
        };

        try {
            const res = await fetch('/api/project/saveJSON', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                console.error('❌ Failed to save project.json:', json.error);
            } else {
                console.log('✅ project.json saved successfully');
            }
        } catch (err) {
            console.error('❌ Error saving project.json:', err);
        }
    };

    useEffect(() => {
        const loadInitial = async () => {
            let data = null;

            if (mode === 'edit' && initialData) {
                data = initialData;
            } else {
                const res = await fetch('/project.json');
                if (res.ok) {
                    data = await res.json();
                } else {
                    console.error("❌ Failed to load project.json");
                    return;
                }
            }
            const projectImages = data.imageFiles ? JSON.parse(data.imageFiles) : [];
            const projectVideos = data.videoFiles ? JSON.parse(data.videoFiles) : [];

            console.log('✅ Loaded initial data:', data);

            // Set form with existing imageFiles and videoFiles (no fetch from directories)
            setForm({
                id: data.id || 0,
                title: data.title || '',
                description: data.description || '',
                mainImage: data.mainImage || '',
                imageFiles: projectImages || [],
                videoFiles: projectVideos || [],
                hashtags: data.hashtags || '',
                githubLink: data.githubLink || '',
            });

            // Save current data to project.json
            await saveProjectJson({
                id: data.id || 0,
                title: data.title || '',
                description: data.description || '',
                mainImage: data.mainImage || '',
                imageFiles: projectImages || [],
                videoFiles: projectVideos || [],
                hashtags: data.hashtags || '',
                githubLink: data.githubLink || '',
            });
        };

        if (mode === 'edit' && initialData) {
            loadInitial();
        }
    }, [mode, initialData]);


    useEffect(() => {
        const loadSavedProject = async () => {
            try {
                const res = await fetch('/project.json');
                if (!res.ok) {
                    console.warn('No existing JSON found.');
                    return;
                }


                const data = await res.json();
                console.log(data)

                setForm({
                    id: data.id || 0,
                    title: data.title || '',
                    description: data.description || '',
                    mainImage: data.mainImage || '',
                    imageFiles: data.imageFiles || '',
                    videoFiles: data.videoFiles || '',
                    hashtags: data.hashtags || '',
                    githubLink: data.githubLink || '',
                });

                console.log('✅ Loaded project.json');
            } catch (err) {
                console.error('❌ Failed to load project.json:', err);
            }
        };

        loadSavedProject();
    }, []);





    const sanitizeFilename = (filename: string) => {
        const timestamp = Date.now();
        const name = filename
            .toLowerCase()
            .replace(/\s+/g, '-')            // replace spaces with hyphens
            .replace(/[^a-z0-9.\-_]/g, '');  // remove special characters except dots, hyphens, underscores
        return `${timestamp}-${name}`;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const name = e.target.name;

        console.log('📥 Uploading files for:', name);

        const formData = new FormData();

        Array.from(e.target.files).forEach(file => {
            const sanitizedName = sanitizeFilename(file.name);
            const renamedFile = new File([file], sanitizedName, { type: file.type });
            formData.append('file', renamedFile);
        });

        formData.append('name', name); // Append the name to identify the category

        console.log('📤 Sending FormData:', formData);

        const res = await fetch('/api/project/upload', {
            method: 'POST',
            body: formData,
        });

        const json = await res.json();
        if (json.success) {
            if (name === 'imageFiles' || name === 'videoFiles') {
                setForm(prev => ({
                    ...prev,
                    [name]: [...(prev[name] as string[]), ...json.files],
                }));
            } else if (name === 'mainImage') {
                setForm(prev => ({
                    ...prev,
                    mainImage: json.files[0], // only 1 main image
                }));
            }
        }
    };

    const handleRemoveMedia = (type: 'imageFiles' | 'videoFiles', index: number) => {
        setForm(prev => {
            const updatedList = [...(Array.isArray(prev[type]) ? prev[type] : JSON.parse(prev[type] || '[]'))];
            updatedList.splice(index, 1); // remove item at index
            return {
                ...prev,
                [type]: updatedList,
            };
        });
    };


    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const formData = new FormData();

        Array.from(e.target.files).forEach(file => {
            const sanitizedName = sanitizeFilename(file.name);
            const renamedFile = new File([file], sanitizedName, { type: file.type });
            formData.append('file', renamedFile);
        });

        formData.append('name', 'videoFiles'); // Append the name to identify the category

        const res = await fetch('/api/project/upload', {
            method: 'POST',
            body: formData,
        });

        const json = await res.json();
        if (json.success) {
            setForm(prev => ({
                ...prev,
                videoFiles: [...prev.videoFiles, ...json.files],
            }));
        }
    };

    const uploadMediaFromJson = async () => {
        try {


            const imageFilenames = form.imageFiles;
            const videoFilenames = form.videoFiles;
            const mainImageName = form.mainImage || "";

            const formData = new FormData();

            // Append images
            for (const fileName of imageFilenames) {
                try {
                    const imageRes = await fetch(`/upload/imageFiles/${fileName}`);
                    if (!imageRes.ok) {
                        console.warn(`⚠️ Skipping image ${fileName}, fetch failed`);
                        continue;
                    }
                    const blob = await imageRes.blob();
                    formData.append('imageFiles', blob, fileName);
                } catch (err) {
                    console.warn(`⚠️ Error fetching image ${fileName}:`, err);
                }
            }

            // Append videos
            for (const fileName of videoFilenames) {
                try {
                    const videoRes = await fetch(`/upload/videoFiles/${fileName}`);
                    if (!videoRes.ok) {
                        console.warn(`⚠️ Skipping video ${fileName}, fetch failed`);
                        continue;
                    }
                    const blob = await videoRes.blob();
                    formData.append('videoFiles', blob, fileName);
                } catch (err) {
                    console.warn(`⚠️ Error fetching video ${fileName}:`, err);
                }
            }

            try {
                const mainImageRes = await fetch(`/upload/mainImage/${mainImageName}`);
                if (!mainImageRes.ok) {
                    console.warn(`⚠️ Skipping mainImage ${mainImageName}, fetch failed`);
                } else {
                    const blob = await mainImageRes.blob();
                    formData.append('mainImage', blob, mainImageName);
                }

            } catch (err) {
                console.warn(`⚠️ Error fetching mainImage ${mainImageName}:`, err);
            }

            // Send FormData to your actual backend API
            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/project/uploadMedia`, {
                method: 'POST',
                body: formData,
            });

            const result = await uploadRes.json();
            if (uploadRes.ok) {
                console.log('✅ Media upload success:', result);
            } else {
                console.error('❌ Upload failed:', result.error);
            }
        } catch (err) {
            console.error('❌ uploadMediaFromJson failed:', err);
        }
    };


    const handleSaveAsJson = async () => {
        const payload = {
            id: form.id || 0, // Use existing ID or generate new one
            title: form.title,
            description: form.description,
            mainImage: form.mainImage,
            imageFiles: form.imageFiles,
            videoFiles: form.videoFiles,
            hashtags: form.hashtags,
            githubLink: form.githubLink || '',
        };

        try {
            const res = await fetch('/api/project/saveJSON', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                setError(json.error || 'Failed to save JSON');
            } else {
                console.log('✅ Saved JSON:', json);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unexpected error');
        }
    };

    const handleSaveAndUploadAll = async () => {
        const payload = {
            id: form.id && form.id !== 0 ? form.id : Math.floor(Math.random() * 1_000_000),
            title: form.title,
            description: form.description,
            mainImage: form.mainImage,
            imageFiles: form.imageFiles,
            videoFiles: form.videoFiles,
            hashtags: form.hashtags,
            githubLink: form.githubLink || '',
        };

        const isEdit = mode === 'edit'; // <- you determine this from props/state

        try {
            console.log('📦 Saving project data:', payload, isEdit);
            const res = await fetch(isEdit ? '/api/project/update' : '/api/project/save', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || 'Project save/update failed');

            // ✅ Upload media files
            await uploadMediaFromJson();

            // ✅ Cleanup local files
            await fetch('/api/project/cleanup', { method: 'DELETE' });
            console.log('🧹 Local cleanup complete');
            window.location.reload(); // Reload to reflect changes
        } catch (err) {
            console.error('❌ handleSaveAndUploadAll error:', err);
            setError(err instanceof Error ? err.message : 'Unexpected error');
        }
    };


    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Create New Project</h1>

            <form className="space-y-4">
                <input
                    name="title"
                    placeholder="Project Title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded"
                />

                <textarea
                    name="description"
                    placeholder="Project Description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    required
                    className="w-full border p-2 rounded"
                />

                <div className="space-y-2 mt-4">
                    <label className="block text-sm font-medium text-gray-700">📌 Project Cover Image</label>
                    <input
                        type="file"
                        name='mainImage'
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                    {form.mainImage && (
                        <div className="mt-2">
                            <img
                                src={`/upload/mainImage/${form.mainImage}`}
                                crossOrigin="anonymous"
                                onError={(e) => {
                                    if (mode !== 'edit') return;
                                    const target = e.currentTarget;
                                    if (!target.dataset.fallback) {
                                        target.dataset.fallback = 'true';
                                        target.src = `${process.env.NEXT_PUBLIC_SERVER_URL}/upload/mainImage/${form.mainImage}`;
                                    } else {
                                        console.warn(`⚠️ Image ${form.mainImage} failed to load on both local and fallback.`);
                                    }
                                }}
                                alt={`Uploaded ${form.mainImage}`}
                                className="w-full h-40 object-cover rounded-md border border-gray-300"
                            />
                        </div>
                    )}
                </div>


                {/* ✅ Image Upload */}
                <div className="space-y-2 mt-6">
                    <label className="block text-sm font-medium text-gray-700">🖼️ Project Images</label>
                    <input
                        type="file"
                        name='imageFiles'
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                        {form.imageFiles.map((img, idx) => (
                            <div key={idx} className="relative">
                                <img
                                    src={`/upload/imageFiles/${img}`}
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        if (mode !== 'edit') return;
                                        const target = e.currentTarget;
                                        if (!target.dataset.fallbackAttempted) {
                                            target.dataset.fallbackAttempted = 'true';
                                            target.src = `${process.env.NEXT_PUBLIC_SERVER_URL}/upload/imageFiles/${img}`;
                                        } else {
                                            console.warn(`⚠️ [EditMode] Image "${img}" failed to load.`);
                                            target.style.display = 'none';
                                        }
                                    }}
                                    alt={`Uploaded ${img}`}
                                    className="w-full h-32 object-cover rounded-md border border-gray-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMedia('imageFiles', idx)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>



                {/* ✅ Video Upload */}
                <div className="space-y-2 mt-6">
                    <label className="block text-sm font-medium text-gray-700">🎬 Project Videos</label>
                    <input
                        type="file"
                        name='videoFiles'
                        accept="video/*"
                        multiple
                        onChange={handleVideoUpload}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {form.videoFiles.map((vid, idx) => (
                            <div key={idx} className="relative">
                                <video
                                    src={`/upload/videoFiles/${vid}`}
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        if (mode !== 'edit') return;
                                        const target = e.currentTarget;
                                        if (!target.dataset.fallbackAttempted) {
                                            target.dataset.fallbackAttempted = 'true';
                                            target.src = `${process.env.NEXT_PUBLIC_SERVER_URL}/upload/videoFiles/${vid}`;
                                        } else {
                                            console.warn(`⚠️ [EditMode] Video "${vid}" failed to load.`);
                                            target.style.display = 'none';
                                        }
                                    }}
                                    controls
                                    className="w-full h-48 object-cover rounded-md border border-gray-300"
                                />

                                <button
                                    type="button"
                                    onClick={() => handleRemoveMedia('imageFiles', idx)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                                >
                                    ✕
                                </button>
                            </div>

                        ))}
                    </div>
                </div>



                <input
                    name="hashtags"
                    placeholder="Hashtags"
                    value={form.hashtags}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                />

                <input
                    name="githubLink"
                    placeholder="GitHub Link (optional)"
                    value={form.githubLink}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                />

                {error && <p className="text-red-500">{error}</p>}
                <button
                    type="button"
                    onClick={handleSaveAsJson}
                    className="mt-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                    💾 Save JSON Only
                </button>

                <button
                    type="button"
                    onClick={handleSaveAndUploadAll}
                    className="mt-4 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                >
                    🚀 Save and Upload Everything
                </button>

            </form>
        </div>
    );
}
