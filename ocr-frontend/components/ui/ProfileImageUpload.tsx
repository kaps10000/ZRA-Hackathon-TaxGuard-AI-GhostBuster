"use client";
import { CldUploadButton } from "next-cloudinary";
import { useState } from "react";

export default function ProfileImageUpload({ userId }: { userId: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center">
      {imageUrl ? (
        <img src={imageUrl} alt="Profile" className="w-32 h-32 rounded-full" />
      ) : (
        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
          No Image
        </div>
      )}

      <CldUploadButton
        uploadPreset="your_unsigned_preset"
        onUpload={(result: any) => {
          const url = result.info.secure_url;
          setImageUrl(url);

          // save to backend
          fetch("/api/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, profilePicture: url }),
          });
        }}
      >
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
          Upload Profile Picture
        </button>
      </CldUploadButton>
    </div>
  );
}
