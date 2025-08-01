// pages/api/project/deleteOne.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import type { BaseResponse } from '@/interfaces/response'; // Define if not existing

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<BaseResponse>
) {
    if (req.method === 'DELETE') {
        try {
            const { id } = req.body;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing project ID',
                });
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/project/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                return res.status(response.status).json({
                    success: false,
                    error: data.error || 'Failed to delete project',
                });
            }

            return res.status(200).json({ success: true });
        } catch (err: unknown) {
            console.error('❌ Proxy delete error:', err);
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
