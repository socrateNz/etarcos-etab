"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";

interface StudentPhotoTileProps {
  name: string;
  avatarUrl: string | null;
  onSaved: (url: string) => void;
}

export function StudentPhotoTile({ name, avatarUrl, onSaved }: StudentPhotoTileProps) {
  // Once a photo is uploaded here, show it immediately instead of waiting for
  // the class list query to refetch — the server save happens in the background.
  const [localUrl, setLocalUrl] = useState<string | null | undefined>(undefined);

  const { fileInputRef, isUploading, handleUploadClick, handleFileChange } = useAvatarUpload((url) => {
    setLocalUrl(url);
    if (url) onSaved(url);
  });

  const displayUrl = localUrl !== undefined ? localUrl : avatarUrl;

  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="relative group">
        <Avatar className="w-16 h-16 border border-border cursor-pointer" onClick={handleUploadClick}>
          <AvatarImage src={displayUrl || undefined} alt={name} />
          <AvatarFallback className="bg-brand-gradient text-white text-sm font-bold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        {isUploading ? (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center pointer-events-none">
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleUploadClick}
            className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
      <span className="text-[11px] font-medium leading-tight line-clamp-2 max-w-[72px]">{name}</span>
    </div>
  );
}
