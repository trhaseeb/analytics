// Sample Data Import Component - Example implementation

import { useState } from 'react';
import type { ComponentDefinition, ModalContentProps } from '../../types/components';

// Component content
const DataImportContent = ({ modalState, onClose }: ModalContentProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    // Simulate import process
    console.log('Importing files:', files);
    onClose?.();
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        {modalState === 'sidebar' ? 'Compact view' : 'Full import interface'}
      </div>

      {/* File Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <div className="space-y-4">
          <UploadIcon className="w-12 h-12 mx-auto text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports GeoJSON, CSV, KML, Shapefile
            </p>
          </div>
          <input
            type="file"
            multiple
            accept=".geojson,.json,.csv,.kml,.shp"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
          >
            Choose Files
          </label>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Selected Files</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <RemoveIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setFiles([])}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Import Files
          </button>
        </div>
      )}
    </div>
  );
};

// Flat minimal import icon
const DataImportIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

// Component definition
export const DataImportComponent: ComponentDefinition = {
  id: 'data-import',
  name: 'Import Data',
  description: 'Import GeoJSON, CSV, KML, and other geographic data formats',
  icon: <DataImportIcon />,
  primaryColor: '#3B82F6',
  secondaryColor: '#93C5FD',
  category: 'data',
  priority: 10,
  enabled: true,
  onLaunch: (onClose?: () => void) => ({
    id: 'data-import-modal',
    title: 'Import Geographic Data',
    content: <DataImportContent onClose={onClose} />,
    size: 'lg',
    initialState: 'modal',
    theme: {
      primaryColor: '#3B82F6',
      accentColor: '#93C5FD',
      headerStyle: 'branded',
      contentPadding: 'md'
    },
    closeable: true
  } as const)
};

// Simple icon components
const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const RemoveIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
