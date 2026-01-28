"use client";

import { useState, useRef, useEffect } from "react";
import { CritiqueForm } from "../components/CritiqueForm";
import { CritiqueResult } from "../components/CritiqueResult";
import { HistorySidebar } from "../components/HistorySidebar";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Camera } from "lucide-react";

export default function CritiquePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [critique, setCritique] = useState<string>("");
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);
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

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read response stream");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.critique) {
                setCritique((prev) => prev + parsed.critique);
              }
              if (parsed.savedId) {
                setLastSavedId(parsed.savedId as number);
              }
              if (parsed.error) {
                setError(parsed.error);
                setIsLoading(false);
                return;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      setIsLoading(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: { id: number; critique: string }) => {
    setCritique(item.critique || "");
    setLastSavedId(item.id);
    setIsLoading(false);
    setError("");
  };

  const handleRefine = async (instructions: string) => {
    if (!lastSavedId) return;
    setIsLoading(true);
    setError("");
    setCritique("");
    try {
      const res = await fetch("/api/critique/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lastSavedId, instructions }),
      });
      if (!res.ok) throw new Error("Failed to refine critique");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Failed to read refine stream");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") {
            setIsLoading(false);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.critique) setCritique((p) => p + parsed.critique);
            if (parsed.savedId) setLastSavedId(parsed.savedId as number);
            if (parsed.error) {
              setError(parsed.error);
              setIsLoading(false);
              return;
            }
          } catch {}
        }
      }
      setIsLoading(false);
    } catch (e: any) {
      setError(e.message || "Refine failed");
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto py-12 px-4 font-sans max-w-5xl">
      <div className="md:flex gap-6">
        <div className="md:block hidden">
          <HistorySidebar onSelect={handleSelectHistory} />
        </div>
        <div className="flex-1 max-w-xl mx-auto">
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

            <div className="flex flex-col gap-4 mb-8">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                PhotoMemory Vault
              </h1>

              <p className="text-muted-foreground">
                Photographer Session Intelligence System — upload a photo to get a thoughtful critique. Session history, search, and refinement enabled via Postgres.
              </p>

              <p className="text-muted-foreground text-sm">
                Fork-based prototype. Features under active development.
              </p>
            </div>

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
            {!isLoading && critique && lastSavedId && (
              <RefineBox onRefine={handleRefine} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function RefineBox({ onRefine }: { onRefine: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="mt-4 w-full border rounded p-3">
      <div className="text-sm font-medium mb-2">Refine Critique</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Optional instructions (e.g., focus more on color grading)"
        className="w-full border rounded p-2 h-20"
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => onRefine(text)}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90"
        >
          Refine
        </button>
      </div>
    </div>
  );
}
