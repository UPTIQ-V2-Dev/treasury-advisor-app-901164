import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Link, Loader2, Check } from 'lucide-react';
import { statementsService } from '@/services/statements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BankConnection } from '@/types/statements';

interface BankConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    onSuccess?: (connection: BankConnection) => void;
}

interface ConnectionForm {
    bankName: string;
    accountId: string;
    connectionType: 'api' | 'manual';
}

const POPULAR_BANKS = [
    'Wells Fargo',
    'Bank of America',
    'JPMorgan Chase',
    'Citi',
    'U.S. Bank',
    'Truist',
    'PNC Bank',
    'Capital One',
    'TD Bank',
    'Bank of New York Mellon',
    'Other'
];

export const BankConnectionModal = ({ isOpen, onClose, clientId, onSuccess }: BankConnectionModalProps) => {
    const [form, setForm] = useState<ConnectionForm>({
        bankName: '',
        accountId: '',
        connectionType: 'api'
    });
    const [customBankName, setCustomBankName] = useState('');

    const queryClient = useQueryClient();

    const connectMutation = useMutation({
        mutationFn: statementsService.connectBank,
        onSuccess: connection => {
            queryClient.invalidateQueries({ queryKey: ['bank-connections', clientId] });
            onSuccess?.(connection);
            handleClose();
        }
    });

    const handleClose = () => {
        setForm({
            bankName: '',
            accountId: '',
            connectionType: 'api'
        });
        setCustomBankName('');
        connectMutation.reset();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const bankName = form.bankName === 'Other' ? customBankName : form.bankName;

        if (!bankName || !form.accountId) return;

        connectMutation.mutate({
            bankName,
            accountId: form.accountId,
            connectionType: form.connectionType,
            status: 'disconnected'
        });
    };

    const isFormValid = () => {
        const bankName = form.bankName === 'Other' ? customBankName : form.bankName;
        return bankName.trim() !== '' && form.accountId.trim() !== '';
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={handleClose}
        >
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <Link className='h-5 w-5' />
                        Connect Bank Account
                    </DialogTitle>
                    <DialogDescription>
                        Connect your bank account for automated statement retrieval. We use secure, read-only access to
                        your account data.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className='space-y-4'
                >
                    {/* Bank Selection */}
                    <div className='space-y-2'>
                        <Label htmlFor='bank-select'>Bank</Label>
                        <Select
                            value={form.bankName}
                            onValueChange={value => setForm(prev => ({ ...prev, bankName: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder='Select your bank' />
                            </SelectTrigger>
                            <SelectContent>
                                {POPULAR_BANKS.map(bank => (
                                    <SelectItem
                                        key={bank}
                                        value={bank}
                                    >
                                        <div className='flex items-center gap-2'>
                                            <Building2 className='h-4 w-4' />
                                            {bank}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom Bank Name Input */}
                    {form.bankName === 'Other' && (
                        <div className='space-y-2'>
                            <Label htmlFor='custom-bank'>Bank Name</Label>
                            <Input
                                id='custom-bank'
                                type='text'
                                value={customBankName}
                                onChange={e => setCustomBankName(e.target.value)}
                                placeholder='Enter your bank name'
                                required
                            />
                        </div>
                    )}

                    {/* Account ID */}
                    <div className='space-y-2'>
                        <Label htmlFor='account-id'>Account Number</Label>
                        <Input
                            id='account-id'
                            type='text'
                            value={form.accountId}
                            onChange={e => setForm(prev => ({ ...prev, accountId: e.target.value }))}
                            placeholder='Enter account number'
                            required
                        />
                    </div>

                    {/* Connection Type */}
                    <div className='space-y-2'>
                        <Label htmlFor='connection-type'>Connection Method</Label>
                        <Select
                            value={form.connectionType}
                            onValueChange={(value: 'api' | 'manual') =>
                                setForm(prev => ({ ...prev, connectionType: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='api'>
                                    <div className='space-y-1'>
                                        <p className='font-medium'>API Connection (Recommended)</p>
                                        <p className='text-xs text-gray-500'>Automatic statement retrieval</p>
                                    </div>
                                </SelectItem>
                                <SelectItem value='manual'>
                                    <div className='space-y-1'>
                                        <p className='font-medium'>Manual Upload</p>
                                        <p className='text-xs text-gray-500'>Upload statements manually</p>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Error Display */}
                    {connectMutation.isError && (
                        <Alert variant='destructive'>
                            <AlertDescription>
                                {connectMutation.error?.message || 'Failed to connect bank account'}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Success Display */}
                    {connectMutation.isSuccess && (
                        <Alert>
                            <Check className='h-4 w-4' />
                            <AlertDescription>Bank account connected successfully!</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter className='gap-2'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type='submit'
                            disabled={!isFormValid() || connectMutation.isPending}
                        >
                            {connectMutation.isPending ? (
                                <>
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Link className='h-4 w-4 mr-2' />
                                    Connect Bank
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>

                {/* Security Notice */}
                <div className='text-xs text-gray-500 bg-gray-50 p-3 rounded-lg'>
                    <p className='font-medium mb-1'>🔒 Security Notice</p>
                    <p>
                        We use bank-grade encryption and only request read-only access to your account. Your login
                        credentials are never stored on our servers.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
