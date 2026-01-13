"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, FileCode, CheckCircle, AlertCircle, Clock, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Icons map
const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'COMPLETED': return <CheckCircle className="size-5 text-green-500" />;
        case 'FAILED': return <AlertCircle className="size-5 text-red-500" />;
        case 'PROCESSING': return <Loader2 className="size-5 text-blue-500 animate-spin" />;
        default: return <Clock className="size-5 text-neutral-400" />;
    }
};

export default function DashboardPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Action state
    const [jobToDelete, setJobToDelete] = useState<string | null>(null);
    const [jobToRename, setJobToRename] = useState<any | null>(null);
    const [newName, setNewName] = useState("");

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/merge-jobs');
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleDelete = async () => {
        if (!jobToDelete) return;
        try {
            const res = await fetch(`/api/merge-jobs/${jobToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                setJobs(prev => prev.filter(j => j.id !== jobToDelete));
                toast.success("Route deleted");
            } else {
                toast.error("Failed to delete");
            }
        } catch (e) {
            toast.error("Error deleting route");
        } finally {
            setJobToDelete(null);
        }
    };

    const handleRename = async () => {
        if (!jobToRename) return;
        try {
            const res = await fetch(`/api/merge-jobs/${jobToRename.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newName })
            });

            if (res.ok) {
                // Update local state without full refetch
                setJobs(prev => prev.map(j => j.id === jobToRename.id ? { ...j, title: newName } : j));
                toast.success("Renamed successfully");
                setJobToRename(null);
            } else {
                toast.error("Failed to rename");
            }
        } catch (e) {
            toast.error("Error renaming route");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Library</h1>
                    <p className="text-muted-foreground">All your adventures in one place!</p>
                </div>
                <Link href="/dashboard/new">
                    <Button size="lg" className="shadow-lg transition-transform hover:scale-105 active:scale-95">
                        <Plus className="mr-2 size-4" />
                        Add New Route
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="size-10 animate-spin text-primary" />
                </div>
            ) : jobs.length === 0 ? (
                <Card className="border-dashed border-2 bg-card/50">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="p-5 rounded-full bg-primary/10">
                            <FileCode className="size-10 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-card-foreground">Ready to map your adventure?</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                Combine scattered GPX tracks from different devices into one epic continuous route.
                            </p>
                        </div>
                        <Link href="/dashboard/new">
                            <Button variant="outline" className="mt-4">Start Now</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.map(job => (
                        <Card key={job.id} className="group relative flex flex-col h-full border border-border/50 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <div className="font-mono text-xs text-primary/80 uppercase tracking-widest">
                                    ID: {job.id.slice(-6)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusIcon status={job.status} />

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                <MoreVertical className="size-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => {
                                                setJobToRename(job);
                                                setNewName(job.title || "");
                                            }}>
                                                <Pencil className="mr-2 size-4" /> Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setJobToDelete(job.id)}>
                                                <Trash2 className="mr-2 size-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 cursor-pointer" onClick={() => router.push(`/dashboard/jobs/${job.id}`)}>
                                <CardTitle className="text-xl font-bold text-card-foreground mb-1 group-hover:text-primary transition-colors">
                                    {job.title || "Untitled Route"}
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Created {new Date(job.createdAt).toLocaleDateString(undefined, {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    })}
                                </CardDescription>

                                <div className="mt-6 flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-xs font-medium text-secondary-foreground">
                                        <FileCode className="size-3" />
                                        <span>{job.fragmentFiles?.length || job.fragments?.length || 0} fragments</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* DELETE Dialog */}
            <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this route?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your route and all associated files.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* RENAME Dialog */}
            <Dialog open={!!jobToRename} onOpenChange={(open) => !open && setJobToRename(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Route</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="mt-2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setJobToRename(null)}>Cancel</Button>
                        <Button onClick={handleRename}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
