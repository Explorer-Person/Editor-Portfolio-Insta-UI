// pages/api/save.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import fs from 'fs';
import path from 'path';

const SAVE_PATH = path.join(process.cwd(), 'public', 'blog.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const data = req.body;
        fs.writeFileSync(SAVE_PATH, JSON.stringify(data, null, 2));

        return res.status(200).json({ message: 'Saved successfully' });
    }

    if (req.method === 'GET') {
        if (fs.existsSync(SAVE_PATH)) {
            const data = fs.readFileSync(SAVE_PATH, 'utf-8');
            return res.status(200).json(JSON.parse(data));
        } else {
            return res.status(404).json({ message: 'No saved data' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
