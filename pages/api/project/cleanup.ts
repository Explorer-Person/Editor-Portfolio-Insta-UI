// pages/api/project/cleanup.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

type CleanupResponse = {
    success: boolean;
    message?: string;
    error?: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<CleanupResponse>) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const publicDir = path.join(process.cwd(), 'public');
        const jsonPath = path.join(publicDir, 'project.json');
        const folderNames = ['imageFiles', 'videoFiles', 'mainImage'];
        const mediaDir = path.join(publicDir, 'upload');

        // Delete project.json
        if (fs.existsSync(jsonPath)) {
            fs.unlinkSync(jsonPath);
            console.log('🗑️ Deleted: project.json');
        }

    

        // Delete medias
        for (const folder of folderNames) {
            const folderPath = path.join(mediaDir, folder);
            if (fs.existsSync(folderPath)) {
                fs.readdirSync(folderPath).forEach(file => {
                    const filePath = path.join(folderPath, file);
                    if (fs.lstatSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️ Deleted ${folder}:`, file);
                    }
                });
            }
        }
        
        return res.status(200).json({ success: true, message: 'Cleanup completed successfully' });
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('❌ Cleanup error:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        
    }
}
