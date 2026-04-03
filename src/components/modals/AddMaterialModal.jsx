import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, FileText, Link as LinkIcon, Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createMaterial, updateMaterial } from "../../store/classroomsSlice";
import { uploadImages } from "../../lib/cloudinaryService";

export default function AddMaterialModal({ onClose, classroomId, material }) {
  const dispatch = useDispatch();
  const { status } = useSelector((state) => state.classrooms);
  const [title, setTitle] = useState(material?.title || "");
  const [type, setType] = useState(material?.type || "pdf");
  const [url, setUrl] = useState(material?.url || "");
  const [size, setSize] = useState(material?.size || "");

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [imageFiles, setImageFiles] = useState([]);
  
  // If it's an image material, `url` holds a comma-separated list of image URLs originally.
  const [imagePreviews, setImagePreviews] = useState(
    material?.type === "image" && material.url ? material.url.split(",") : []
  );

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    if (index < imagePreviews.length - imageFiles.length) {
      // It's an existing image (from `url`), we must remove it from the `url` string.
      const existingUrls = url ? url.split(",") : [];
      existingUrls.splice(index, 1);
      setUrl(existingUrls.join(","));
    } else {
      // It's a newly added file
      const fileIndex = index - (imagePreviews.length - imageFiles.length);
      setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (type !== "image" && !url.trim()) return;
    if (type === "image" && imagePreviews.length === 0) return;

    try {
      setIsUploading(true);
      let finalUrl = url;
      if (type === "image") {
        let uploadedUrls = [];
        if (imageFiles.length > 0) {
          uploadedUrls = await uploadImages(imageFiles);
        }
        const existingUrls = finalUrl ? finalUrl.split(",") : [];
        finalUrl = [...existingUrls, ...uploadedUrls].filter(Boolean).join(",");
      }

      const materialData = {
        id: material?.id || `m-${Date.now()}`,
        title,
        type,
        url: finalUrl,
        size: size || undefined,
      };

      if (material) {
        dispatch(updateMaterial({ classroomId, materialId: material.id, materialData }));
      } else {
        delete materialData.id;
        dispatch(createMaterial({ classroomId, materialData }));
      }
      onClose();
    } catch (err) {
      console.error("Material upload failed:", err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      {isUploading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-emerald-400 font-medium">Uploading image...</p>
          </div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-4 sm:p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-white">Add Material</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Material Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="e.g., Sicilian Defense Guide"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["pdf", "image", "video", "link"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    type === t
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {type !== "image" ? (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                URL / Link
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="https://..."
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Upload Images
              </label>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
              />
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2 mb-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt="preview" className="w-20 h-20 rounded-xl border border-slate-600 object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-600 hover:border-emerald-500 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                <span>{imagePreviews.length > 0 ? "Add More Images" : "Click to browse for images"}</span>
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Size (Optional, e.g., 2.4 MB)
            </label>
            <div className="relative">
              <Download className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g., 1.5 MB"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Saving..." : (material ? "Update Material" : "Add Material")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
