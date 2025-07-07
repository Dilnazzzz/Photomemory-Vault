"use client";

import { useState, useRef, useEffect } from "react";
import { CritiqueForm } from "../components/CritiqueForm";
import { CritiqueResult } from "../components/CritiqueResult";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Camera } from "lucide-react";

export default function CritiquePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [critique, setCritique] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [resetKey, setResetKey] = useState(0);
  const loadingMessages = [
    "Uploading your photo...",
    "Analyzing composition...",
    "Consulting photography experts...",
    "Generating your critique...",
    "Almost done...",
  ];
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      setLoadingMessageIdx(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMessageIdx((idx) => {
          if (idx < loadingMessages.length - 1) {
            return idx + 1;
          } else {
            return idx;
          }
        });
      }, 6000);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    };
  }, [isLoading, loadingMessages.length]);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setPreviewUrl(selectedFile ? URL.createObjectURL(selectedFile) : null);
    setCritique("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    setIsLoading(true);
    setError("");
    setCritique("");
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await fetch("/api/critique", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(
          "Failed to get critique from the server. Try again later."
        );
      }
      const data = await response.json();
      setCritique(data.critique);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto py-12 px-4 font-sans max-w-xl">
      <AnimatePresence mode="wait">
        {!isLoading && !critique ? (
          <motion.div
            key="upload-form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Camera className="w-8 h-8 text-primary mb-4" />

            <h1 className="text-3xl font-bold mb-2 tracking-tight flex items-center gap-2">
              AI Photo Critique & Advisor
            </h1>
            <p className="text-muted-foreground mb-8">
              Upload a photo to get a detailed composition and lighting critique
              based on a curated knowledge base.
            </p>
            <CritiqueForm
              file={file}
              previewUrl={previewUrl}
              isLoading={isLoading}
              critique={critique}
              error={error}
              onFileChange={handleFileChange}
              onSubmit={handleSubmit}
              resetKey={resetKey}
            />
          </motion.div>
        ) : (
          <motion.div
            key="analysis-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col items-center w-full"
          >
            {previewUrl && (
              <div className="relative w-full max-w-xs h-48 mb-6">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  className="object-contain  w-full h-full"
                  style={{ maxHeight: 192 }}
                  fill
                  unoptimized
                />
              </div>
            )}
            <CritiqueResult
              isLoading={isLoading}
              critique={critique}
              loadingMessage={loadingMessages[loadingMessageIdx]}
            />
            {/* Add Try Another Photo button after critique is shown */}
            {!isLoading && critique && (
              <button
                className="cursor-pointer mt-6 px-6 py-2 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setCritique("");
                  setError("");
                  setResetKey((k) => k + 1);
                }}
              >
                Try Another Photo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
