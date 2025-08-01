'use client';

import { useEffect, useState } from 'react';
import CreateProjectForm from '@/pages/project/components/CreateProjectForm'; // Reusing the component
import { Project } from '@/interfaces/response';
import { useRouter } from 'next/router';

export default function EditProjectPage() {
    const router = useRouter() // ✅ Now safe after 'use client'
    const id = router.query.id as string; // Get the ID from the URL

    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<Project | null>(null);

    useEffect(() => {
        if (!id) return;
        console.log('Fetching project with ID:', id);
        const fetchProject = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/project/get/${id}`);
                const json = await res.json();
                console.log('Fetched project data:', json);
                if (!res.ok || !json.success) throw new Error(json.error || 'Fetch failed');
                setInitialData(json.project);
            } catch (err) {
                console.error('❌ Failed to fetch project:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    if (loading) return <p>Loading...</p>;
    if (!initialData) return <p>Project not found.</p>;

    return <CreateProjectForm mode="edit" initialData={initialData} />;
}
