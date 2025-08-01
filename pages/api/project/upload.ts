import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';
import sanitize from 'sanitize-filename';

export const config = {
    api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    // ✅ Ensure temp directory exists BEFORE parsing
    const tempDir = path.join(process.cwd(), 'public', 'upload', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // ✅ Create formidable form instance with temp folder
    const form = formidable({ multiples: true, uploadDir: tempDir, keepExtensions: true });

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('❌ Error during form parse:', err);
            return res.status(500).json({ error: 'File upload error' });
        }

        const name = fields.name?.toString() || 'unknown';
        const category =
            name === 'imageFiles'
                ? 'imageFiles'
                : name === 'videoFiles'
                    ? 'videoFiles'
                    : name === 'mainImage'
                        ? 'mainImage'
                        : 'unknown';

        if (category === 'unknown') {
            console.error('❌ Unknown category:', name);
            return res.status(400).json({ error: 'Invalid category name' });
        }

        const uploadDir = path.join(process.cwd(), 'public', 'upload', category);
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const fileList = Array.isArray(files.file) ? files.file : [files.file];
        const validFiles = fileList.filter((file): file is File => !!file);

        const savedFiles = validFiles.map((file: File) => {
            const originalName = sanitize(file.originalFilename || 'upload');
            const finalName = `${Date.now()}-${originalName}`;
            const finalPath = path.join(uploadDir, finalName);
            fs.renameSync(file.filepath, finalPath); // Move from temp to actual folder
            return finalName;
        });

        return res.status(200).json({ success: true, files: savedFiles });
    });
}
