import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';

import fs from 'fs';
import path from 'path';

// Disable Next.js default body parser
export const config = {
    api: {
        bodyParser: false,
    },
};

const uploadDir = path.join(process.cwd(), 'public', '/upload');

// Ensure the folder exists
fs.mkdirSync(uploadDir, { recursive: true });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const form = new IncomingForm({
        uploadDir,
        keepExtensions: true,
        filename: (name, ext, part) => {
            const timestamp = Date.now();
            // Sanitize filename to avoid issues with special characters
            part.originalFilename = part.originalFilename?.replace(/[^a-zA-Z0-9-_\.]/g, '_') || 'image';
            // Return a unique filename with timestamp
            return `${timestamp}-${part.originalFilename}`;
        },
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Upload failed' });
        }

        const file = files.image?.[0];
        const fileName = path.basename(file?.filepath || '');
        return res.status(200).json({ fileName });
    });
}
