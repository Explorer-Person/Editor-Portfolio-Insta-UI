// pages/api/save.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_URL;

    if (req.method === 'POST') {
        try {
            console.log(req.body)
            const response = await fetch(`${BACKEND_URL}/api/blog/saveJSON`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req.body), // make sure it's stringified
            });

            const result = await response.json();
            return res.status(response.status).json(result);
        } catch (err) {
            console.error('❌ Error forwarding POST:', err);
            return res.status(500).json({ error: 'Failed to forward POST' });
        }
    }

    if (req.method === 'GET') {
        try {

            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'Missing blog ID in query' });
            }

            const response = await fetch(`${BACKEND_URL}/api/blog/getJSON/${id}`, {
                method: 'GET',
            });

            const result = await response.json();
            return res.status(response.status).json(result);
        } catch (err) {
            console.error('❌ Error forwarding GET:', err);
            return res.status(500).json({ error: 'Failed to forward GET' });
        }
    }

    // Only reached if method is neither POST nor GET
    return res.status(405).json({ message: 'Method not allowed' });
}
