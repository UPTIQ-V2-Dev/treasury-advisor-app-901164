import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link as LinkIcon, ArrowRight, Clock, FileText } from 'lucide-react';
import { useUpload } from '@/hooks/useUpload';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { BankConnectionModal } from '@/components/upload/BankConnectionModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const UploadPage = () => {
    const navigate = useNavigate();
    const [showBankModal, setShowBankModal] = useState(false);
    const [clientInfo, setClientInfo] = useState({
        clientId: 'd6e8f2b5-0865-485a-a63e-d083fad36462', // Valid GUID format
        startDate: '',
        endDate: ''
    });

    const { files, validation, isUploading, progress, error, selectFiles, uploadFiles, removeFile, clearFiles } =
        useUpload({
            onSuccess: uploadedFiles => {
                console.log('Upload successful:', uploadedFiles);
                // Navigate to processing page after successful upload
                setTimeout(() => {
                    navigate('/processing', {
                        state: {
                            files: uploadedFiles,
                            clientId: clientInfo.clientId
                        }
                    });
                }, 2000);
            },
            onError: error => {
                console.error('Upload failed:', error);
            }
        });

    const handleFilesSelected = (selectedFiles: File[]) => {
        selectFiles(selectedFiles);
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validation?.isValid || files.length === 0) return;

        try {
            await uploadFiles({
                clientId: clientInfo.clientId,
                statementPeriod: {
                    startDate: clientInfo.startDate,
                    endDate: clientInfo.endDate
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
        }
    };

    const canProceed = validation?.isValid && files.length > 0;

    return (
        <div className='container mx-auto px-4 py-8 max-w-4xl'>
            {/* Header */}
            <div className='mb-8'>
                <h1 className='text-3xl font-bold text-gray-900 mb-2'>Upload Bank Statements</h1>
                <p className='text-lg text-gray-600'>
                    Upload your business bank statements to get personalized treasury recommendations
                </p>
            </div>

            <div className='grid gap-6 lg:grid-cols-3'>
                {/* Upload Section */}
                <div className='lg:col-span-2 space-y-6'>
                    {/* Upload Methods */}
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <Upload className='h-5 w-5' />
                                Choose Upload Method
                            </CardTitle>
                            <CardDescription>Select how you'd like to provide your bank statement data</CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            {/* Connect Bank Option */}
                            <div className='flex items-center justify-between p-4 border rounded-lg'>
                                <div className='flex items-center gap-3'>
                                    <LinkIcon className='h-8 w-8 text-blue-600' />
                                    <div>
                                        <h3 className='font-medium'>Connect Bank Account</h3>
                                        <p className='text-sm text-gray-500'>
                                            Securely connect for automatic data retrieval
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant='outline'
                                    onClick={() => setShowBankModal(true)}
                                >
                                    Connect
                                </Button>
                            </div>

                            <div className='flex items-center gap-4'>
                                <Separator className='flex-1' />
                                <span className='text-sm text-gray-500'>or</span>
                                <Separator className='flex-1' />
                            </div>

                            {/* Manual Upload Option */}
                            <div className='space-y-4'>
                                <div className='flex items-center gap-3'>
                                    <FileText className='h-8 w-8 text-green-600' />
                                    <div>
                                        <h3 className='font-medium'>Upload Files</h3>
                                        <p className='text-sm text-gray-500'>
                                            Upload PDF or CSV bank statements manually
                                        </p>
                                    </div>
                                </div>

                                {/* Statement Period */}
                                <div className='grid gap-4 sm:grid-cols-2'>
                                    <div className='space-y-2'>
                                        <Label htmlFor='start-date'>Statement Start Date</Label>
                                        <Input
                                            id='start-date'
                                            type='date'
                                            value={clientInfo.startDate}
                                            onChange={e =>
                                                setClientInfo(prev => ({
                                                    ...prev,
                                                    startDate: e.target.value
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className='space-y-2'>
                                        <Label htmlFor='end-date'>Statement End Date</Label>
                                        <Input
                                            id='end-date'
                                            type='date'
                                            value={clientInfo.endDate}
                                            onChange={e =>
                                                setClientInfo(prev => ({
                                                    ...prev,
                                                    endDate: e.target.value
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                {/* File Upload Zone */}
                                <FileUploadZone
                                    onFilesSelected={handleFilesSelected}
                                    selectedFiles={files}
                                    onRemoveFile={removeFile}
                                    disabled={isUploading}
                                />

                                {/* Upload Progress */}
                                {progress.length > 0 && <UploadProgress progress={progress} />}

                                {/* Error Display */}
                                {error && (
                                    <Alert variant='destructive'>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Upload Button */}
                                <form onSubmit={handleUploadSubmit}>
                                    <div className='flex gap-2'>
                                        <Button
                                            type='button'
                                            variant='outline'
                                            onClick={clearFiles}
                                            disabled={isUploading || files.length === 0}
                                        >
                                            Clear Files
                                        </Button>
                                        <Button
                                            type='submit'
                                            disabled={!canProceed || isUploading}
                                            className='flex-1'
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Upload className='h-4 w-4 mr-2 animate-bounce' />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowRight className='h-4 w-4 mr-2' />
                                                    Start Analysis
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Sidebar */}
                <div className='space-y-6'>
                    {/* Process Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-lg'>What Happens Next?</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='flex items-start gap-3'>
                                <div className='w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5'>
                                    1
                                </div>
                                <div>
                                    <p className='font-medium text-sm'>Data Processing</p>
                                    <p className='text-xs text-gray-500'>
                                        We'll extract and categorize your transactions
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-start gap-3'>
                                <div className='w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5'>
                                    2
                                </div>
                                <div>
                                    <p className='font-medium text-sm'>Analysis</p>
                                    <p className='text-xs text-gray-500'>
                                        Identify patterns, cash flow, and opportunities
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-start gap-3'>
                                <div className='w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5'>
                                    3
                                </div>
                                <div>
                                    <p className='font-medium text-sm'>Recommendations</p>
                                    <p className='text-xs text-gray-500'>
                                        Get personalized treasury product suggestions
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Processing Time */}
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-lg flex items-center gap-2'>
                                <Clock className='h-5 w-5' />
                                Processing Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2'>
                                <div className='flex justify-between'>
                                    <span className='text-sm'>Small files (&lt;1MB)</span>
                                    <span className='text-sm font-medium'>30-60 seconds</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm'>Large files (&gt;5MB)</span>
                                    <span className='text-sm font-medium'>2-5 minutes</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm'>Multiple files</span>
                                    <span className='text-sm font-medium'>5-10 minutes</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Notice */}
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-lg'>🔒 Data Security</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='text-sm text-gray-600 space-y-2'>
                                <p>Your financial data is protected with:</p>
                                <ul className='list-disc list-inside space-y-1 text-xs'>
                                    <li>Bank-grade 256-bit encryption</li>
                                    <li>Secure cloud processing</li>
                                    <li>Automatic data deletion after analysis</li>
                                    <li>No permanent data storage</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bank Connection Modal */}
            <BankConnectionModal
                isOpen={showBankModal}
                onClose={() => setShowBankModal(false)}
                clientId={clientInfo.clientId}
                onSuccess={connection => {
                    console.log('Bank connected:', connection);
                    // Could navigate to a different flow for bank connections
                }}
            />
        </div>
    );
};
