import { LoadingSkeleton } from "./LoadingSkeleton";
import { CritiqueCard } from "./CritiqueCard";
import React from "react";

interface CritiqueResultProps {
  isLoading: boolean;
  critique: string;
  loadingMessage: string;
}

export function CritiqueResult({
  isLoading,
  critique,
  loadingMessage,
}: CritiqueResultProps) {
  if (isLoading) {
    return (
      <div className="flex-1 w-full">
        <div className="mb-4 text-center text-muted-foreground text-base font-medium animate-pulse">
          {loadingMessage}
        </div>
        <LoadingSkeleton />
      </div>
    );
  }
  if (critique) {
    return (
      <div className="flex-1">
        <CritiqueCard critique={critique} />
      </div>
    );
  }
  return null;
}
