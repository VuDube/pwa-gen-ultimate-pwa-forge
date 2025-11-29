import React, { useState, useCallback, useEffect } from 'react';
import { Github, Download, Package, Bot, Zap, FileText, Code2, AlertCircle, CheckCircle, ShieldCheck, Rocket, History, Settings, Copy } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster, toast } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UploadDropzone } from '@/components/UploadDropzone';
import { Stepper } from '@/components/Stepper';
import { useFileAnalyzer } from '@/hooks/use-file-analyzer';
import { useGithubOAuth } from '@/hooks/use-github-oauth';
import type { AnalysisResult, JobState } from '@shared/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
export function HomePage() {
  const [analysisInput, setAnalysisInput] = useState<File | string | null>(null);
  const { result, generatedFiles, validationResult, exportResult, job, isLoading, error, analyze, generate, validate, exportJob, reset, history, loadHistory } = useFileAnalyzer();
  const { login, logout, token, isAuthenticated } = useGithubOAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [branchName, setBranchName] = useState('');
  useEffect(() => {
    loadHistory(undefined, 3);
  }, [loadHistory]);
  useEffect(() => {
    if (job) {
      switch (job.status) {
        case 'pending': setActiveStep(0); setProgress(5); break;
        case 'analyzing': setActiveStep(0); setProgress(15); break;
        case 'complete': setActiveStep(1); setProgress(25); break;
        case 'generated': setActiveStep(2); setProgress(50); break;
        case 'validating': setActiveStep(2); setProgress(65); break;
        case 'validated': setActiveStep(3); setProgress(100); break;
        case 'exported': setActiveStep(3); setProgress(100); break;
        case 'error':
          setActiveStep(0); setProgress(0);
          toast.error(job.error || 'An unknown error occurred.');
          break;
      }
    }
  }, [job]);
  useEffect(() => {
    if (exportResult) {
      if (exportResult.type === 'github') {
        toast.success(`Successfully pushed to branch: ${exportResult.branch}`, { description: `Commit SHA: ${exportResult.commitSha}` });
      }
    }
  }, [exportResult]);
  const handleAnalyze = useCallback(async (input: File | string) => {
    if (typeof input === 'string' && !isAuthenticated) {
      toast.error('Please connect your GitHub account to analyze a repository.', { action: { label: 'Login', onClick: () => login() } });
      return;
    }
    setAnalysisInput(input);
    try {
      toast.info('Starting analysis...', { id: 'analysis' });
      await analyze(input, token);
    } catch (e) { /* Error is handled by the hook's state */ }
  }, [analyze, isAuthenticated, login, token]);
  const handleGenerate = useCallback(async () => {
    if (!job?.id) return;
    toast.info('Generating PWA files...', { id: 'generate' });
    await generate(job.id, { themeColor: '#0066FF' });
  }, [generate, job?.id]);
  const handleValidate = useCallback(async () => {
    if (!job?.id) return;
    toast.info('Validating PWA configuration...', { id: 'validate' });
    await validate(job.id);
  }, [validate, job?.id]);
  const handleExport = useCallback(async (exportType: 'zip' | 'github' | 'cf') => {
    if (!job?.id) return;
    toast.info(`Exporting as ${exportType}...`, { id: 'export' });
    await exportJob(job.id, exportType, { branch: branchName, token });
  }, [exportJob, job?.id, branchName, token]);
  const handleReset = () => {
    setAnalysisInput(null);
    reset();
    setActiveStep(0);
    setProgress(0);
    loadHistory(undefined, 3);
  };
  const renderAnalysisResult = (res: AnalysisResult | null) => {
    if (isLoading && !res && (job?.status === 'analyzing' || job?.status === 'pending')) {
      return <div className="space-y-4"><Skeleton className="h-6 w-3/4" /><Separator /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>;
    }
    if (error && !res) return <p className="text-destructive">{error}</p>;
    if (!res) return <div className="text-center text-muted-foreground py-8"><Bot size={48} className="mx-auto mb-4 opacity-50" /><p className="font-medium">Awaiting Analysis</p><p className="text-sm">Upload a project to get started.</p></div>;
    const showGenerate = job?.status === 'complete';
    const showValidate = job?.status === 'generated';
    const showExport = job?.status === 'validated';
    return (
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between"><h3 className="font-semibold text-base">Detected Stack</h3><Badge variant="secondary">{res.detectedStack}</Badge></div><Separator />
        <div className="flex justify-between"><span className="text-muted-foreground">Entry File:</span><span className="font-mono text-foreground">{res.entryFile}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Manifest Path:</span><span className="font-mono text-foreground">{res.manifestPath}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Total Files:</span><span className="font-medium text-foreground">{res.totalFiles}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">PWA Score Est:</span><span className="font-bold text-primary">{res.prePWA_LighthouseEstimate}</span></div>
        {showGenerate && <Button onClick={handleGenerate} disabled={isLoading} className="w-full mt-4">Generate PWA Files</Button>}
        {showValidate && <Button onClick={handleValidate} disabled={isLoading} className="w-full mt-4">Validate PWA Files</Button>}
        {showExport && (
          <Sheet>
            <SheetTrigger asChild>
              <Button className="w-full mt-4 animate-fade-in"><Rocket className="w-4 h-4 mr-2" /> Export PWA</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader><SheetTitle>Export Options</SheetTitle></SheetHeader>
              <div className="space-y-4 py-4">
                <Button onClick={() => handleExport('zip')} className="w-full"><Download className="w-4 h-4 mr-2" /> Download ZIP</Button>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Branch name" defaultValue="pwa-generated" onChange={(e) => setBranchName(e.target.value)} />
                    <Button onClick={() => handleExport('github')} disabled={!isAuthenticated || isLoading}><Github className="w-4 h-4 mr-2" /> Push to GitHub</Button>
                  </div>
                  {!isAuthenticated && <p className="text-xs text-muted-foreground">Connect GitHub account to enable push.</p>}
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" onClick={() => handleExport('cf')}>Get CF Deploy Instructions</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Cloudflare Deploy Instructions</DialogTitle></DialogHeader>
                    {exportResult?.type === 'cf' ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">wrangler.toml</h4>
                          <pre className="bg-muted p-2 rounded-md text-xs relative"><code>{exportResult.wranglerToml}</code><Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6" onClick={() => navigator.clipboard.writeText(exportResult.wranglerToml!)}><Copy className="h-3 w-3"/></Button></pre>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Commands</h4>
                          <pre className="bg-muted p-2 rounded-md text-xs relative"><code>{exportResult.instructions}</code><Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6" onClick={() => navigator.clipboard.writeText(exportResult.instructions!)}><Copy className="h-3 w-3"/></Button></pre>
                        </div>
                      </div>
                    ) : <Skeleton className="h-32 w-full" />}
                  </DialogContent>
                </Dialog>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    );
  };
  return (
    <AppLayout>
      <div className="relative min-h-screen bg-background text-foreground">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-3">
            <div className="flex items-center gap-2">
              <Link to="/history" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"><History className="w-4 h-4 inline-block mr-1" /> History</Link>
              <Link to="/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"><Settings className="w-4 h-4 inline-block mr-1" /> Settings</Link>
            </div>
            <div className="flex items-center">
              <ThemeToggle className="relative top-0 right-0" />
              {isAuthenticated ? (
                <Button onClick={logout} variant="outline" size="sm" className="ml-4"><Github className="w-4 h-4 mr-2" /> Logout</Button>
              ) : (
                <Button onClick={login} size="sm" className="ml-4"><Github className="w-4 h-4 mr-2" /> Connect GitHub</Button>
              )}
            </div>
          </div>
        </header>
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] dark:bg-background dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#0066ff33,transparent)]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-24 md:py-32 lg:py-40 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="mb-4 font-semibold text-primary border-primary/50"><Zap className="w-4 h-4 mr-2 text-orange-400" />Cloudflare Optimized</Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-balance">PWA_Gen — Ultimate PWA Forge</h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">Instantly transform any web project into a production-ready, 100/100 Lighthouse score Progressive Web App.</p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}><Card className="overflow-hidden">
                <CardHeader><CardTitle>1. Upload Your Project</CardTitle><CardDescription>Drag & drop a ZIP file, or enter a public GitHub repository URL.</CardDescription></CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {!analysisInput ? (
                      <motion.div key="dropzone" exit={{ opacity: 0, scale: 0.95 }}><UploadDropzone onAnalyze={handleAnalyze} /></motion.div>
                    ) : (
                      <motion.div key="summary" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                        <div className="flex items-center gap-3"><Package className="w-6 h-6 text-primary" /><span className="font-medium truncate">{typeof analysisInput === 'string' ? analysisInput : analysisInput.name}</span></div>
                        <Button variant="ghost" size="sm" onClick={handleReset}>Change</Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card></motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}><Card>
                <CardHeader><CardTitle>2. PWA Transformation Pipeline</CardTitle><CardDescription>Follow the automated process from analysis to a deployable PWA.</CardDescription></CardHeader>
                <CardContent><Stepper activeStep={activeStep} progress={progress} /></CardContent>
              </Card></motion.div>
              <AnimatePresence>
                {generatedFiles && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><Card>
                    <CardHeader><CardTitle>Generated PWA Files</CardTitle><CardDescription>Review the files that will be added or modified in your project.</CardDescription></CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {generatedFiles.map((file) => (
                          <AccordionItem value={file.path} key={file.path}>
                            <AccordionTrigger>
                              <div className="flex items-center gap-2">
                                {file.type === 'new' ? <FileText className="w-4 h-4 text-green-500" /> : <Code2 className="w-4 h-4 text-blue-500" />}
                                <span>{file.path}</span>
                                <Badge variant={file.type === 'new' ? 'default' : 'secondary'}>{file.type}</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent><pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto"><code>{file.content}</code></pre></AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card></motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {job?.status === 'validating' && !validationResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><Card>
                    <CardHeader><CardTitle>Validation Report</CardTitle></CardHeader>
                    <CardContent className="space-y-4"><Skeleton className="h-8 w-24" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
                  </Card></motion.div>
                )}
                {validationResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><Card>
                    <CardHeader><CardTitle>Validation Report</CardTitle><CardDescription>PWA configuration and Lighthouse readiness check.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                      <Badge variant={validationResult.score === '100/100' ? 'default' : 'destructive'} className="text-lg font-semibold">
                        <ShieldCheck className="w-5 h-5 mr-2" /> {validationResult.score}
                      </Badge>
                      <Accordion type="multiple" defaultValue={['checklist']}>
                        <AccordionItem value="checklist">
                          <AccordionTrigger>Checklist ({validationResult.checklist.length} items)</AccordionTrigger>
                          <AccordionContent><div className="space-y-2">{validationResult.checklist.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 text-sm hover:bg-muted/80 transition-colors">
                              {item.pass ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                              <span>{item.message}</span>
                            </div>))}
                          </div></AccordionContent>
                        </AccordionItem>
                        {validationResult.remediation.length > 0 && (
                          <AccordionItem value="remediation">
                            <AccordionTrigger>Remediation Steps ({validationResult.remediation.length})</AccordionTrigger>
                            <AccordionContent><ul className="list-disc pl-5 space-y-1 text-sm text-destructive">{validationResult.remediation.map((step, i) => <li key={i}>{step}</li>)}</ul></AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </CardContent>
                  </Card></motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="lg:col-span-1 space-y-8 sticky top-24">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}><Card>
                <CardHeader><CardTitle>3. Analysis & Actions</CardTitle><CardDescription>Review the detected stack and control the pipeline.</CardDescription></CardHeader>
                <CardContent>{renderAnalysisResult(result)}</CardContent>
              </Card></motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }}>
                <Card>
                  <CardHeader><CardTitle>Recent Projects</CardTitle></CardHeader>
                  <CardContent>
                    {isLoading && !history ? <Skeleton className="h-32 w-full" /> :
                      history && history.items.length > 0 ? (
                        <div className="space-y-2">
                          {history.items.map((item: JobState) => (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center p-2 rounded-md hover:bg-secondary transition-colors">
                              <div className="text-sm">
                                <p className="font-mono text-xs text-muted-foreground truncate w-32">{item.id}</p>
                                <p className="font-medium">{typeof item.input === 'string' ? 'GitHub Repo' : item.input.name}</p>
                              </div>
                              <Badge variant={item.status === 'validated' || item.status === 'exported' ? 'default' : 'secondary'}>{item.status}</Badge>
                            </motion.div>
                          ))}
                          <Button variant="link" asChild className="w-full"><Link to="/history">View all history</Link></Button>
                        </div>
                      ) : <p className="text-sm text-muted-foreground text-center py-4">No recent projects.</p>
                    }
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16 text-center text-muted-foreground/80">
          <p>Built with ��️ at Cloudflare</p>
        </footer>
        <Toaster richColors closeButton />
      </div>
    </AppLayout>
  );
}