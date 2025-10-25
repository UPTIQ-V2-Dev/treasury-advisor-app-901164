export interface FileValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export const ALLOWED_FILE_TYPES = {
    pdf: 'application/pdf',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_UPLOAD = 5;

export const validateFile = (file: File): FileValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        errors.push(`File "${file.name}" is too large. Maximum size is 10MB.`);
    }

    // Check file type
    const allowedTypes = Object.values(ALLOWED_FILE_TYPES);
    if (!allowedTypes.includes(file.type)) {
        // Also check file extension as fallback
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !Object.keys(ALLOWED_FILE_TYPES).includes(extension)) {
            errors.push(`File "${file.name}" has an unsupported format. Please upload PDF, CSV, or Excel files only.`);
        } else {
            warnings.push(`File "${file.name}" type could not be verified but has a valid extension.`);
        }
    }

    // Check filename
    if (file.name.length > 255) {
        errors.push(`File "${file.name}" has a name that is too long.`);
    }

    // Check for potentially dangerous characters in filename
    // eslint-disable-next-line no-control-regex
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(file.name)) {
        errors.push(`File "${file.name}" contains invalid characters in the filename.`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

export const validateFileList = (files: FileList | File[]): FileValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fileArray = Array.from(files);

    // Check number of files
    if (fileArray.length > MAX_FILES_PER_UPLOAD) {
        errors.push(`Too many files selected. Maximum is ${MAX_FILES_PER_UPLOAD} files per upload.`);
    }

    if (fileArray.length === 0) {
        errors.push('Please select at least one file to upload.');
    }

    // Check each file individually
    fileArray.forEach(file => {
        const fileResult = validateFile(file);
        errors.push(...fileResult.errors);
        warnings.push(...fileResult.warnings);
    });

    // Check for duplicate filenames
    const filenames = fileArray.map(f => f.name);
    const duplicates = filenames.filter((name, index) => filenames.indexOf(name) !== index);
    if (duplicates.length > 0) {
        errors.push(`Duplicate filenames detected: ${[...new Set(duplicates)].join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors: [...new Set(errors)], // Remove duplicates
        warnings: [...new Set(warnings)]
    };
};

export const getFileTypeFromExtension = (filename: string): keyof typeof ALLOWED_FILE_TYPES | null => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension && Object.keys(ALLOWED_FILE_TYPES).includes(extension)) {
        return extension as keyof typeof ALLOWED_FILE_TYPES;
    }
    return null;
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
};

export const isPDFFile = (file: File): boolean => {
    return file.type === ALLOWED_FILE_TYPES.pdf;
};

export const isCSVFile = (file: File): boolean => {
    return file.type === ALLOWED_FILE_TYPES.csv || file.name.toLowerCase().endsWith('.csv');
};

export const isExcelFile = (file: File): boolean => {
    return (
        file.type === ALLOWED_FILE_TYPES.xlsx ||
        file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.xls')
    );
};
