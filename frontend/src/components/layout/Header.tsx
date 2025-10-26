import { Menu, Bell, Search, User, LogOut } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { formatInitials } from '@/lib/formatters';
import { authService } from '@/services/auth';
import { getStoredUser } from '@/lib/api';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
    const navigate = useNavigate();
    const user = getStoredUser();

    const logoutMutation = useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            navigate('/login', { replace: true });
        },
        onError: error => {
            console.error('Logout error:', error);
            // Even if logout API fails, clear local data and redirect
            navigate('/login', { replace: true });
        }
    });

    return (
        <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='flex h-16 items-center justify-between px-4'>
                {/* Left Section */}
                <div className='flex items-center gap-4'>
                    {/* Mobile Menu Button */}
                    <Button
                        variant='ghost'
                        size='sm'
                        className='md:hidden'
                        onClick={onMenuClick}
                    >
                        <Menu className='h-5 w-5' />
                    </Button>

                    {/* Logo/Title */}
                    <div className='flex items-center gap-2'>
                        <div className='h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center'>
                            <span className='text-white font-bold text-sm'>TS</span>
                        </div>
                        <div className='hidden sm:block'>
                            <h1 className='font-semibold text-lg'>Treasury Solutions</h1>
                            <p className='text-xs text-gray-500'>Advisory Platform</p>
                        </div>
                    </div>
                </div>

                {/* Center Section - Search */}
                <div className='flex-1 max-w-md mx-4 hidden md:block'>
                    <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <Input
                            type='search'
                            placeholder='Search clients, statements, recommendations...'
                            className='pl-10 w-full'
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className='flex items-center gap-2'>
                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant='ghost'
                                size='sm'
                                className='relative'
                            >
                                <Bell className='h-5 w-5' />
                                <Badge
                                    variant='destructive'
                                    className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs'
                                >
                                    3
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align='end'
                            className='w-80'
                        >
                            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium'>New recommendations available</p>
                                    <p className='text-xs text-gray-500'>
                                        TechStart Solutions Inc. - 3 new treasury product suggestions
                                    </p>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium'>Statement processing complete</p>
                                    <p className='text-xs text-gray-500'>
                                        Green Manufacturing Corp - November statements analyzed
                                    </p>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium'>High idle balance detected</p>
                                    <p className='text-xs text-gray-500'>
                                        TechStart Solutions Inc. - $280K idle for 45+ days
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant='ghost'
                                size='sm'
                                className='flex items-center gap-2'
                            >
                                <Avatar className='h-8 w-8'>
                                    <AvatarImage src={undefined} />
                                    <AvatarFallback className='bg-blue-100 text-blue-600'>
                                        {formatInitials(user?.name || 'User')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='hidden sm:block text-left'>
                                    <p className='text-sm font-medium'>{user?.name || 'User'}</p>
                                    <p className='text-xs text-gray-500'>{user?.role || 'User'}</p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>
                                <div className='space-y-1'>
                                    <p className='font-medium'>{user?.name || 'User'}</p>
                                    <p className='text-xs text-gray-500'>{user?.email || 'user@example.com'}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className='h-4 w-4 mr-2' />
                                Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem>Preferences</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className='text-red-600'
                                onClick={() => logoutMutation.mutate()}
                                disabled={logoutMutation.isPending}
                            >
                                <LogOut className='h-4 w-4 mr-2' />
                                {logoutMutation.isPending ? 'Signing Out...' : 'Sign Out'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};
