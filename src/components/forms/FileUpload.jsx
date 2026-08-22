import React, { useState } from "react";
import { Upload, FileText, Check, AlertCircle, Trash2 } from "lucide-react";
import { uploadFile } from "../../services/storageService";
import { Button } from "../common/Button";

/**
 * FileUpload component that connects to Firebase Storage and reports status/URL to the parent form.
 */
export const FileUpload = ({
  folder = "materials",
  onUploadSuccess,
  onClear,
  initialFileUrl = "",
  initialFileName = "",
  accept = "application/pdf",
  maxSizeMb = 25,
}) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState(initialFileUrl);
  const [uploadedName, setUploadedName] = useState(initialFileName);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError("");

    // Accept checks
    if (accept === "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError(`Only PDF documents are permitted.`);
      return;
    }

    // Size checks
    if (selectedFile.size > maxSizeMb * 1024 * 1024) {
      setError(`File size limit exceeded. Max size allowed is ${maxSizeMb}MB.`);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");
    setProgress(0);

    try {
      const { downloadUrl, storagePath } = await uploadFile(folder, file, (percent) => {
        setProgress(percent);
      });

      setUploadedUrl(downloadUrl);
      setUploadedName(file.name);
      
      if (onUploadSuccess) {
        onUploadSuccess({
          pdfUrl: downloadUrl,
          storagePath,
          fileName: file.name,
          fileSize: file.size
        });
      }
      setFile(null);
    } catch (err) {
      console.error("Storage upload failed:", err);
      setError("File upload failed. Please verify your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploadedUrl("");
    setUploadedName("");
    setProgress(0);
    if (onClear) onClear();
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50 transition-all shrink-0">
      {!file && !uploadedUrl ? (
        <label className="flex flex-col items-center justify-center cursor-pointer gap-2 py-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Upload className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-slate-800">Select PDF File</span>
          <span className="text-xs text-slate-400">Only PDF documents up to {maxSizeMb}MB</span>
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : file ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
            <div className="p-2 bg-red-50 text-red-500 rounded-lg shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={uploading}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {uploading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!uploading && (
            <Button onClick={handleUpload} className="w-full">
              Upload File
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
            <Check className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-950 truncate">{uploadedName || "Uploaded File"}</p>
            <p className="text-xs text-emerald-600">Upload Complete</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 hover:bg-emerald-100/50 text-emerald-600 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
