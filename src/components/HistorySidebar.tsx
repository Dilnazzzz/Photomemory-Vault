"use client";
import React, { useEffect, useState } from "react";

type Item = {
  id: number;
  critique: string;
  image_description: string;
  created_at: string;
  version: number;
  parent_id: number | null;
};

export function HistorySidebar({ onSelect }: { onSelect: (item: Item) => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setItems(data.items || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q) return loadHistory();
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setItems((data.results || []) as Item[]);
      } catch {}
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <aside className="border-r pr-3 md:w-80 w-full md:h-[calc(100vh-4rem)] md:sticky md:top-0">
      <div className="mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search session..."
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="text-sm text-muted-foreground mb-2">
        {loading ? "Loading..." : `Results: ${items.length}`}
      </div>
      <ul className="space-y-2 overflow-auto md:max-h-[70vh]">
        {items.map((it) => (
          <li key={it.id}>
            <button
              className="w-full text-left p-2 rounded hover:bg-accent"
              onClick={() => onSelect(it)}
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium">#{it.id} v{it.version}</span>
                <span className="text-xs opacity-70">
                  {new Date(it.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-xs line-clamp-2 opacity-80">
                {it.critique}
              </div>
            </button>
          </li>
        ))}
        {!items.length && !loading && (
          <li className="text-sm text-muted-foreground">No items yet.</li>
        )}
      </ul>
    </aside>
  );
}

