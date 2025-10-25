import { useQuery } from '@tanstack/react-query';
import { BarChart3, FileText, TrendingUp, Users, Calendar, Settings } from 'lucide-react';
import { analyticsService } from '@/services/analytics';
import { clientsService } from '@/services/clients';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatBusinessSegment } from '@/lib/formatters';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
    const navigate = useNavigate();

    // Mock client ID - in real app this would come from auth context or routing
    const clientId = 'client-001';

    // Fetch dashboard data
    const {
        data: analyticsData,
        isLoading: analyticsLoading,
        error: analyticsError
    } = useQuery({
        queryKey: ['analytics', 'summary', clientId],
        queryFn: () => analyticsService.getAnalyticsSummary(clientId)
    });

    const { data: clientData, isLoading: clientLoading } = useQuery({
        queryKey: ['client', clientId],
        queryFn: () => clientsService.getClientById(clientId)
    });

    const isLoading = analyticsLoading || clientLoading;

    if (analyticsError) {
        return (
            <div className='container mx-auto px-4 py-8'>
                <Alert variant='destructive'>
                    <AlertDescription>Failed to load dashboard data. Please try refreshing the page.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className='container mx-auto px-4 py-8 space-y-8'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900'>Treasury Dashboard</h1>
                    {clientData && (
                        <p className='text-lg text-gray-600 mt-1'>
                            {clientData.name} • {formatBusinessSegment(clientData.businessSegment)}
                        </p>
                    )}
                </div>
                <div className='flex gap-2'>
                    <Button
                        variant='outline'
                        onClick={() => navigate('/upload')}
                    >
                        <FileText className='h-4 w-4 mr-2' />
                        Upload Statements
                    </Button>
                    <Button onClick={() => navigate('/recommendations')}>
                        <TrendingUp className='h-4 w-4 mr-2' />
                        View Recommendations
                    </Button>
                </div>
            </div>

            {/* Client Info Card */}
            {clientData && (
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <Users className='h-5 w-5' />
                            Client Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                            <div>
                                <p className='text-sm text-gray-500'>Business Type</p>
                                <p className='font-medium'>{clientData.businessType}</p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-500'>Industry</p>
                                <p className='font-medium'>{clientData.industry}</p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-500'>Relationship Manager</p>
                                <p className='font-medium'>{clientData.relationshipManager.name}</p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-500'>Account Since</p>
                                <p className='font-medium'>
                                    {formatDate(clientData.createdAt, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Key Metrics */}
            <div>
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-xl font-semibold text-gray-900'>Key Metrics</h2>
                    {analyticsData?.metrics.period && (
                        <div className='flex items-center gap-2 text-sm text-gray-500'>
                            <Calendar className='h-4 w-4' />
                            {formatDate(analyticsData.metrics.period.startDate)} -{' '}
                            {formatDate(analyticsData.metrics.period.endDate)}
                        </div>
                    )}
                </div>
                <MetricsCards
                    metrics={analyticsData?.metrics || ({} as any)}
                    isLoading={isLoading}
                />
            </div>

            {/* Cash Flow Analysis */}
            <div>
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>Cash Flow Analysis</h2>
                <CashFlowChart
                    data={analyticsData?.cashFlow || []}
                    isLoading={isLoading}
                />
            </div>

            {/* Transaction Categories and Patterns */}
            <div className='grid gap-6 lg:grid-cols-2'>
                {/* Top Categories */}
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <BarChart3 className='h-5 w-5' />
                            Top Transaction Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className='space-y-3'>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className='flex items-center justify-between'
                                    >
                                        <div className='h-4 w-32 bg-gray-200 rounded animate-pulse' />
                                        <div className='h-4 w-20 bg-gray-200 rounded animate-pulse' />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                {analyticsData?.categories.slice(0, 5).map((category, index) => (
                                    <div
                                        key={index}
                                        className='flex items-center justify-between'
                                    >
                                        <div className='flex-1'>
                                            <div className='flex items-center justify-between mb-1'>
                                                <span className='text-sm font-medium text-gray-900'>
                                                    {category.category}
                                                </span>
                                                <span className='text-sm text-gray-500'>
                                                    {formatCurrency(category.amount)}
                                                </span>
                                            </div>
                                            <div className='w-full bg-gray-200 rounded-full h-2'>
                                                <div
                                                    className='bg-blue-600 h-2 rounded-full'
                                                    style={{ width: `${category.percentage}%` }}
                                                />
                                            </div>
                                            <div className='flex items-center justify-between mt-1'>
                                                <span className='text-xs text-gray-500'>
                                                    {category.count} transactions
                                                </span>
                                                <span className='text-xs text-gray-500'>
                                                    {category.percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Liquidity Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <TrendingUp className='h-5 w-5' />
                            Liquidity Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className='space-y-4'>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className='flex items-center justify-between'
                                    >
                                        <div className='h-4 w-32 bg-gray-200 rounded animate-pulse' />
                                        <div className='h-4 w-20 bg-gray-200 rounded animate-pulse' />
                                    </div>
                                ))}
                            </div>
                        ) : analyticsData?.liquidity ? (
                            <div className='space-y-4'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm text-gray-600'>Average Balance</span>
                                    <span className='font-medium'>
                                        {formatCurrency(analyticsData.liquidity.averageBalance)}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm text-gray-600'>Minimum Balance</span>
                                    <span className='font-medium'>
                                        {formatCurrency(analyticsData.liquidity.minimumBalance)}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm text-gray-600'>Maximum Balance</span>
                                    <span className='font-medium'>
                                        {formatCurrency(analyticsData.liquidity.maximumBalance)}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm text-gray-600'>Liquidity Score</span>
                                    <span
                                        className={`font-medium ${
                                            analyticsData.liquidity.liquidityScore >= 80
                                                ? 'text-green-600'
                                                : analyticsData.liquidity.liquidityScore >= 60
                                                  ? 'text-yellow-600'
                                                  : 'text-red-600'
                                        }`}
                                    >
                                        {analyticsData.liquidity.liquidityScore}/100
                                    </span>
                                </div>
                                {analyticsData.liquidity.thresholdExceeded && (
                                    <Alert>
                                        <AlertDescription className='text-sm'>
                                            <strong>Optimization Opportunity:</strong> Your idle balance exceeds the
                                            recommended threshold. Consider treasury products to maximize yield.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        ) : (
                            <p className='text-sm text-gray-500'>No liquidity data available</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='grid gap-3 md:grid-cols-3'>
                        <Button
                            variant='outline'
                            className='justify-start'
                            onClick={() => navigate('/upload')}
                        >
                            <FileText className='h-4 w-4 mr-2' />
                            Upload New Statements
                        </Button>
                        <Button
                            variant='outline'
                            className='justify-start'
                            onClick={() => navigate('/recommendations')}
                        >
                            <TrendingUp className='h-4 w-4 mr-2' />
                            Generate Recommendations
                        </Button>
                        <Button
                            variant='outline'
                            className='justify-start'
                            onClick={() => navigate('/settings')}
                        >
                            <Settings className='h-4 w-4 mr-2' />
                            Configure Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
