import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { clientsService } from '@/services/clients';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ClientSelectorProps {
    selectedClientId?: string | null;
    onClientChange: (clientId: string | null) => void;
    placeholder?: string;
}

export const ClientSelector = ({
    selectedClientId,
    onClientChange,
    placeholder = 'Select client...'
}: ClientSelectorProps) => {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();

    // Fetch clients based on user role
    const { data: clientsData, isLoading } = useQuery({
        queryKey: ['clients-selector'],
        queryFn: async () => {
            if (user?.role === 'ADMIN') {
                return clientsService.getClients();
            } else {
                const clients = await clientsService.getClientsByRM(user?.id.toString() || '');
                return { clients, total: clients.length, pages: 1 };
            }
        },
        enabled: !!user
    });

    const clients = clientsData?.clients || [];
    const selectedClient = clients.find(client => client.id === selectedClientId);

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={open}
                    className='w-full justify-between'
                >
                    {selectedClient ? (
                        <span className='truncate'>{selectedClient.name}</span>
                    ) : (
                        <span className='text-muted-foreground'>{placeholder}</span>
                    )}
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className='w-full p-0'
                align='start'
            >
                <Command>
                    <CommandInput
                        placeholder='Search clients...'
                        className='h-9'
                    />
                    <CommandEmpty>{isLoading ? 'Loading clients...' : 'No clients found.'}</CommandEmpty>
                    <CommandGroup>
                        {/* All Clients option for admins */}
                        {user?.role === 'ADMIN' && (
                            <CommandItem
                                value=''
                                onSelect={() => {
                                    onClientChange(null);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn('mr-2 h-4 w-4', !selectedClientId ? 'opacity-100' : 'opacity-0')}
                                />
                                All Clients
                            </CommandItem>
                        )}

                        {/* Individual client options */}
                        {clients.map(client => (
                            <CommandItem
                                key={client.id}
                                value={client.id}
                                onSelect={() => {
                                    onClientChange(client.id === selectedClientId ? null : client.id);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4',
                                        selectedClientId === client.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                                <div className='flex-1'>
                                    <div className='font-medium'>{client.name}</div>
                                    <div className='text-xs text-muted-foreground'>
                                        {client.industry} • {client.businessSegment}
                                    </div>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
