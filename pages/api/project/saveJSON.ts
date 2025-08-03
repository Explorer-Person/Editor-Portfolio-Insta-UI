import type { NextApiRequest, NextApiResponse } from 'next';
import { Project } from '@/interfaces/response';




export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const data = req.body as Project;

            // 📨 Forward to backend
            const serverRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/project/saveJSON`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!serverRes.ok) {
                const errorText = await serverRes.text();
                throw new Error(`Server responded with ${serverRes.status}: ${errorText}`);
            }

            const serverResponse = await serverRes.json();


            return res.status(200).json({ success: true, serverResponse });
        } catch (err: unknown) {
            let errorMessage = 'Failed to save project';

            if (err instanceof Error) {
                errorMessage = err.message;
                console.error('❌ Failed to save project:', err);
            } else {
                console.error('❌ Unknown error:', err);
            }

            return res.status(500).json({ success: false, error: errorMessage });
        }
    }
    if (req.method === 'GET') {
        try {

            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'Missing project ID in query' });
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/upload/project/project-${id}.json`, {
                method: 'GET',
            });

            const result = await response.json();
            return res.status(response.status).json(result);
        } catch (err) {
            console.error('❌ Error forwarding GET:', err);
            return res.status(500).json({ error: 'Failed to forward GET' });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
