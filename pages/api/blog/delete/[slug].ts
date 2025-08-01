import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'Missing slug parameter' });

    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/blog/delete/${slug}`);

        return res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching blog:', error);
        return res.status(500).json({ error: 'Failed to fetch blog' });
    }
}
