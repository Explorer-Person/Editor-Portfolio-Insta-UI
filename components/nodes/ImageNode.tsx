/* eslint-disable @next/next/no-img-element */
// ImageNode.tsx
import {
    DecoratorNode,
    LexicalEditor,
    NodeKey,
    SerializedLexicalNode,
    LexicalNode,
} from 'lexical';
import { JSX, useEffect, useRef, useState } from 'react';


type Alignment = 'left' | 'center' | 'right';

export type SerializedImageNode = {
    src: string;
    altText?: string;
    alignment?: Alignment;
    type: 'image';
    version: 1;
} & SerializedLexicalNode;



type ImageProps = {
    src: string;
    altText: string;
    alignment: Alignment;
    nodeKey?: string; // ✅ required
};

export default function ImageComponent({ src, altText, alignment }: ImageProps) {
    const ref = useRef<HTMLImageElement | null>(null);
    const [fallbackTriggered, setFallbackTriggered] = useState(false);

    const baseClass = 'my-4 max-w-full rounded';
    const alignmentClass =
        alignment === 'left'
            ? 'float-left'
            : alignment === 'right'
                ? 'float-right'
                : 'mx-auto block';
    const finalClass = `${baseClass} ${alignmentClass}`;

    useEffect(() => {
        if (ref.current) {
            ref.current.className = finalClass;
        }
    }, [finalClass]);

    const handleImageError = () => {
        if (!fallbackTriggered && src.startsWith('/upload/')) {
            setFallbackTriggered(true);
        }
    };

    // ✅ First try full localhost URL, then fallback to client path
    const currentSrc = fallbackTriggered ? `${process.env.NEXT_PUBLIC_SERVER_URL}${src}` : src;

    return (
        <img
            key={fallbackTriggered ? 'fallback' : 'primary'}
            ref={ref}
            src={currentSrc}
            alt={altText}
            onError={handleImageError}
            crossOrigin="anonymous"
            className={finalClass}
            style={{ width: '100%', height: 'auto' }}
        />
    );
}

export class ImageNode extends DecoratorNode<JSX.Element> {
    __src: string;
    __altText: string;
    __alignment: Alignment;

    static getType(): string {
        return 'image';
    }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(node.__src, node.__altText, node.__alignment, node.__key);
    }

    constructor(src: string, altText: string, alignment: Alignment = 'center', key?: NodeKey) {
        super(key);
        this.__src = src;
        this.__altText = altText;
        this.__alignment = alignment;
    }

    createDOM(): HTMLElement {
        const img = document.createElement('span');
        return img;
    }

    updateDOM(): false {
        return false;
    }

    __getImageClass(): string {
        const alignClass = {
            left: 'float-left',
            center: 'mx-auto block',
            right: 'float-right',
        }[this.__alignment];
        return `my-4 max-w-full rounded ${alignClass}`;
    }

    decorate(): JSX.Element {
        return (
            <ImageComponent
                src={this.__src}
                altText={this.__altText}
                alignment={this.__alignment}
                nodeKey={this.getKey()} // ✅ This fixes it
            />
        );
    }

    exportJSON(): SerializedImageNode {
        return {
            type: 'image',
            version: 1,
            src: this.__src,
            altText: this.__altText,
            alignment: this.__alignment,
        };
    }

    exportDOM(): { element: HTMLElement } {
        const img = document.createElement('img');
        img.setAttribute('src', this.__src);
        img.setAttribute('alt', this.__altText);
        img.setAttribute('crossorigin', 'anonymous');
        img.className = this.__getImageClass();
        return { element: img };
    }

    static importJSON(serializedNode: SerializedImageNode): ImageNode {
        const { src, altText, alignment = 'center' } = serializedNode;
        return new ImageNode(src, altText ?? '', alignment);
    }

    setAlignment(align: Alignment, editor: LexicalEditor) {
        const writable = this.getWritable();
        if (writable.__alignment === align) return;

        // Replace with a new instance (forces re-render)
        editor.update(() => {
            const newNode = new ImageNode(this.__src, this.__altText, align);
            this.replace(newNode);
        });
    }
}

export function $createImageNode(src: string, altText = '', alignment: Alignment = 'center'): ImageNode {
    return new ImageNode(src, altText, alignment);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
    return node instanceof ImageNode;
}
