import React, { useState, useCallback } from 'react';
import { Github, Download, UploadCloud, Zap, CheckCircle, Package, Bot } from 'lucide-react';
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
import { useFileAnalyzer, AnalysisResult } from '@/hooks/use-file-analyzer';
const MotionCard = motion(Card);
export function HomePage() {
  const [analysisInput, setAnalysisInput] = useState<File | string | null>(null);
  const { result, isLoading, error, analyze } = useFileAnalyzer();
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const handleAnalyze = useCallback(async (input: File | string) => {
    setAnalysisInput(input);
    setActiveStep(0);
    setProgress(10);
    try {
      toast.info('Analyzing project...', { id: 'analysis' });
      await analyze(input);
      setProgress(25);
      setActiveStep(1);
      toast.success('Analysis complete!', { id: 'analysis' });
      setProgress(50);
      setActiveStep(2);
      setTimeout(() => {
        setProgress(75);
        setActiveStep(3);
      }, 800);
       setTimeout(() => {
        setProgress(100);
      }, 1200);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || 'Analysis failed', { id: 'analysis' });
      setProgress(0);
      setActiveStep(0);
    }
  }, [analyze]);
  const handleReset = () => {
    setAnalysisInput(null);
    setActiveStep(0);
    setProgress(0);
  };
  const renderAnalysisResult = (res: AnalysisResult | null) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      );
    }
    if (error) {
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
          <span className="text-muted-foreground">SW Register Location:</span>
          <span className="font-mono text-foreground">{res.swRegLocation}</span>
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
        <ThemeToggle className="fixed top-4 right-4" />
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] dark:bg-background dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#0066ff33,transparent)]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24 lg:py-32 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
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
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="overflow-hidden"
              >
                <CardHeader>
                  <CardTitle>1. Upload Your Project</CardTitle>
                  <CardDescription>Drag & drop a ZIP file, select a folder, or enter a public GitHub repository URL.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {!analysisInput ? (
                      <motion.div key="dropzone" exit={{ opacity: 0, scale: 0.95 }}>
                        <UploadDropzone onAnalyze={handleAnalyze} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="summary"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-6 h-6 text-primary" />
                          <span className="font-medium">
                            {typeof analysisInput === 'string' ? analysisInput : analysisInput.name}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleReset}>Change</Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </MotionCard>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <CardHeader>
                  <CardTitle>2. PWA Transformation Pipeline</CardTitle>
                  <CardDescription>Follow the automated process from analysis to a deployable PWA.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Stepper activeStep={activeStep} progress={progress} />
                </CardContent>
              </MotionCard>
            </div>
            <div className="lg:col-span-1 space-y-8 sticky top-8">
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <CardHeader>
                  <CardTitle>3. Analysis & Results</CardTitle>
                  <CardDescription>Review the detected stack and get ready to export.</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderAnalysisResult(result)}
                </CardContent>
              </MotionCard>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="bg-card/80 backdrop-blur-sm"
              >
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