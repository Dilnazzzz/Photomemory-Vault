import { PhotoUploadCard } from "./PhotoUploadCard";
import { ErrorAlert } from "./ErrorAlert";
import React from "react";

interface CritiqueFormProps {
  file: File | null;
  previewUrl: string | null;
  isLoading: boolean;
  critique: string;
  error: string;
  onFileChange: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  resetKey: number;
}

export function CritiqueForm({
  file,
  previewUrl,
  isLoading,
  critique,
  error,
  onFileChange,
  onSubmit,
  resetKey,
}: CritiqueFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <PhotoUploadCard
        key={resetKey}
        previewUrl={previewUrl}
        isLoading={isLoading}
        onFileChange={onFileChange}
      />
      <button
        type="submit"
        className={`w-full bg-primary text-primary-foreground py-2 px-6 font-semibold hover:bg-primary/90 transition disabled:opacity-50 mx-auto${
          !(!file || isLoading || !!critique) ? " cursor-pointer" : ""
        }`}
        disabled={!file || isLoading || !!critique}
      >
        Get Critique
      </button>
      {error && <ErrorAlert message={error} />}
    </form>
  );
}
