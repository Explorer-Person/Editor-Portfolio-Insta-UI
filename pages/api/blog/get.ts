// This is correct for Pages Router
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const response = await axios.get('http://localhost:5000/api/blog/get');
        console.log('Fetched blogs:', response.data);
        return res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return res.status(500).json({ error: 'Failed to fetch blogs' });
    }
}
