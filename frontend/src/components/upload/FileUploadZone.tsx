import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/formatters';
import { validateFileList } from '@/lib/fileValidation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadZoneProps {
    onFilesSelected: (files: File[]) => void;
    selectedFiles: File[];
    onRemoveFile: (index: number) => void;
    maxFiles?: number;
    disabled?: boolean;
    className?: string;
}

export const FileUploadZone = ({
    onFilesSelected,
    selectedFiles,
    onRemoveFile,
    maxFiles = 5,
    disabled = false,
    className
}: FileUploadZoneProps) => {
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const allFiles = [...selectedFiles, ...acceptedFiles];
            const validation = validateFileList(allFiles);

            if (validation.isValid) {
                onFilesSelected(allFiles);
                setValidationErrors([]);
            } else {
                setValidationErrors(validation.errors);
            }
        },
        [selectedFiles, onFilesSelected]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxFiles: maxFiles - selectedFiles.length,
        disabled: disabled || selectedFiles.length >= maxFiles
    });

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const fileArray = Array.from(files);
            const allFiles = [...selectedFiles, ...fileArray];
            const validation = validateFileList(allFiles);

            if (validation.isValid) {
                onFilesSelected(allFiles);
                setValidationErrors([]);
            } else {
                setValidationErrors(validation.errors);
            }
        }
    };

    const canAddMore = selectedFiles.length < maxFiles && !disabled;

    return (
        <div className={cn('space-y-4', className)}>
            {/* Drop Zone */}
            {canAddMore && (
                <div
                    {...getRootProps()}
                    className={cn(
                        'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <input {...getInputProps()} />
                    <Upload className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                    <div className='space-y-2'>
                        <p className='text-lg font-medium text-gray-900'>
                            {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to browse'}
                        </p>
                        <p className='text-sm text-gray-500'>Supports PDF, CSV, and Excel files up to 10MB each</p>
                        <p className='text-xs text-gray-400'>
                            Maximum {maxFiles} files per upload ({maxFiles - selectedFiles.length} remaining)
                        </p>
                    </div>
                </div>
            )}

            {/* Manual File Input Button */}
            {canAddMore && (
                <div className='text-center'>
                    <Button
                        variant='outline'
                        disabled={disabled}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <Upload className='h-4 w-4 mr-2' />
                        Choose Files
                    </Button>
                    <input
                        id='file-input'
                        type='file'
                        multiple
                        accept='.pdf,.csv,.xlsx'
                        onChange={handleFileInputChange}
                        className='hidden'
                        disabled={disabled}
                    />
                </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <Alert variant='destructive'>
                    <AlertTriangle className='h-4 w-4' />
                    <AlertDescription>
                        <ul className='list-disc list-inside space-y-1'>
                            {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
                <div className='space-y-2'>
                    <h4 className='font-medium text-gray-900'>Selected Files ({selectedFiles.length})</h4>
                    <div className='space-y-2'>
                        {selectedFiles.map((file, index) => (
                            <div
                                key={index}
                                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                            >
                                <div className='flex items-center gap-3'>
                                    <FileText className='h-5 w-5 text-blue-600' />
                                    <div>
                                        <p className='font-medium text-sm text-gray-900'>{file.name}</p>
                                        <p className='text-xs text-gray-500'>
                                            {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => onRemoveFile(index)}
                                    disabled={disabled}
                                    className='text-gray-400 hover:text-red-600'
                                >
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* File Requirements */}
            <div className='text-xs text-gray-500 space-y-1'>
                <p>
                    <strong>Supported formats:</strong> PDF, CSV, Excel (.xlsx)
                </p>
                <p>
                    <strong>Maximum file size:</strong> 10MB per file
                </p>
                <p>
                    <strong>Maximum files:</strong> {maxFiles} files per upload
                </p>
            </div>
        </div>
    );
};
