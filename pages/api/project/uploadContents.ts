// pages/api/project/uploadTrigger.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { filePath, type } = req.body;

    if (!filePath || !type) {
        return res.status(400).json({ success: false, error: 'Missing filePath or type' });
    }

    const fullPath = path.join(process.cwd(), 'public', filePath.replace(/^\/upload\//, 'upload/'));

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ success: false, error: 'File does not exist on server' });
    }

    // Simulate upload process (e.g., to cloud, CDN, or DB)
    console.log(`🚀 Uploading ${type.toUpperCase()} from: ${fullPath}`);

    return res.status(200).json({ success: true });
}
