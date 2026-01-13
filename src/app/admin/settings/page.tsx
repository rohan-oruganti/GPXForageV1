"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Assuming we have or will treat as checkbox
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select"; // Mock

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
                <p className="text-muted-foreground">Manage platform configuration and policies.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Analytics Configuration</CardTitle>
                        <CardDescription>Control how user data is tracked and retained.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Event Tracking</Label>
                                <p className="text-sm text-muted-foreground">Capture login and merge events.</p>
                            </div>
                            <input type="checkbox" checked readOnly className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                            <Label>Data Retention</Label>
                            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors cursor-not-allowed opacity-50" disabled>
                                <option>90 Days</option>
                                <option>1 Year</option>
                                <option>Forever</option>
                            </select>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button disabled>Save Changes</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Job Limits</CardTitle>
                        <CardDescription>Set operational boundaries for merge jobs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Max Fragments per Job</Label>
                            <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={50} disabled />
                        </div>
                        <div className="space-y-1">
                            <Label>Max File Size (MB)</Label>
                            <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={100} disabled />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button disabled>Save Changes</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Security & Access</CardTitle>
                        <CardDescription>Manage session and access policies.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Admin Audit Logging</Label>
                                <p className="text-sm text-muted-foreground">Log all admin actions to DB.</p>
                            </div>
                            <input type="checkbox" checked readOnly className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                            <Label>Session Timeout</Label>
                            <input type="text" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue="24 hours" disabled />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
