import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { statementsService } from '@/services/statements';
import { validateFileList, type FileValidationResult } from '@/lib/fileValidation';
import type { StatementUpload, StatementFile, UploadProgress } from '@/types/statements';

interface UseUploadOptions {
    onSuccess?: (files: StatementFile[]) => void;
    onError?: (error: Error) => void;
}

interface UploadState {
    files: File[];
    validation: FileValidationResult | null;
    isUploading: boolean;
    progress: UploadProgress[];
    error: string | null;
}

export const useUpload = (options: UseUploadOptions = {}) => {
    const [uploadState, setUploadState] = useState<UploadState>({
        files: [],
        validation: null,
        isUploading: false,
        progress: [],
        error: null
    });

    const queryClient = useQueryClient();

    const uploadMutation = useMutation({
        mutationFn: statementsService.uploadStatements,
        onSuccess: data => {
            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                progress: data.map(file => ({
                    fileId: file.id,
                    fileName: file.fileName,
                    progress: 100,
                    status: 'completed'
                }))
            }));

            queryClient.invalidateQueries({ queryKey: ['statements'] });
            options.onSuccess?.(data);
        },
        onError: (error: Error) => {
            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                error: error.message
            }));
            options.onError?.(error);
        }
    });

    const selectFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const validation = validateFileList(fileArray);

        setUploadState(prev => ({
            ...prev,
            files: fileArray,
            validation,
            error: validation.isValid ? null : validation.errors[0],
            progress: fileArray.map((file, index) => ({
                fileId: `temp-${index}`,
                fileName: file.name,
                progress: 0,
                status: 'pending'
            }))
        }));

        return validation;
    }, []);

    const uploadFiles = useCallback(
        async (uploadData: Omit<StatementUpload, 'files'>) => {
            if (!uploadState.validation?.isValid || uploadState.files.length === 0) {
                throw new Error('Invalid files selected');
            }

            setUploadState(prev => ({
                ...prev,
                isUploading: true,
                error: null,
                progress: prev.progress.map(p => ({ ...p, status: 'uploading' }))
            }));

            const fullUploadData: StatementUpload = {
                ...uploadData,
                files: uploadState.files
            };

            return uploadMutation.mutateAsync(fullUploadData);
        },
        [uploadState.files, uploadState.validation, uploadMutation]
    );

    const removeFile = useCallback((index: number) => {
        setUploadState(prev => {
            const newFiles = prev.files.filter((_, i) => i !== index);
            const validation = newFiles.length > 0 ? validateFileList(newFiles) : null;

            return {
                ...prev,
                files: newFiles,
                validation,
                error: validation && !validation.isValid ? validation.errors[0] : null,
                progress: prev.progress.filter((_, i) => i !== index)
            };
        });
    }, []);

    const clearFiles = useCallback(() => {
        setUploadState({
            files: [],
            validation: null,
            isUploading: false,
            progress: [],
            error: null
        });
    }, []);

    const reset = useCallback(() => {
        clearFiles();
        uploadMutation.reset();
    }, [clearFiles, uploadMutation]);

    return {
        // State
        files: uploadState.files,
        validation: uploadState.validation,
        isUploading: uploadState.isUploading,
        progress: uploadState.progress,
        error: uploadState.error,

        // Actions
        selectFiles,
        uploadFiles,
        removeFile,
        clearFiles,
        reset,

        // Mutation state
        isSuccess: uploadMutation.isSuccess,
        isError: uploadMutation.isError,
        mutationError: uploadMutation.error
    };
};
