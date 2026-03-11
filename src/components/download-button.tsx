"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createZip, downloadBlob } from "@/lib/zip";
import { Download, Loader2 } from "lucide-react";

interface DownloadButtonProps {
  files: Record<string, string>;
}

export function DownloadButton({ files }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await createZip(files);
      downloadBlob(blob, "nooc-output.zip");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={downloading}>
      {downloading ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1 h-4 w-4" />
      )}
      下载 ZIP
    </Button>
  );
}
