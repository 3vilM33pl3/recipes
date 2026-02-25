import { useState, useRef } from 'react';

function UploadForm({ onUpload, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      // For documents, show a placeholder
      setPreview('document');
    }

    // Trigger upload
    onUpload(file);
  };

  const isDocument = preview === 'document';

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors
          ${dragActive ? 'border-fire-500 bg-fire-50' : 'border-gray-300'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleChange}
          disabled={isLoading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,.doc,.docx"
          className="hidden"
          onChange={handleChange}
          disabled={isLoading}
        />

        {preview && isLoading ? (
          <div className="space-y-4">
            {isDocument ? (
              <div className="text-5xl">📄</div>
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg shadow-md"
              />
            )}
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-fire-500"></div>
              <span className="text-gray-600">Processing your recipe...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-5xl">📷</div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                Upload a recipe
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Photo or Word document
              </p>
            </div>

            {/* Mobile-friendly large buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                type="button"
                className="btn-primary py-4 px-6 text-lg flex items-center justify-center gap-2 min-h-[56px] touch-manipulation"
                onClick={() => cameraInputRef.current?.click()}
              >
                <span>📸</span>
                <span>Take Photo</span>
              </button>
              <button
                type="button"
                className="btn-secondary py-4 px-6 text-lg flex items-center justify-center gap-2 min-h-[56px] touch-manipulation"
                onClick={() => fileInputRef.current?.click()}
              >
                <span>📁</span>
                <span>Choose File</span>
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Supports JPEG, PNG, HEIC, and Word docs
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadForm;
