import React from 'react';
import { motion } from 'framer-motion';
import { Github, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useGithubOAuth } from '@/hooks/use-github-oauth';
import { useFileAnalyzer } from '@/hooks/use-file-analyzer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
export function SettingsPage() {
  const { login, logout, isAuthenticated } = useGithubOAuth();
  const { clearHistory, isLoading } = useFileAnalyzer();
  const handleClearHistory = async () => {
    toast.promise(clearHistory(), {
      loading: 'Clearing history...',
      success: (data) => `Successfully cleared ${data?.clearedCount} jobs.`,
      error: 'Failed to clear history.',
    });
  };
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold">Settings</h1>
          <Card>
            <CardHeader>
              <CardTitle>GitHub Connection</CardTitle>
              <CardDescription>Manage your connection to GitHub for analyzing private repositories and pushing generated files.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Github className="w-6 h-6" />
                <div>
                  <p className="font-medium">Status</p>
                  <Badge variant={isAuthenticated ? 'default' : 'secondary'}>{isAuthenticated ? 'Connected' : 'Disconnected'}</Badge>
                </div>
              </div>
              <Button onClick={isAuthenticated ? logout : login} disabled={isLoading}>
                {isAuthenticated ? 'Disconnect' : 'Connect GitHub'}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTitle>Clear Project History</AlertTitle>
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <p>This will permanently delete all your past job analyses and results.</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isLoading}>
                          <Trash2 className="w-4 h-4 mr-2" /> Clear History
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all your project history from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearHistory}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}