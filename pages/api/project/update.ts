// pages/api/project/update.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import type { SaveProjectResponse } from '@/interfaces/response'; // adjust path if needed

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<SaveProjectResponse>
) {
    if (req.method === 'PUT') {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/project/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req.body),
            });

            console.log('🔄 Update request body:', response);
            const data = await response.json();


            if (!response.ok) {
                return res.status(response.status).json({
                    success: false,
                    error: data.error || 'Failed to update project',
                });
            }

            return res.status(200).json({
                success: true,
                id: data.id,
            });
        } catch (err: unknown) {
            console.error('❌ Proxy error (update):', err);
            const errorMessage =
                err instanceof Error ? err.message : 'Update proxy failed';
            return res.status(500).json({ success: false, error: errorMessage });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
