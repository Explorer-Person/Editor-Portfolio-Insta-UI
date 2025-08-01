import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'upload');
const blogJsonPath = path.join('public', 'blog.json');
const EXPIRATION_HOURS = 0;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST method allowed' });
    }

    try {
        console.log('📁 Upload directory:', uploadDir);
        const files = fs.readdirSync(uploadDir);
        const now = Date.now();

        files.forEach((file) => {
            const filePath = path.join(uploadDir, file);

            if (!fs.existsSync(filePath)) {
                console.log(`❌ Skipped non-existent file: ${file}`);
                return;
            }

            if (file === 'blog.json') {
                console.log('⏩ Skipping blog.json in loop');
                return;
            }

            const stat = fs.statSync(filePath);
            const ageHours = (now - stat.mtimeMs) / (1000 * 60 * 60);
            console.log(`📦 ${file} is ${ageHours.toFixed(2)} hours old`);

            if (ageHours > EXPIRATION_HOURS) {
                fs.unlinkSync(filePath);
                console.log(`🗑 Deleted: ${file}`);
            }
        });

        // ✅ Delete blog.json explicitly (after loop)
        console.log('🔍 Checking blog.json path:', blogJsonPath);
        if (fs.existsSync(blogJsonPath)) {
            fs.unlinkSync(blogJsonPath);
            console.log('✅ blog.json deleted');
        } else {
            console.log('⚠️ blog.json not found at:', blogJsonPath);
        }

        return res.status(200).json({ message: 'Old files and blog.json cleaned.' });
    } catch (err) {
        console.error('❌ Error in cleanup:', err);
        return res.status(500).json({ error: 'Failed to clean files' });
    }
}
