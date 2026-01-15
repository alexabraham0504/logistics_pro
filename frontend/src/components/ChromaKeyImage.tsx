'use client';

import { useEffect, useRef } from 'react';

interface ChromaKeyImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
}

export default function ChromaKeyImage({ src, alt, className, width, height }: ChromaKeyImageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src;

        img.onload = () => {
            canvas.width = width || img.width;
            canvas.height = height || img.height;

            // Draw image to canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Simple Green Screen Algorithm
            // Iterate over all pixels (R, G, B, A)
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Check if pixel is green
                // Logic: Green is dominant and significantly brighter than Red and Blue
                if (g > 100 && g > r * 1.4 && g > b * 1.4) {
                    data[i + 3] = 0; // Set Alpha to 0
                }
            }

            // Put modified data back
            ctx.putImageData(imageData, 0, 0);
        };
    }, [src, width, height]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            title={alt}
            style={{ maxWidth: '100%', height: 'auto' }}
        />
    );
}
