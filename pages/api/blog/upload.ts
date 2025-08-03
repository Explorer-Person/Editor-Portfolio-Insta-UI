import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { ReadStream, createReadStream } from 'fs';

// Disable Next.js default body parser
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const form = new IncomingForm({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('❌ Parse error:', err);
            return res.status(500).json({ error: 'Failed to parse form data' });
        }

        const formData = new FormData();

        // Append single or multiple files
        const appendFiles = (fileArray: File[] | File | undefined, field: string) => {
            if (!fileArray) return;
            const files = Array.isArray(fileArray) ? fileArray : [fileArray];
            for (const file of files) {
                formData.append(field, createReadStream(file.filepath), file.originalFilename || 'file');
            }
        };

        appendFiles(files.image, 'image');   // for single cover image
        appendFiles(files.images, 'images'); // for multiple blog images

        try {
            const response = await fetch('http://localhost:5000/api/blog/upload', {
                method: 'POST',
                body: formData as any,
                headers: (formData as any).getHeaders(),
            });

            const result = await response.json();

            return res.status(response.status).json(result);
        } catch (err) {
            console.error('❌ Forward error:', err);
            return res.status(500).json({ error: 'Failed to forward to backend' });
        }
    });
}
