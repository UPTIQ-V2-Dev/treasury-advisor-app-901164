import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { recommendationsService } from '@/services/recommendations';
import { Recommendation } from '@/types/recommendations';
import { TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle2, Eye, FileText } from 'lucide-react';

const MOCK_CLIENT_ID = 'client-1';

export const RecommendationsPage = () => {
    const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

    const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery({
        queryKey: ['recommendations', MOCK_CLIENT_ID],
        queryFn: () => recommendationsService.getRecommendations(MOCK_CLIENT_ID)
    });

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['recommendation-summary', MOCK_CLIENT_ID],
        queryFn: () => recommendationsService.getRecommendationSummary(MOCK_CLIENT_ID)
    });

    const filteredRecommendations = {
        all: recommendations,
        high: recommendations.filter(r => r.priority === 'high'),
        pending: recommendations.filter(r => r.status === 'pending'),
        approved: recommendations.filter(r => r.status === 'approved')
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-500';
            case 'medium':
                return 'bg-yellow-500';
            case 'low':
                return 'bg-green-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-blue-500';
            case 'approved':
                return 'bg-green-500';
            case 'rejected':
                return 'bg-red-500';
            case 'implemented':
                return 'bg-purple-500';
            default:
                return 'bg-gray-500';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (recommendationsLoading || summaryLoading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <div className='text-center space-y-4'>
                    <div className='animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto'></div>
                    <p className='text-muted-foreground'>Loading recommendations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>Treasury Recommendations</h1>
                    <p className='text-muted-foreground'>
                        AI-generated product suggestions based on your financial analysis
                    </p>
                </div>
                <div className='flex gap-2'>
                    <Button
                        variant='outline'
                        size='sm'
                    >
                        <FileText className='h-4 w-4 mr-2' />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>Total Recommendations</CardTitle>
                            <TrendingUp className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>{summary.totalRecommendations}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>High Priority</CardTitle>
                            <AlertCircle className='h-4 w-4 text-red-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold text-red-600'>{summary.highPriorityCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>Potential Savings</CardTitle>
                            <DollarSign className='h-4 w-4 text-green-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold text-green-600'>
                                {formatCurrency(summary.totalEstimatedSavings)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>Approved</CardTitle>
                            <CheckCircle2 className='h-4 w-4 text-green-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>{summary.statusCounts.approved || 0}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Recommendations List */}
            <Tabs
                defaultValue='all'
                className='space-y-4'
            >
                <TabsList>
                    <TabsTrigger value='all'>All ({filteredRecommendations.all.length})</TabsTrigger>
                    <TabsTrigger value='high'>High Priority ({filteredRecommendations.high.length})</TabsTrigger>
                    <TabsTrigger value='pending'>Pending ({filteredRecommendations.pending.length})</TabsTrigger>
                    <TabsTrigger value='approved'>Approved ({filteredRecommendations.approved.length})</TabsTrigger>
                </TabsList>

                {(['all', 'high', 'pending', 'approved'] as const).map(tab => (
                    <TabsContent
                        key={tab}
                        value={tab}
                        className='space-y-4'
                    >
                        {filteredRecommendations[tab].length === 0 ? (
                            <Card>
                                <CardContent className='flex items-center justify-center py-8'>
                                    <div className='text-center space-y-2'>
                                        <TrendingUp className='h-8 w-8 text-muted-foreground mx-auto' />
                                        <p className='text-muted-foreground'>No recommendations found</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredRecommendations[tab].map(recommendation => (
                                <Card
                                    key={recommendation.id}
                                    className='relative'
                                >
                                    <CardHeader>
                                        <div className='flex items-start justify-between'>
                                            <div className='space-y-2'>
                                                <div className='flex items-center gap-2'>
                                                    <CardTitle className='text-lg'>
                                                        {recommendation.product.name}
                                                    </CardTitle>
                                                    <Badge
                                                        variant='secondary'
                                                        className={`text-white ${getPriorityColor(recommendation.priority)}`}
                                                    >
                                                        {recommendation.priority}
                                                    </Badge>
                                                    <Badge
                                                        variant='outline'
                                                        className={`text-white ${getStatusColor(recommendation.status)}`}
                                                    >
                                                        {recommendation.status}
                                                    </Badge>
                                                </div>
                                                <CardDescription>{recommendation.product.description}</CardDescription>
                                                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                                                    <span className='flex items-center gap-1'>
                                                        <TrendingUp className='h-4 w-4' />
                                                        Confidence: {Math.round(recommendation.confidence * 100)}%
                                                    </span>
                                                    {recommendation.estimatedBenefit.annualSavings && (
                                                        <span className='flex items-center gap-1 text-green-600'>
                                                            <DollarSign className='h-4 w-4' />
                                                            {formatCurrency(
                                                                recommendation.estimatedBenefit.annualSavings
                                                            )}{' '}
                                                            annual savings
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={() => setSelectedRecommendation(recommendation)}
                                            >
                                                <Eye className='h-4 w-4 mr-2' />
                                                View Details
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className='space-y-4'>
                                            {/* Primary Rationale */}
                                            <div>
                                                <h4 className='font-medium text-sm mb-2'>Key Rationale</h4>
                                                <p className='text-sm text-muted-foreground'>
                                                    {recommendation.rationale.primaryTrigger}
                                                </p>
                                            </div>

                                            {/* Supporting Factors */}
                                            {recommendation.rationale.supportingFactors.length > 0 && (
                                                <div>
                                                    <h4 className='font-medium text-sm mb-2'>Supporting Factors</h4>
                                                    <ul className='text-sm text-muted-foreground space-y-1'>
                                                        {recommendation.rationale.supportingFactors
                                                            .slice(0, 2)
                                                            .map((factor, index) => (
                                                                <li
                                                                    key={index}
                                                                    className='flex items-start gap-2'
                                                                >
                                                                    <span className='text-primary mt-1'>•</span>
                                                                    {factor}
                                                                </li>
                                                            ))}
                                                        {recommendation.rationale.supportingFactors.length > 2 && (
                                                            <li className='text-xs text-muted-foreground italic'>
                                                                +{recommendation.rationale.supportingFactors.length - 2}{' '}
                                                                more factors
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Implementation Timeline */}
                                            <div>
                                                <h4 className='font-medium text-sm mb-2'>Implementation</h4>
                                                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                                    <Clock className='h-4 w-4' />
                                                    <span>{recommendation.implementation.timeframe}</span>
                                                    <span>•</span>
                                                    <span className='capitalize'>
                                                        {recommendation.implementation.complexity} complexity
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Detailed View Modal (placeholder for now) */}
            {selectedRecommendation && (
                <Alert>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>
                        Detailed view for "{selectedRecommendation.product.name}" would open here. This will show
                        comprehensive rationale, implementation steps, and supporting data.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};
