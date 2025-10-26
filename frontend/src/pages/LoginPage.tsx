import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { authService } from '@/services/auth';
import { isAuthenticated } from '@/lib/api';
import type { LoginRequest } from '@/types/user';

export const LoginPage = () => {
    const [formData, setFormData] = useState<LoginRequest>({
        email: '',
        password: ''
    });
    const navigate = useNavigate();

    const loginMutation = useMutation({
        mutationFn: (credentials: LoginRequest) => authService.login(credentials),
        onSuccess: () => {
            navigate('/dashboard', { replace: true });
        }
    });

    // Redirect if already authenticated
    if (isAuthenticated()) {
        return (
            <Navigate
                to='/dashboard'
                replace
            />
        );
    }

    const handleInputChange = (field: keyof LoginRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.email && formData.password) {
            loginMutation.mutate(formData);
        }
    };

    const isFormValid = formData.email.trim() && formData.password.trim();

    return (
        <div className='min-h-screen flex items-center justify-center bg-background p-4'>
            <Card className='w-full max-w-md'>
                <CardHeader className='space-y-1'>
                    <CardTitle className='text-2xl font-bold text-center'>Treasury Solutions Advisor</CardTitle>
                    <CardDescription className='text-center'>Sign in to access your treasury dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit}
                        className='space-y-4'
                    >
                        <div className='space-y-2'>
                            <Label htmlFor='email'>Email</Label>
                            <Input
                                id='email'
                                type='email'
                                placeholder='Enter your email'
                                value={formData.email}
                                onChange={handleInputChange('email')}
                                disabled={loginMutation.isPending}
                                required
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='password'>Password</Label>
                            <Input
                                id='password'
                                type='password'
                                placeholder='Enter your password'
                                value={formData.password}
                                onChange={handleInputChange('password')}
                                disabled={loginMutation.isPending}
                                required
                            />
                        </div>

                        {loginMutation.isError && (
                            <Alert variant='destructive'>
                                <AlertDescription>
                                    {loginMutation.error?.message ||
                                        'Failed to sign in. Please check your credentials.'}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type='submit'
                            className='w-full'
                            disabled={!isFormValid || loginMutation.isPending}
                        >
                            {loginMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            Sign In
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
