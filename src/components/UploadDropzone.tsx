import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Github } from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
interface UploadDropzoneProps {
  onAnalyze: (input: File | string) => void;
}
export function UploadDropzone({ onAnalyze }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const processZipFile = useCallback(async (file: File) => {
    setError(null);
    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      const msg = 'Invalid file type. Please upload a ZIP file.';
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      const zip = await JSZip.loadAsync(file);
      const fileCount = Object.keys(zip.files).length;
      if (fileCount === 0) {
        const msg = 'The selected ZIP file is empty.';
        setError(msg);
        toast.error(msg);
        return;
      }
      onAnalyze(file);
    } catch (e) {
      const msg = 'Could not read ZIP file. It may be corrupt.';
      setError(msg);
      toast.error(msg);
    }
  }, [onAnalyze]);
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processZipFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [processZipFile]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processZipFile(e.target.files[0]);
    }
  };
  const handleGithubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) {
      toast.error('Please enter a valid GitHub URL.');
      return;
    }
    onAnalyze(githubUrl.trim());
  };
  return (
    <div className="space-y-4">
      <motion.div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ease-in-out",
          isDragging ? "border-primary bg-primary/10 scale-105 shadow-lg" : "border-border hover:border-primary/50 hover:bg-secondary/50"
        )}
        whileHover={{ scale: 1.02 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="text-center">
          <motion.div animate={{ y: isDragging ? -5 : 0 }}>
            <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          </motion.div>
          <p className="font-semibold text-foreground">Drag & drop a ZIP file here</p>
          <p className="text-sm text-muted-foreground">or click to select a file</p>
        </div>
      </motion.div>
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink mx-4 text-xs uppercase text-muted-foreground">Or</span>
        <div className="flex-grow border-t border-border"></div>
      </div>
      <form onSubmit={handleGithubSubmit} className="flex gap-2">
        <div className="relative flex-grow">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter a public GitHub repository URL"
            className="pl-9"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
        </div>
        <Button type="submit">Analyze URL</Button>
      </form>
    </div>
  );
}