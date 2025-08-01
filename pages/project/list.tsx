'use client';

import { useEffect, useState } from 'react';
import type { Project } from '@/interfaces/response';

const BASE_URL = 'http://localhost:5000';

type RawProject = Omit<Project, 'imageFiles' | 'videoFiles'> & {
    imageFiles: string;
    videoFiles: string;
};


export default function ListProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/project/get');
                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.error || 'Failed to fetch');
                }

                setProjects(
                    (data.projects || []).map((project: RawProject) => ({
                        ...project,
                        imageFiles: project.imageFiles ? JSON.parse(project.imageFiles) : [],
                        videoFiles: project.videoFiles ? JSON.parse(project.videoFiles) : [],
                    }))
                );

            } catch (err) {
                console.error('❌ Error loading projects:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const updateProject = async (id: bigint) => {
        window.location.href = `/project/update/${id}`;
    }

    const deleteProject = async (id: bigint) => {
        try {
            const res = await fetch('/api/project/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to delete');
            }

            setProjects(prev => prev.filter(p => p.id !== id));
            setSelectedProject(null);
        } catch (err) {
            console.error('❌ Deletion error:', err);
            alert(
                err instanceof Error ? err.message : 'An error occurred while deleting the project.'
            );
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-center text-black">📁 Project Showcase</h1>

            {loading && <p className="text-black text-center">Loading...</p>}
            {error && <p className="text-red-600 text-center">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <div
                        key={project.id.toString()}
                        onClick={() => setSelectedProject(project)}
                        className="cursor-pointer bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                        {project.mainImage && (
                            <img
                                crossOrigin='anonymous'
                                src={`${BASE_URL}/upload/mainImage/${project.mainImage}`}
                                alt={project.title}
                                className="w-full h-48 object-cover"
                            />
                        )}
                        <div className="p-4 text-black">
                            <h2 className="text-xl font-semibold mb-1">{project.title}</h2>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center px-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 text-black relative">
                        <button
                            onClick={() => setSelectedProject(null)}
                            className="absolute top-4 right-4 text-black text-xl font-bold"
                        >
                            ×
                        </button>

                        <h2 className="text-2xl font-bold mb-2 text-black">{selectedProject.title}</h2>
                        <p className="mb-4 text-sm text-black">
                            {selectedProject.description}
                        </p>

                        {/* Images */}
                        {selectedProject.imageFiles.length > 0 && (
                            <>
                                <h4 className="text-lg font-semibold text-black mb-2">Images</h4>
                                <div className="flex flex-wrap gap-3">
                                    {selectedProject.imageFiles.map((img, i) => (
                                        <img
                                            key={i}
                                            src={`${BASE_URL}/upload/imageFiles/${img}`}
                                            alt={`popup-img-${i}`}
                                            className="w-40 h-28 object-cover rounded border"
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Videos */}
                        {selectedProject.videoFiles.length > 0 && (
                            <>
                                <h4 className="text-lg font-semibold mt-6 text-black mb-2">Videos</h4>
                                <div className="flex flex-wrap gap-4">
                                    {selectedProject.videoFiles.map((vid, i) => (
                                        <video
                                            key={i}
                                            src={`${BASE_URL}/upload/videoFiles/${vid}`}
                                            controls
                                            className="w-60 h-36 rounded border"
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* GitHub & hashtags */}
                        {selectedProject.hashtags && (
                            <p className="mt-4 text-sm text-black">{selectedProject.hashtags}</p>
                        )}
                        {selectedProject.githubLink && (
                            <a
                                href={selectedProject.githubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 underline"
                            >
                                🔗 GitHub
                            </a>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-end gap-4">
                            <button
                                onClick={() => {
                                    // Replace with your update handler
                                    console.log('Update clicked for:', selectedProject.id);
                                    updateProject(selectedProject.id);
                                }}
                                className="bg-yellow-400 text-black font-medium px-4 py-2 rounded hover:bg-yellow-500 transition"
                            >
                                ✏️ Update
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this project?')) {
                                        deleteProject(selectedProject.id);
                                    }
                                }}
                                className="bg-red-500 text-white font-medium px-4 py-2 rounded hover:bg-red-600 transition"
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
