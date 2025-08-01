// pages/api/project/save.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import type { SaveProjectResponse } from '@/interfaces/response'; // Adjust path if needed

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<SaveProjectResponse>
) {
    if (req.method === 'POST') {
        try {
            const response = await fetch('http://localhost:5000/api/project/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req.body),
            });

            const data = await response.json();

            if (!response.ok) {
                return res.status(response.status).json({
                    success: false,
                    error: data.error || 'Failed to save project',
                });
            }

            return res.status(200).json({
                success: true,
                id: data.id,
            });
        } catch (err: unknown) {
            console.error('❌ Proxy error:', err);
            const errorMessage =
                err instanceof Error ? err.message : 'Proxy failed';
            return res.status(500).json({ success: false, error: errorMessage });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
