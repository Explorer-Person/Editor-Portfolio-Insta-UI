import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Project } from '@/interfaces/response';

const SAVE_PATH = path.join(process.cwd(), 'public', 'project.json');



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const data = req.body as Project;

            const id = Date.now();
            const entry = {
                ...data,
                created_at: new Date().toISOString(),
            };

            fs.writeFileSync(SAVE_PATH, JSON.stringify(entry, null, 2));
            return res.status(200).json({ success: true, id });
        } catch (err: unknown) {
            console.error('❌ Failed to save project:', err);
            return res.status(500).json({ success: false, error: 'Failed to save project' });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
