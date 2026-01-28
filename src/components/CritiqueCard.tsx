import { Card, CardContent } from "./ui/card";
import ReactMarkdown from "react-markdown";

interface CritiqueCardProps {
  critique: string;
}

export function CritiqueCard({ critique }: CritiqueCardProps) {
  return (
    <Card>
      <CardContent className="prose critique-prose whitespace-pre-wrap text-muted-foreground font-sans text-base text-left">
        <ReactMarkdown>{critique}</ReactMarkdown>
      </CardContent>
    </Card>
  );
}
