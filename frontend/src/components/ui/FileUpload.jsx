import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X } from 'lucide-react'

export default function FileUpload({ 
  onFilesSelected, 
  accept = {},
  maxFiles = 1,
  files = [],
  onRemove 
}) {
  const onDrop = useCallback((acceptedFiles) => {
    onFilesSelected(acceptedFiles)
  }, [onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50 shadow-inner'
            : 'border-slate-300 bg-white/60 hover:bg-white hover:border-primary-400 hover:shadow-sm'
        }`}
      >
        <input {...getInputProps()} />
        <div className="bg-slate-50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center transition-transform group-hover:scale-110">
          <Upload className="w-10 h-10 text-slate-400" />
        </div>
        {isDragActive ? (
          <p className="text-primary-600 font-medium tracking-wide">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-slate-700 font-semibold mb-2 text-lg">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-slate-500 font-medium">
              {maxFiles === 1 ? 'Single file' : `Up to ${maxFiles} files`}
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border border-white rounded-xl shadow-sm hover:shadow transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary-50 p-2.5 rounded-lg text-primary-600">
                  <File className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                  <p className="text-xs font-medium text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {onRemove && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                  className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
