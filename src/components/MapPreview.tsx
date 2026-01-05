"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const Map = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900"><Loader2 className="animate-spin text-neutral-400" /></div>
});

export default function MapPreview(props: any) {
    return <Map {...props} />;
}
