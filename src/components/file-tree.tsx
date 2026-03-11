"use client";

import { cn } from "@/lib/utils";
import { FileText, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";

interface FileTreeProps {
  files: Record<string, string>;
  selectedFile: string | null;
  onSelect: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const path of paths.sort()) {
    const parts = path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const fullPath = parts.slice(0, i + 1).join("/");
      const isDir = i < parts.length - 1;

      let existing = current.find((n) => n.name === name && n.isDir === isDir);
      if (!existing) {
        existing = { name, path: fullPath, isDir, children: [] };
        current.push(existing);
      }
      current = existing.children;
    }
  }

  return root;
}

function TreeNodeItem({
  node,
  selectedFile,
  onSelect,
  depth = 0,
}: {
  node: TreeNode;
  selectedFile: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);

  if (node.isDir) {
    return (
      <div>
        <button
          className="flex items-center gap-1.5 w-full text-left px-2 py-1 text-sm hover:bg-accent rounded-sm"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-amber-500 shrink-0" />
          )}
          <span>{node.name}</span>
        </button>
        {expanded &&
          node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
      </div>
    );
  }

  return (
    <button
      className={cn(
        "flex items-center gap-1.5 w-full text-left px-2 py-1 text-sm hover:bg-accent rounded-sm",
        selectedFile === node.path && "bg-accent text-accent-foreground"
      )}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={() => onSelect(node.path)}
    >
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileTree({ files, selectedFile, onSelect }: FileTreeProps) {
  const tree = buildTree(Object.keys(files));

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          selectedFile={selectedFile}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
