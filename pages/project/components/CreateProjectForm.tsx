/* eslint-disable @next/next/no-img-element */
'use client';

import { Project } from '@/interfaces/response';
import { useEffect, useState } from 'react';

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

    useEffect(() => {
        const { min, max } = { min: 10000, max: 99999 };

        if (typeof window === 'undefined') return;

        const cachedId = localStorage.getItem("projectId");

        const determinedId = cachedId
            ? parseInt(cachedId)
            : Math.floor(Math.random() * (max - min + 1)) + min;

        if (!cachedId) {
            localStorage.setItem("projectId", determinedId.toString());
        }

        setForm(prev => ({
            ...prev,
            id: determinedId,
        }));
    }, []);

    const [error, setError] = useState<string | null>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };
    

    useEffect(() => {
        const loadInitial = async () => {
            let data = null;

            if (mode === 'edit' && initialData) {
                data = initialData;
                localStorage.setItem("projectId", data.id.toString())
            } else {
                const res = await fetch('/api/save');
                if (res.ok) {
                    data = await res.json();
                } else {
                    console.error("❌ Failed to load project.json");
                    return;
                }
            }
            // const projectImages = data.imageFiles ? JSON.parse(data.imageFiles) : [];
            // const projectVideos = data.videoFiles ? JSON.parse(data.videoFiles) : [];

            console.log('✅ Loaded initial data:', data);


        };

        if (mode === 'edit' && initialData) {
            loadInitial();
        }
    }, [mode, initialData]);


    useEffect(() => {
        const loadSavedProject = async () => {
            try {
                const id = localStorage.getItem("projectId")
                const res = await fetch(`/api/project/saveJSON?id=${id}`);
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

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const fieldName = e.target.name as 'imageFiles' | 'videoFiles' | 'mainImage'; // mainImage, imageFiles, videoFiles
        const formData = new FormData();

        Array.from(e.target.files).forEach(file => {
            const sanitizedName = sanitizeFilename(file.name);
            const renamedFile = new File([file], sanitizedName, { type: file.type });
            formData.append(fieldName, renamedFile); // 🔥 dynamic field
        });

        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/project/upload`, {
            method: 'POST',
            body: formData,
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
            console.error('❌ Upload failed:', json.error);
            return;
        }
        console.log(form);

        // 🧠 Update form state
        if (fieldName === 'mainImage') {
            setForm(prev => ({
                ...prev,
                mainImage: json.uploaded.mainImage[0],
            }));
        } else {
            setForm(prev => ({
                ...prev,
                [fieldName]: [...(prev[fieldName] as string[]), ...json.uploaded[fieldName]],
            }));
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

            localStorage.removeItem("projectId");
            console.log('project creds removed successfully!')
            window.location.assign("/project/list"); // Reload to reflect changes
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
                        onChange={handleMediaUpload}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                    {form.mainImage && (
                        <div className="mt-2">
                            <img
                                src={form.mainImage} // 🟢 Try the direct Cloudinary/mainImage URL first
                                crossOrigin="anonymous"
                                onError={(e) => {
                                    if (mode !== 'edit') return;
                                    const target = e.currentTarget;

                                    if (!target.dataset.fallback) {
                                        target.dataset.fallback = 'true';
                                        target.src = `${process.env.NEXT_PUBLIC_SERVER_URL}/upload/project/${form.mainImage}`; // 🟡 Fallback to project folder
                                    } else {
                                        console.warn(`⚠️ Fallback also failed: ${form.mainImage}`);
                                        target.style.display = 'none'; // Or show a placeholder if you prefer
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
                        onChange={handleMediaUpload}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                        {form.imageFiles.map((img: string, idx: number) => (
                            <div key={idx} className="relative">
                                <img
                                    src={img} // 🟢 Attempt direct URL (like Cloudinary)
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        if (mode !== 'edit') return;
                                        const target = e.currentTarget;

                                        if (!target.dataset.fallbackStage) {
                                            target.dataset.fallbackStage = 'project'; // 🟡 First fallback
                                            target.src = `${process.env.NEXT_PUBLIC_SERVER_URL}/upload/project/${img}`;
                                        } else if (target.dataset.fallbackStage === 'project') {
                                            target.dataset.fallbackStage = 'imageFiles'; // 🔁 Second fallback
                                            target.src = `${process.env.NEXT_PUBLIC_SERVER_URL}/upload/imageFiles/${img}`;
                                        } else {
                                            console.warn(`⚠️ [EditMode] Image "${img}" failed to load from all sources.`);
                                            target.style.display = 'none'; // Or set a placeholder
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
                        onChange={handleMediaUpload}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {form.videoFiles.map((vid, idx) => (
                            <div key={idx} className="relative">
                                <video
                                    src={vid} // 🟢 Attempt direct link (e.g., Cloudinary)
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        if (mode !== 'edit') return;
                                        const target = e.currentTarget;

                                        if (!target.dataset.fallbackStage) {
                                            target.dataset.fallbackStage = 'project';
                                            target.src = `${process.env.NEXT_PUBLIC_SERVER_URL}/upload/project/${vid}`;
                                        } else if (target.dataset.fallbackStage === 'project') {
                                            target.dataset.fallbackStage = 'videoFiles';
                                            target.src = `${process.env.NEXT_PUBLIC_SERVER_URL}/upload/videoFiles/${vid}`;
                                        } else {
                                            console.warn(`⚠️ [EditMode] Video "${vid}" failed to load from all sources.`);
                                            target.style.display = 'none'; // ❌ Final fallback
                                        }
                                    }}
                                    controls
                                    className="w-full h-48 object-cover rounded-md border border-gray-300"
                                />


                                <button
                                    type="button"
                                    onClick={() => handleRemoveMedia('videoFiles', idx)}
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
