import { CheckCircle2, XCircle, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { UploadProgress as UploadProgressType } from '@/types/statements';

interface UploadProgressProps {
    progress: UploadProgressType[];
    className?: string;
}

export const UploadProgress = ({ progress, className }: UploadProgressProps) => {
    if (progress.length === 0) return null;

    const completedCount = progress.filter(p => p.status === 'completed').length;
    const errorCount = progress.filter(p => p.status === 'error').length;
    const totalProgress = progress.reduce((sum, p) => sum + p.progress, 0) / progress.length;

    const getStatusIcon = (status: UploadProgressType['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className='h-5 w-5 text-green-600' />;
            case 'error':
                return <XCircle className='h-5 w-5 text-red-600' />;
            case 'uploading':
            case 'processing':
                return <Loader2 className='h-5 w-5 text-blue-600 animate-spin' />;
            case 'pending':
                return <Upload className='h-5 w-5 text-gray-400' />;
            default:
                return <Upload className='h-5 w-5 text-gray-400' />;
        }
    };

    const getStatusText = (status: UploadProgressType['status']) => {
        switch (status) {
            case 'completed':
                return 'Completed';
            case 'error':
                return 'Error';
            case 'uploading':
                return 'Uploading...';
            case 'processing':
                return 'Processing...';
            case 'pending':
                return 'Pending';
            default:
                return 'Unknown';
        }
    };

    const getStatusColor = (status: UploadProgressType['status']) => {
        switch (status) {
            case 'completed':
                return 'text-green-600';
            case 'error':
                return 'text-red-600';
            case 'uploading':
            case 'processing':
                return 'text-blue-600';
            case 'pending':
                return 'text-gray-500';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Overall Progress */}
            <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                    <h3 className='font-medium text-gray-900'>Upload Progress</h3>
                    <span className='text-sm text-gray-500'>
                        {completedCount}/{progress.length} completed
                        {errorCount > 0 && ` • ${errorCount} failed`}
                    </span>
                </div>
                <Progress
                    value={totalProgress}
                    className='h-2'
                />
                <p className='text-xs text-gray-500'>{Math.round(totalProgress)}% complete</p>
            </div>

            {/* Individual File Progress */}
            <div className='space-y-2'>
                {progress.map((fileProgress, index) => (
                    <div
                        key={fileProgress.fileId}
                        className={cn(
                            'p-3 rounded-lg border',
                            fileProgress.status === 'completed' && 'bg-green-50 border-green-200',
                            fileProgress.status === 'error' && 'bg-red-50 border-red-200',
                            (fileProgress.status === 'uploading' || fileProgress.status === 'processing') &&
                                'bg-blue-50 border-blue-200',
                            fileProgress.status === 'pending' && 'bg-gray-50 border-gray-200'
                        )}
                    >
                        <div className='flex items-start justify-between'>
                            <div className='flex items-start gap-3 flex-1 min-w-0'>
                                {getStatusIcon(fileProgress.status)}
                                <div className='flex-1 min-w-0'>
                                    <p className='font-medium text-sm text-gray-900 truncate'>
                                        {fileProgress.fileName}
                                    </p>
                                    <p className={cn('text-xs', getStatusColor(fileProgress.status))}>
                                        {getStatusText(fileProgress.status)}
                                    </p>
                                    {fileProgress.error && (
                                        <p className='text-xs text-red-600 mt-1'>{fileProgress.error}</p>
                                    )}
                                </div>
                            </div>
                            <div className='text-right'>
                                <p className='text-sm font-medium text-gray-900'>{fileProgress.progress}%</p>
                            </div>
                        </div>

                        {/* Progress bar for individual files */}
                        {fileProgress.status !== 'completed' && fileProgress.status !== 'error' && (
                            <div className='mt-2'>
                                <Progress
                                    value={fileProgress.progress}
                                    className='h-1.5'
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Error Summary */}
            {errorCount > 0 && (
                <Alert variant='destructive'>
                    <XCircle className='h-4 w-4' />
                    <AlertDescription>
                        {errorCount} file{errorCount > 1 ? 's' : ''} failed to upload. Please check the errors above and
                        try again.
                    </AlertDescription>
                </Alert>
            )}

            {/* Success Summary */}
            {completedCount === progress.length && progress.length > 0 && (
                <Alert>
                    <CheckCircle2 className='h-4 w-4' />
                    <AlertDescription>
                        All files uploaded successfully! You can now proceed with the analysis.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};
