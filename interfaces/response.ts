
export interface BlogResponse {
    success: boolean;
    blog: InitialBlogData;
}

export interface InitialBlogData {
    id: number;
    title: string;
    slug: string;
    image: string; // Cover image path
    excerpt: string;
    date: string; // ISO timestamp
    content: string; // HTML string
    imageNames: string; // comma-separated string (inside quotes)
    jsonModel: string; // stringified JSON model
    created_at: string;
}

export interface Project {
    id: bigint;
    title: string;
    description: string;
    mainImage: string;
    imageFiles: string[];
    videoFiles: string[];
    hashtags: string;
    githubLink?: string;
}

export interface SaveProjectResponse {
    success: boolean;
    id?: number;
    error?: string;
}

export interface GetProjectResponse {
    success: boolean;
    projects?: Project[];
    error?: string;
}

// interfaces/response.ts
export interface BaseResponse {
    success: boolean;
    error?: string;
}
