import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { clientsService } from '@/services/clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import type { CreateClientRequest } from '@/types/client';

export const ClientsPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newClient, setNewClient] = useState<CreateClientRequest>({
        name: '',
        businessType: '',
        industry: '',
        relationshipManagerId: user?.id.toString() || '',
        businessSegment: 'small',
        contact: {
            primaryContact: {
                name: '',
                title: '',
                email: '',
                phone: ''
            }
        }
    });

    // Fetch clients based on user role
    const { data: clientsData, isLoading } = useQuery({
        queryKey: ['clients'],
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

    // Search clients
    const { data: searchResults } = useQuery({
        queryKey: ['clients-search', searchQuery],
        queryFn: () => clientsService.searchClients(searchQuery),
        enabled: searchQuery.length > 2
    });

    // Create client mutation
    const createClientMutation = useMutation({
        mutationFn: clientsService.createClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsCreateDialogOpen(false);
            setNewClient({
                name: '',
                businessType: '',
                industry: '',
                relationshipManagerId: user?.id.toString() || '',
                businessSegment: 'small',
                contact: {
                    primaryContact: {
                        name: '',
                        title: '',
                        email: '',
                        phone: ''
                    }
                }
            });
        }
    });

    // Delete client mutation
    const deleteClientMutation = useMutation({
        mutationFn: clientsService.deleteClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
    });

    const clients = searchQuery.length > 2 ? searchResults : clientsData?.clients;

    const handleCreateClient = () => {
        createClientMutation.mutate(newClient);
    };

    const handleDeleteClient = (clientId: string) => {
        if (confirm('Are you sure you want to delete this client?')) {
            deleteClientMutation.mutate(clientId);
        }
    };

    const getSegmentColor = (segment: string) => {
        switch (segment) {
            case 'small':
                return 'bg-blue-100 text-blue-800';
            case 'medium':
                return 'bg-green-100 text-green-800';
            case 'large':
                return 'bg-orange-100 text-orange-800';
            case 'enterprise':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
                    <p className='mt-2 text-muted-foreground'>Loading clients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>Clients</h1>
                    <p className='text-muted-foreground'>Manage your client relationships and accounts</p>
                </div>
                <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className='w-4 h-4 mr-2' />
                            Add Client
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-md'>
                        <DialogHeader>
                            <DialogTitle>Create New Client</DialogTitle>
                        </DialogHeader>
                        <div className='space-y-4'>
                            <div>
                                <Label htmlFor='name'>Company Name</Label>
                                <Input
                                    id='name'
                                    value={newClient.name}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                    placeholder='Enter company name'
                                />
                            </div>
                            <div>
                                <Label htmlFor='businessType'>Business Type</Label>
                                <Input
                                    id='businessType'
                                    value={newClient.businessType}
                                    onChange={e => setNewClient({ ...newClient, businessType: e.target.value })}
                                    placeholder='e.g., LLC, Corporation, Partnership'
                                />
                            </div>
                            <div>
                                <Label htmlFor='industry'>Industry</Label>
                                <Input
                                    id='industry'
                                    value={newClient.industry}
                                    onChange={e => setNewClient({ ...newClient, industry: e.target.value })}
                                    placeholder='e.g., Technology, Healthcare, Manufacturing'
                                />
                            </div>
                            <div>
                                <Label htmlFor='segment'>Business Segment</Label>
                                <Select
                                    value={newClient.businessSegment}
                                    onValueChange={value =>
                                        setNewClient({ ...newClient, businessSegment: value as any })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='small'>Small Business</SelectItem>
                                        <SelectItem value='medium'>Medium Business</SelectItem>
                                        <SelectItem value='large'>Large Business</SelectItem>
                                        <SelectItem value='enterprise'>Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor='contactName'>Primary Contact Name</Label>
                                <Input
                                    id='contactName'
                                    value={newClient.contact.primaryContact.name}
                                    onChange={e =>
                                        setNewClient({
                                            ...newClient,
                                            contact: {
                                                ...newClient.contact,
                                                primaryContact: {
                                                    ...newClient.contact.primaryContact,
                                                    name: e.target.value
                                                }
                                            }
                                        })
                                    }
                                    placeholder='Enter contact name'
                                />
                            </div>
                            <div>
                                <Label htmlFor='contactEmail'>Primary Contact Email</Label>
                                <Input
                                    id='contactEmail'
                                    type='email'
                                    value={newClient.contact.primaryContact.email}
                                    onChange={e =>
                                        setNewClient({
                                            ...newClient,
                                            contact: {
                                                ...newClient.contact,
                                                primaryContact: {
                                                    ...newClient.contact.primaryContact,
                                                    email: e.target.value
                                                }
                                            }
                                        })
                                    }
                                    placeholder='Enter contact email'
                                />
                            </div>
                            <div>
                                <Label htmlFor='contactPhone'>Primary Contact Phone</Label>
                                <Input
                                    id='contactPhone'
                                    value={newClient.contact.primaryContact.phone}
                                    onChange={e =>
                                        setNewClient({
                                            ...newClient,
                                            contact: {
                                                ...newClient.contact,
                                                primaryContact: {
                                                    ...newClient.contact.primaryContact,
                                                    phone: e.target.value
                                                }
                                            }
                                        })
                                    }
                                    placeholder='Enter contact phone'
                                />
                            </div>
                            <div>
                                <Label htmlFor='contactTitle'>Primary Contact Title</Label>
                                <Input
                                    id='contactTitle'
                                    value={newClient.contact.primaryContact.title}
                                    onChange={e =>
                                        setNewClient({
                                            ...newClient,
                                            contact: {
                                                ...newClient.contact,
                                                primaryContact: {
                                                    ...newClient.contact.primaryContact,
                                                    title: e.target.value
                                                }
                                            }
                                        })
                                    }
                                    placeholder='Enter contact title'
                                />
                            </div>
                            <Button
                                onClick={handleCreateClient}
                                disabled={createClientMutation.isPending}
                                className='w-full'
                            >
                                {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                <Input
                    placeholder='Search clients by name, industry, or business type...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='pl-10'
                />
            </div>

            {/* Clients Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {clients?.map(client => (
                    <Card
                        key={client.id}
                        className='hover:shadow-md transition-shadow'
                    >
                        <CardHeader className='pb-3'>
                            <div className='flex items-start justify-between'>
                                <div className='space-y-1'>
                                    <CardTitle className='text-lg'>{client.name}</CardTitle>
                                    <p className='text-sm text-muted-foreground'>{client.industry}</p>
                                </div>
                                <div className='flex gap-1'>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        className='h-8 w-8 p-0'
                                    >
                                        <Edit className='w-4 h-4' />
                                    </Button>
                                    {user?.role === 'ADMIN' && (
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                                            onClick={() => handleDeleteClient(client.id)}
                                        >
                                            <Trash2 className='w-4 h-4' />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                            <div className='space-y-2'>
                                <Badge className={getSegmentColor(client.businessSegment)}>
                                    {client.businessSegment}
                                </Badge>
                                <p className='text-sm'>
                                    <strong>Type:</strong> {client.businessType}
                                </p>
                                <p className='text-sm'>
                                    <strong>Contact:</strong> {client.contact.primaryContact.name}
                                </p>
                                <p className='text-sm'>
                                    <strong>Email:</strong> {client.contact.primaryContact.email}
                                </p>
                                {client.relationshipManager && (
                                    <p className='text-sm'>
                                        <strong>RM:</strong> {client.relationshipManager.name}
                                    </p>
                                )}
                            </div>
                            <div className='flex gap-2 text-xs text-muted-foreground'>
                                <span>Risk: {client.riskProfile}</span>
                                <span>•</span>
                                <span>Accounts: {client.accounts?.length || 0}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {(!clients || clients.length === 0) && (
                <Card className='p-12 text-center'>
                    <h3 className='text-lg font-semibold mb-2'>No clients found</h3>
                    <p className='text-muted-foreground mb-4'>
                        {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first client'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className='w-4 h-4 mr-2' />
                            Add Client
                        </Button>
                    )}
                </Card>
            )}
        </div>
    );
};
