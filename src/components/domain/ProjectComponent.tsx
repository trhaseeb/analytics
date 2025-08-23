// Project Component - Project management and field configuration

import { useState, useEffect } from 'react';
import { storageManager, type ProjectData } from '../../systems/StorageManager';
import type { ComponentDefinition, ModalContentProps } from '../../types/components';

interface ProjectField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select type
}

// Project structure designed for future import/export functionality
// interface ProjectData {
//   metadata: {
//     name: string;
//     description: string;
//     createdAt: string;
//     updatedAt: string;
//     version: string;
//   };
//   schema: {
//     fields: ProjectField[];
//   };
//   // Future: will contain actual feature data with field values
//   data?: {
//     features: Array<{
//       id: string;
//       geometry: any;
//       properties: Record<string, any>; // Field values based on schema
//     }>;
//   };
// }

// Component content
const ProjectContent = ({ modalState }: ModalContentProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fields' | 'settings'>('overview');
  const [projectName, setProjectName] = useState('Untitled Project');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectFields, setProjectFields] = useState<ProjectField[]>([
    { id: 'name', name: 'Name', type: 'text', required: true },
    { id: 'category', name: 'Category', type: 'select', required: false, options: ['Building', 'Road', 'Park', 'Other'] },
    { id: 'area', name: 'Area (sq m)', type: 'number', required: false }
  ]);
  
  // Field values for the form in overview tab
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Load saved data on component mount
  useEffect(() => {
    const savedData = storageManager.loadProjectData();
    if (savedData) {
      setProjectName(savedData.name);
      setProjectDescription(savedData.description);
      setProjectFields(savedData.fields);
      setFieldValues(savedData.fieldValues);
      setLastSaved(savedData.lastModified);
    }
  }, []);

  // Auto-save functionality with event dispatching
  const saveProject = () => {
    const projectData: ProjectData = {
      name: projectName,
      description: projectDescription,
      fields: projectFields,
      fieldValues,
      lastModified: new Date().toISOString()
    };
    
    try {
      storageManager.saveProjectData(projectData);
      setLastSaved(projectData.lastModified);
      
      // Dispatch update event for other components
      window.dispatchEvent(new CustomEvent('componentUpdated', {
        detail: { component: 'project', data: projectData }
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  };

  // Auto-save when project data changes
  useEffect(() => {
    if (projectName || projectDescription || projectFields.length > 0) {
      const timeoutId = setTimeout(() => {
        saveProject();
      }, 1000); // Save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [projectName, projectDescription, projectFields, fieldValues]);
  
  // New field form state
  const [newField, setNewField] = useState<Partial<ProjectField>>({
    name: '',
    type: 'text',
    required: false
  });
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>(['']);

  const addField = () => {
    if (newField.name) {
      const field: ProjectField = {
        id: Date.now().toString(),
        name: newField.name,
        type: newField.type || 'text',
        required: newField.required || false,
        options: newField.type === 'select' ? newFieldOptions.filter(opt => opt.trim()) : undefined
      };
      setProjectFields(prev => [...prev, field]);
      setNewField({ name: '', type: 'text', required: false });
      setNewFieldOptions(['']);
    }
  };

  const removeField = (id: string) => {
    setProjectFields(prev => prev.filter(field => field.id !== id));
    // Remove field value when field is deleted
    setFieldValues(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const updateFieldValue = (fieldId: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const addOptionToNewField = () => {
    setNewFieldOptions(prev => [...prev, '']);
  };

  const updateNewFieldOption = (index: number, value: string) => {
    setNewFieldOptions(prev => prev.map((opt, i) => i === index ? value : opt));
  };

  const removeNewFieldOption = (index: number) => {
    setNewFieldOptions(prev => prev.filter((_, i) => i !== index));
  };

  const renderFieldInput = (field: ProjectField) => {
    const value = fieldValues[field.id] || '';
    
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder={`Enter ${field.name.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder={`Enter ${field.name.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={field.id}
                value="true"
                checked={value === 'true'}
                onChange={(e) => updateFieldValue(field.id, e.target.value)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={field.id}
                value="false"
                checked={value === 'false'}
                onChange={(e) => updateFieldValue(field.id, e.target.value)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 mr-2"
              />
              No
            </label>
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required={field.required}
          >
            <option value="">Select {field.name.toLowerCase()}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return null;
    }
  };

  const isCompact = modalState === 'sidebar';

  return (
    <div className="space-y-6">
      {isCompact && (
        <div className="text-xs text-gray-500 mb-4">Project Manager - Compact View</div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Project Overview' },
            { id: 'fields', name: 'Field Configuration' },
            { id: 'settings', name: 'Import/Export' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Project Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Describe your project..."
              />
            </div>
          </div>

          {/* Data Entry Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Data Entry Form</h4>
              {projectFields.length === 0 && (
                <button
                  onClick={() => setActiveTab('fields')}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Add Fields →
                </button>
              )}
            </div>
            
            {projectFields.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  {projectFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderFieldInput(field)}
                    </div>
                  ))}
                </form>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FormIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-500 mb-2">No data fields configured yet</p>
                <p className="text-xs text-gray-400 mb-4">Configure your project fields to start collecting data</p>
                <button
                  onClick={() => setActiveTab('fields')}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Configure Fields →
                </button>
              </div>
            )}
          </div>

          {/* Project Summary */}
          {projectFields.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-3">Project Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Total Fields:</span>
                    <span className="font-medium text-purple-900">{projectFields.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Required Fields:</span>
                    <span className="font-medium text-purple-900">{projectFields.filter(f => f.required).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Filled Fields:</span>
                    <span className="font-medium text-purple-900">{Object.keys(fieldValues).filter(key => fieldValues[key]).length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Text Fields:</span>
                    <span className="font-medium text-purple-900">{projectFields.filter(f => f.type === 'text').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Number Fields:</span>
                    <span className="font-medium text-purple-900">{projectFields.filter(f => f.type === 'number').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Select Fields:</span>
                    <span className="font-medium text-purple-900">{projectFields.filter(f => f.type === 'select').length}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex items-center text-sm text-purple-700">
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Ready for data collection and future import/export
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'fields' && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Current Fields</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projectFields.map(field => (
                <div key={field.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">{field.name}</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded capitalize">
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      {field.type === 'select' && field.options && (
                        <div className="text-xs text-gray-600">
                          Options: {field.options.join(', ')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeField(field.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <RemoveIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Add New Field</h4>
            <div className="space-y-4">
              {/* Basic Field Info */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newField.name || ''}
                  onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Field name"
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <select
                  value={newField.type || 'text'}
                  onChange={(e) => {
                    const type = e.target.value as any;
                    setNewField(prev => ({ ...prev, type }));
                    if (type === 'select') {
                      setNewFieldOptions(['Option 1', 'Option 2']);
                    } else {
                      setNewFieldOptions(['']);
                    }
                  }}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Yes/No</option>
                  <option value="date">Date</option>
                  <option value="select">Dropdown</option>
                </select>
              </div>

              {/* Dropdown Options */}
              {newField.type === 'select' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-blue-900">Dropdown Options</h5>
                    <button
                      onClick={addOptionToNewField}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Option
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newFieldOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateNewFieldOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {newFieldOptions.length > 1 && (
                          <button
                            onClick={() => removeNewFieldOption(index)}
                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <RemoveIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Field Settings */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newField.required || false}
                    onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-2"
                  />
                  <span className="text-sm text-gray-700">Required field</span>
                </label>
                <button
                  onClick={addField}
                  disabled={!newField.name || (newField.type === 'select' && !newFieldOptions.some(opt => opt.trim()))}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Current Project Schema Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Current Project Schema</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Project Name:</span>
                <span className="font-medium">{projectName || 'Untitled Project'}</span>
              </div>
              <div className="flex justify-between">
                <span>Configured Fields:</span>
                <span className="font-medium">{projectFields.length}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-xs text-gray-500">
                  This schema will be used for importing/exporting project data including field values and feature properties
                </p>
              </div>
            </div>
          </div>

          {/* Import/Export Actions */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Import Project</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <UploadIcon className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Import project with data and schema</p>
                <p className="text-xs text-gray-500 mb-4">
                  Will load project configuration, field definitions, and feature data with field values
                </p>
                <button
                  disabled
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                >
                  Select Project File (Coming Soon)
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Export Project</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <DownloadIcon className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Export complete project</p>
                <p className="text-xs text-gray-500 mb-4">
                  Will include project metadata, field schema, and all feature data with properties
                </p>
                <button
                  disabled
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                >
                  Download Project (Coming Soon)
                </button>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              <InfoIcon className="w-4 h-4 inline mr-2" />
              Future Implementation Details
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Project files will include schema + data structure</p>
              <p>• Field values will be preserved during import/export</p>
              <p>• Supports GeoJSON format with custom properties</p>
              <p>• Schema validation ensures data integrity</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        {/* Save Status */}
        <div className="text-sm text-gray-500">
          {lastSaved ? (
            <span>Last saved: {new Date(lastSaved).toLocaleString()}</span>
          ) : (
            <span>Project not saved yet</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {projectFields.length > 0 && (
            <button
              onClick={() => setFieldValues({})}
              className="px-4 py-2 text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              Clear Form Data
            </button>
          )}
          
          {/* Auto-save status indicator */}
          <div className="flex items-center px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Auto-saving changes
          </div>
        </div>
      </div>
    </div>
  );
};

// Flat minimal project icon
const ProjectIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// Component definition
export const ProjectComponent: ComponentDefinition = {
  id: 'project',
  name: 'Project Manager',
  description: 'Manage project settings, field configuration, and data structure',
  icon: <ProjectIcon />,
  primaryColor: '#7C3AED',
  secondaryColor: '#A78BFA',
  category: 'data',
  priority: 5,
  enabled: true,
  onLaunch: (_onClose?: () => void) => ({
    id: 'project-modal',
    title: 'Project Manager',
    content: <ProjectContent />,
    size: 'lg',
    initialState: 'modal',
    theme: {
      primaryColor: '#7C3AED',
      accentColor: '#A78BFA',
      headerStyle: 'branded',
      contentPadding: 'md'
    },
    closeable: true,
    sidebarWidth: 400
  })
};

// Simple icon components
const RemoveIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FormIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
