import React, { useState, useCallback, useEffect } from 'react';
import { Github, Download, Package, Bot, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster, toast } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UploadDropzone } from '@/components/UploadDropzone';
import { Stepper } from '@/components/Stepper';
import { useFileAnalyzer } from '@/hooks/use-file-analyzer';
import { useGithubOAuth } from '@/hooks/use-github-oauth';
import type { AnalysisResult } from '@shared/types';
const MotionCard = motion(Card);
export function HomePage() {
  const [analysisInput, setAnalysisInput] = useState<File | string | null>(null);
  const { result, job, isLoading, error, analyze, reset } = useFileAnalyzer();
  const { login, logout, token, isAuthenticated } = useGithubOAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (job) {
      switch (job.status) {
        case 'pending':
          setActiveStep(0);
          setProgress(10);
          break;
        case 'analyzing':
          setActiveStep(1);
          setProgress(25);
          break;
        case 'complete':
          setActiveStep(2);
          setProgress(50);
          setTimeout(() => {
            setActiveStep(3);
            setProgress(75);
          }, 500);
          setTimeout(() => setProgress(100), 1000);
          break;
        case 'error':
          setActiveStep(0);
          setProgress(0);
          toast.error(job.error || 'An unknown error occurred.');
          break;
      }
    }
  }, [job]);
  const handleAnalyze = useCallback(async (input: File | string) => {
    if (typeof input === 'string' && !isAuthenticated) {
      toast.error('Please connect your GitHub account to analyze a repository.', {
        action: {
          label: 'Login',
          onClick: () => login(),
        },
      });
      return;
    }
    setAnalysisInput(input);
    try {
      toast.info('Starting analysis...', { id: 'analysis' });
      await analyze(input, token);
    } catch (e) {
      // Error is handled by the hook's state
    }
  }, [analyze, isAuthenticated, login, token]);
  const handleReset = () => {
    setAnalysisInput(null);
    reset();
    setActiveStep(0);
    setProgress(0);
  };
  const renderAnalysisResult = (res: AnalysisResult | null) => {
    if (isLoading && !res) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Separator />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      );
    }
    if (error && !res) {
      return <p className="text-destructive">{error}</p>;
    }
    if (!res) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <Bot size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">Awaiting Analysis</p>
          <p className="text-sm">Upload a project to get started.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Detected Stack</h3>
          <Badge variant="secondary">{res.detectedStack}</Badge>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entry File:</span>
          <span className="font-mono text-foreground">{res.entryFile}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Manifest Path:</span>
          <span className="font-mono text-foreground">{res.manifestPath}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Files:</span>
          <span className="font-medium text-foreground">{res.totalFiles}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">PWA Score Estimate:</span>
          <span className="font-bold text-primary">{res.prePWA_LighthouseEstimate}</span>
        </div>
      </div>
    );
  };
  return (
    <AppLayout>
      <div className="relative min-h-screen bg-background text-foreground">
        <header className="fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end py-4">
                <ThemeToggle className="relative top-0 right-0" />
                <AnimatePresence>
                {isAuthenticated ? (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        <Button onClick={logout} variant="outline" className="ml-4">
                            <Github className="w-4 h-4 mr-2" /> Logout
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        <Button onClick={login} className="ml-4">
                            <Github className="w-4 h-4 mr-2" /> Connect GitHub
                        </Button>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </header>
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] dark:bg-background dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#0066ff33,transparent)]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-24 md:py-32 lg:py-40 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="mb-4 font-semibold text-primary border-primary/50">
                <Zap className="w-4 h-4 mr-2 text-orange-400" />
                Cloudflare Optimized
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-balance">
                PWA_Gen — Ultimate PWA Forge
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
                Instantly transform any web project into a production-ready, 100/100 Lighthouse score Progressive Web App.
              </p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>1. Upload Your Project</CardTitle>
                  <CardDescription>Drag & drop a ZIP file, or enter a public GitHub repository URL.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {!analysisInput ? (
                      <motion.div key="dropzone" exit={{ opacity: 0, scale: 0.95 }}>
                        <UploadDropzone onAnalyze={handleAnalyze} />
                      </motion.div>
                    ) : (
                      <motion.div key="summary" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                        <div className="flex items-center gap-3">
                          <Package className="w-6 h-6 text-primary" />
                          <span className="font-medium truncate">
                            {typeof analysisInput === 'string' ? analysisInput : analysisInput.name}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleReset}>Change</Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </MotionCard>
              <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                <CardHeader>
                  <CardTitle>2. PWA Transformation Pipeline</CardTitle>
                  <CardDescription>Follow the automated process from analysis to a deployable PWA.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Stepper activeStep={activeStep} progress={progress} />
                </CardContent>
              </MotionCard>
            </div>
            <div className="lg:col-span-1 space-y-8 sticky top-24">
              <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
                <CardHeader>
                  <CardTitle>3. Analysis & Results</CardTitle>
                  <CardDescription>Review the detected stack and get ready to export.</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderAnalysisResult(result)}
                </CardContent>
              </MotionCard>
              <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }} className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>4. Export</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" disabled={activeStep < 3}>
                    <Download className="w-4 h-4 mr-2" /> Download ZIP
                  </Button>
                  <Button variant="secondary" className="w-full" disabled={activeStep < 3}>
                    <Github className="w-4 h-4 mr-2" /> Push to GitHub
                  </Button>
                </CardContent>
              </MotionCard>
            </div>
          </div>
        </div>
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16 text-center text-muted-foreground/80">
          <p>Built with ❤️ at Cloudflare</p>
        </footer>
        <Toaster richColors closeButton />
      </div>
    </AppLayout>
  );
}