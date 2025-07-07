import * as React from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Image from "next/image";

interface PhotoUploadCardProps {
  previewUrl: string | null;
  isLoading: boolean;
  onFileChange: (file: File | null) => void;
}

export function PhotoUploadCard({
  previewUrl,
  isLoading,
  onFileChange,
}: PhotoUploadCardProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0] || null;
    onFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleCardClick = () => {
    if (!isLoading && inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  return (
    <Card
      className={`p-6 flex flex-col items-center gap-4 bg-background transition border-1 border-dashed cursor-pointer select-none ${
        isDragActive ? "border-primary/80 bg-primary/5" : "border-border"
      }`}
      onClick={handleCardClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      tabIndex={0}
      role="button"
      aria-label="Upload photo by clicking or dragging"
    >
      <Label
        htmlFor="photo-upload"
        className="text-xl font-bold mb-2 font-sans flex items-center gap-2"
      >
        Upload your photo
      </Label>
      <Input
        id="photo-upload"
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        disabled={isLoading}
      />
      <span className="text-muted-foreground text-sm">
        Drag & drop an image here, or click to select
      </span>
      {previewUrl && (
        <div className="relative w-full mt-4 h-64">
          <Image
            src={previewUrl}
            alt="Preview"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 400px"
            priority
          />
        </div>
      )}
    </Card>
  );
}
