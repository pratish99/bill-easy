'use client';

import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface ImageUploaderProps {
  onScan: (file: File) => void;
  error?: string | null;
}

export default function ImageUploader({ onScan, error }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const acceptFile = useCallback((selected: File) => {
    setLocalError(null);
    setFile(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }, []);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) acceptFile(accepted[0]);
    },
    [acceptFile]
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const code = rejections[0]?.errors[0]?.code;
    if (code === 'file-too-large') {
      setLocalError('That image is larger than 10MB. Try a smaller photo.');
    } else if (code === 'file-invalid-type') {
      setLocalError('Please upload a JPEG, PNG, or WEBP image.');
    } else {
      setLocalError('Could not use that file. Please try another image.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    onDrop,
    onDropRejected,
  });

  const handleCameraCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (!selected) return;
    if (selected.size > MAX_SIZE_BYTES) {
      setLocalError('That image is larger than 10MB. Try a smaller photo.');
      return;
    }
    acceptFile(selected);
  };

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setLocalError(null);
  };

  const displayError = localError || error;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        {...getRootProps()}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />

        {previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected bill preview"
              className="max-h-64 rounded-lg object-contain shadow-sm"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="text-sm font-medium text-gray-500 underline hover:text-gray-700"
            >
              Choose a different image
            </button>
          </div>
        ) : (
          <>
            <svg
              className="h-10 w-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? 'Drop the image here' : 'Drag & drop a photo of the bill, or click to browse'}
            </p>
            <p className="text-xs text-gray-400">JPEG, PNG, or WEBP · up to 10MB</p>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3 sm:hidden">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-indigo-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C3.005 7.58 2.25 8.507 2.25 9.574v9.176c0 1.242 1.008 2.25 2.25 2.25h15c1.242 0 2.25-1.008 2.25-2.25V9.574c0-1.067-.755-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
            />
          </svg>
          Use camera
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleCameraCapture} />
        </label>
      </div>

      {displayError && <p className="mt-3 text-center text-sm text-red-600">{displayError}</p>}

      <button
        type="button"
        disabled={!file}
        onClick={() => file && onScan(file)}
        className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Scan Bill
      </button>
    </div>
  );
}
