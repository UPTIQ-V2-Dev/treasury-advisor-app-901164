import { useQuery } from '@tanstack/react-query';
import { Users, Building2, Factory } from 'lucide-react';
import { clientsService } from '@/services/clients';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client } from '@/types/client';

interface ClientSelectorProps {
    selectedClientId: string;
    onClientSelect: (clientId: string) => void;
    disabled?: boolean;
}

const getClientIcon = (businessSegment: string) => {
    switch (businessSegment) {
        case 'small':
            return <Building2 className='h-4 w-4' />;
        case 'medium':
            return <Factory className='h-4 w-4' />;
        case 'large':
        case 'enterprise':
            return <Users className='h-4 w-4' />;
        default:
            return <Users className='h-4 w-4' />;
    }
};

const getBusinessSegmentLabel = (segment: string) => {
    switch (segment) {
        case 'small':
            return 'Small Business';
        case 'medium':
            return 'Medium Business';
        case 'large':
            return 'Large Business';
        case 'enterprise':
            return 'Enterprise';
        default:
            return segment;
    }
};

export const ClientSelector = ({ selectedClientId, onClientSelect, disabled = false }: ClientSelectorProps) => {
    const {
        data: clientsResponse,
        isLoading,
        error
    } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientsService.getClients()
    });

    const clients = clientsResponse?.clients || [];

    const selectedClient = clients?.find((client: Client) => client.id === selectedClientId);

    if (isLoading) {
        return (
            <div className='space-y-2'>
                <Label>Select Client</Label>
                <Skeleton className='h-10 w-full' />
            </div>
        );
    }

    if (error) {
        return (
            <div className='space-y-2'>
                <Label>Select Client</Label>
                <div className='text-sm text-red-600'>Failed to load clients</div>
            </div>
        );
    }

    return (
        <div className='space-y-2'>
            <Label htmlFor='client-select'>Select Client</Label>
            <Select
                value={selectedClientId}
                onValueChange={onClientSelect}
                disabled={disabled}
            >
                <SelectTrigger>
                    <SelectValue placeholder='Choose a client'>
                        {selectedClient ? (
                            <div className='flex items-center gap-2'>
                                {getClientIcon(selectedClient.businessSegment)}
                                <span className='font-medium'>{selectedClient.name}</span>
                                <span className='text-xs text-gray-500'>
                                    {selectedClient.industry} •{' '}
                                    {getBusinessSegmentLabel(selectedClient.businessSegment)}
                                </span>
                            </div>
                        ) : (
                            'Choose a client'
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {clients?.map((client: Client) => (
                        <SelectItem
                            key={client.id}
                            value={client.id}
                        >
                            <div className='flex items-center gap-3'>
                                {getClientIcon(client.businessSegment)}
                                <div>
                                    <p className='font-medium'>{client.name}</p>
                                    <p className='text-xs text-gray-500'>
                                        {client.industry} • {getBusinessSegmentLabel(client.businessSegment)}
                                    </p>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
