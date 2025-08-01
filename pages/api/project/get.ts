// pages/api/project/get.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import type { GetProjectResponse } from '@/interfaces/response'; // Adjust import as needed

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<GetProjectResponse>
) {
    if (req.method === 'GET') {
        try {
            const response = await fetch('http://localhost:5000/api/project/get', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                return res.status(response.status).json({
                    success: false,
                    error: data.error || 'Failed to fetch projects',
                });
            }

            return res.status(200).json({
                success: true,
                projects: data.projects,
            });
        } catch (err: unknown) {
            console.error('❌ Proxy fetch error:', err);
            return res.status(500).json({
                success: false,
                error: err instanceof Error ? err.message : 'Proxy error',
            });
        }
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed',
    });
}
