// pages/api/blog/update/[id].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';

export const config = {
    api: {
        bodyParser: false, // ✅ Required to handle FormData/multipart properly
    },
};

const proxy = httpProxy.createProxyServer({ target: 'http://localhost:5000', changeOrigin: true });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (req.method !== 'PUT') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'Missing or invalid id parameter' });
        return;
    }

    // Rewrite the URL to target backend
    req.url = `/api/blog/update/${id}`;

    return new Promise<void>((resolve, reject) => {
        proxy.once("error", (err: Error) => {
            console.error('❌ Proxy error:', err);
            res.status(500).json({ error: 'Proxy error' });
            reject(err);
        });
        proxy.web(req, res);
        res.on("finish", resolve);
    });
}
