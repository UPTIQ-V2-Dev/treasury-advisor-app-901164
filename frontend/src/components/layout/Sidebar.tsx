import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, BarChart3, TrendingUp, FileText, Settings, Users, X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
    description?: string;
    disabled?: boolean;
    roles?: string[]; // Restrict to specific roles
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className='h-4 w-4' />,
        description: 'Overview and key metrics'
    },
    {
        title: 'Upload',
        href: '/upload',
        icon: <Upload className='h-4 w-4' />,
        description: 'Upload bank statements'
    },
    {
        title: 'Processing',
        href: '/processing',
        icon: <Activity className='h-4 w-4' />,
        description: 'Real-time analysis status'
    },
    {
        title: 'Analytics',
        href: '/analytics',
        icon: <BarChart3 className='h-4 w-4' />,
        description: 'Detailed financial analysis'
    },
    {
        title: 'Recommendations',
        href: '/recommendations',
        icon: <TrendingUp className='h-4 w-4' />,
        badge: '3',
        description: 'Treasury product suggestions'
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: <FileText className='h-4 w-4' />,
        description: 'Generate and export reports',
        disabled: true
    },
    {
        title: 'Clients',
        href: '/clients',
        icon: <Users className='h-4 w-4' />,
        description: 'Manage client accounts',
        roles: ['ADMIN', 'RELATIONSHIP_MANAGER']
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: <Settings className='h-4 w-4' />,
        description: 'Configuration and preferences',
        disabled: true,
        roles: ['ADMIN']
    }
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const location = useLocation();
    const { user } = useAuth();

    const visibleNavItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role || ''));

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className='fixed inset-0 z-40 bg-black/20 md:hidden'
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:relative md:top-0 md:h-[calc(100vh-4rem)] md:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className='flex h-full flex-col'>
                    {/* Mobile close button */}
                    <div className='flex items-center justify-between p-4 md:hidden'>
                        <h2 className='text-lg font-semibold'>Navigation</h2>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={onClose}
                        >
                            <X className='h-4 w-4' />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className='flex-1 space-y-1 p-4'>
                        {visibleNavItems.map(item => (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={onClose}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    location.pathname === item.href
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    item.disabled && 'opacity-50 cursor-not-allowed'
                                )}
                                {...(item.disabled && { onClick: e => e.preventDefault() })}
                            >
                                <span className='flex-shrink-0'>{item.icon}</span>
                                <span className='flex-1'>{item.title}</span>
                                {item.badge && (
                                    <Badge
                                        variant='secondary'
                                        className='h-5 text-xs'
                                    >
                                        {item.badge}
                                    </Badge>
                                )}
                                {item.disabled && (
                                    <Badge
                                        variant='outline'
                                        className='h-5 text-xs'
                                    >
                                        Soon
                                    </Badge>
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className='border-t p-4'>
                        <div className='text-xs text-muted-foreground'>
                            <p className='font-medium'>Treasury Solutions v1.0</p>
                            <p>Built for relationship managers</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};
