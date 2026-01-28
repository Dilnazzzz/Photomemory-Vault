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
  // Show spinner only when loading and no critique yet
  if (isLoading && !critique) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-12">
        <div className="mb-4 text-center text-muted-foreground text-base font-medium">
          {loadingMessage}
        </div>
        <div className="relative">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Show critique (with or without typing indicator)
  if (critique) {
    return (
      <div className="flex-1">
        <CritiqueCard critique={critique} />
      </div>
    );
  }

  return null;
}
