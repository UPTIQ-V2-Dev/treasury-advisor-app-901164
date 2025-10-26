import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { analyticsService } from '@/services/analytics';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { ClientSelector } from '@/components/upload/ClientSelector';
import type { AnalyticsFilters, VendorConcentration } from '@/types/analytics';
import {
    BarChart3,
    TrendingUp,
    Filter,
    Download,
    Calendar as CalendarIcon,
    Building2,
    PieChart,
    Activity,
    AlertTriangle
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const TRANSACTION_CATEGORIES = [
    'Operating Expenses',
    'Payroll',
    'Rent & Utilities',
    'Professional Services',
    'Marketing',
    'Travel',
    'Equipment',
    'Insurance',
    'Taxes',
    'Other'
];

const TRANSACTION_TYPES = ['ach', 'wire', 'check', 'card', 'transfer'];

export const AnalyticsPage = () => {
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [filters, setFilters] = useState<AnalyticsFilters>({
        dateRange: {
            startDate: format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd'),
            endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
        },
        categories: [],
        transactionTypes: [],
        amountRange: undefined
    });

    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
        from: startOfMonth(subMonths(new Date(), 11)),
        to: endOfMonth(new Date())
    });
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [amountMin, setAmountMin] = useState<string>('');
    const [amountMax, setAmountMax] = useState<string>('');

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['analytics-summary', selectedClientId, filters],
        queryFn: () => analyticsService.getAnalyticsSummary(selectedClientId, filters),
        enabled: !!selectedClientId
    });

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['transaction-categories', selectedClientId, filters],
        queryFn: () => analyticsService.getTransactionCategories(selectedClientId, filters),
        enabled: !!selectedClientId
    });

    const { data: patterns = [], isLoading: patternsLoading } = useQuery({
        queryKey: ['spending-patterns', selectedClientId],
        queryFn: () => analyticsService.getSpendingPatterns(selectedClientId),
        enabled: !!selectedClientId
    });

    const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
        queryKey: ['vendor-analysis', selectedClientId],
        queryFn: () => analyticsService.getVendorAnalysis(selectedClientId),
        enabled: !!selectedClientId
    });

    const applyFilters = () => {
        const newFilters: AnalyticsFilters = {
            dateRange: {
                startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : filters.dateRange.startDate,
                endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : filters.dateRange.endDate
            },
            categories: selectedCategories.length > 0 ? selectedCategories : undefined,
            transactionTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
            amountRange:
                amountMin || amountMax
                    ? {
                          min: amountMin ? parseFloat(amountMin) : 0,
                          max: amountMax ? parseFloat(amountMax) : Infinity
                      }
                    : undefined
        };
        setFilters(newFilters);
    };

    const clearFilters = () => {
        setDateRange({
            from: startOfMonth(subMonths(new Date(), 11)),
            to: endOfMonth(new Date())
        });
        setSelectedCategories([]);
        setSelectedTypes([]);
        setAmountMin('');
        setAmountMax('');
        setFilters({
            dateRange: {
                startDate: format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd'),
                endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
            },
            categories: [],
            transactionTypes: [],
            amountRange: undefined
        });
    };

    const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
        if (!selectedClientId) return;
        try {
            const blob = await analyticsService.exportAnalyticsData(selectedClientId, format, filters);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${format}-${Date.now()}.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
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

    const formatPercentage = (value: number) => {
        return `${(value * 100).toFixed(1)}%`;
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'up':
                return 'text-red-500';
            case 'down':
                return 'text-green-500';
            case 'stable':
                return 'text-blue-500';
            default:
                return 'text-gray-500';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up':
                return '↗';
            case 'down':
                return '↘';
            case 'stable':
                return '→';
            default:
                return '→';
        }
    };

    const isLoading = summaryLoading || categoriesLoading || patternsLoading || vendorsLoading;

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>Client Financial Analytics</h1>
                    <p className='text-muted-foreground'>
                        Client-specific detailed analysis with advanced filtering and insights
                    </p>
                </div>
                <div className='flex gap-2'>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleExport('csv')}
                        disabled={!selectedClientId}
                    >
                        <Download className='h-4 w-4 mr-2' />
                        Export CSV
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleExport('excel')}
                        disabled={!selectedClientId}
                    >
                        <Download className='h-4 w-4 mr-2' />
                        Export Excel
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleExport('pdf')}
                        disabled={!selectedClientId}
                    >
                        <Download className='h-4 w-4 mr-2' />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Client Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Client Selection</CardTitle>
                    <CardDescription>Select a client to view their financial analytics</CardDescription>
                </CardHeader>
                <CardContent>
                    <ClientSelector
                        selectedClientId={selectedClientId}
                        onClientSelect={setSelectedClientId}
                    />
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <Filter className='h-5 w-5' />
                            <CardTitle>Advanced Filters</CardTitle>
                        </div>
                        <div className='flex gap-2'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={clearFilters}
                            >
                                Clear All
                            </Button>
                            <Button
                                size='sm'
                                onClick={applyFilters}
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                        {/* Date Range */}
                        <div className='space-y-2'>
                            <Label>Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant='outline'
                                        className='w-full justify-start text-left font-normal'
                                    >
                                        <CalendarIcon className='mr-2 h-4 w-4' />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                                                    {format(dateRange.to, 'LLL dd, y')}
                                                </>
                                            ) : (
                                                format(dateRange.from, 'LLL dd, y')
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className='w-auto p-0'
                                    align='start'
                                >
                                    <Calendar
                                        initialFocus
                                        mode='range'
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange as any}
                                        onSelect={setDateRange as any}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Categories */}
                        <div className='space-y-2'>
                            <Label>Categories</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant='outline'
                                        className='w-full justify-start'
                                    >
                                        {selectedCategories.length > 0
                                            ? `${selectedCategories.length} selected`
                                            : 'Select categories'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className='w-64'
                                    align='start'
                                >
                                    <div className='space-y-2'>
                                        {TRANSACTION_CATEGORIES.map(category => (
                                            <div
                                                key={category}
                                                className='flex items-center space-x-2'
                                            >
                                                <Checkbox
                                                    id={category}
                                                    checked={selectedCategories.includes(category)}
                                                    onCheckedChange={checked => {
                                                        if (checked) {
                                                            setSelectedCategories(prev => [...prev, category]);
                                                        } else {
                                                            setSelectedCategories(prev =>
                                                                prev.filter(c => c !== category)
                                                            );
                                                        }
                                                    }}
                                                />
                                                <Label
                                                    htmlFor={category}
                                                    className='text-sm'
                                                >
                                                    {category}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Transaction Types */}
                        <div className='space-y-2'>
                            <Label>Transaction Types</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant='outline'
                                        className='w-full justify-start'
                                    >
                                        {selectedTypes.length > 0 ? `${selectedTypes.length} selected` : 'Select types'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className='w-48'
                                    align='start'
                                >
                                    <div className='space-y-2'>
                                        {TRANSACTION_TYPES.map(type => (
                                            <div
                                                key={type}
                                                className='flex items-center space-x-2'
                                            >
                                                <Checkbox
                                                    id={type}
                                                    checked={selectedTypes.includes(type)}
                                                    onCheckedChange={checked => {
                                                        if (checked) {
                                                            setSelectedTypes(prev => [...prev, type]);
                                                        } else {
                                                            setSelectedTypes(prev => prev.filter(t => t !== type));
                                                        }
                                                    }}
                                                />
                                                <Label
                                                    htmlFor={type}
                                                    className='text-sm capitalize'
                                                >
                                                    {type}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Amount Range */}
                        <div className='space-y-2'>
                            <Label>Amount Range</Label>
                            <div className='flex gap-2'>
                                <Input
                                    placeholder='Min'
                                    type='number'
                                    value={amountMin}
                                    onChange={e => setAmountMin(e.target.value)}
                                    className='w-20'
                                />
                                <span className='self-center text-muted-foreground'>to</span>
                                <Input
                                    placeholder='Max'
                                    type='number'
                                    value={amountMax}
                                    onChange={e => setAmountMax(e.target.value)}
                                    className='w-20'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Active Filters */}
                    {(selectedCategories.length > 0 || selectedTypes.length > 0 || amountMin || amountMax) && (
                        <div className='mt-4 flex flex-wrap gap-2'>
                            {selectedCategories.map(category => (
                                <Badge
                                    key={category}
                                    variant='secondary'
                                    className='gap-1'
                                >
                                    {category}
                                </Badge>
                            ))}
                            {selectedTypes.map(type => (
                                <Badge
                                    key={type}
                                    variant='secondary'
                                    className='gap-1 capitalize'
                                >
                                    {type}
                                </Badge>
                            ))}
                            {(amountMin || amountMax) && (
                                <Badge variant='secondary'>
                                    Amount: {amountMin || '0'} - {amountMax || '∞'}
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {!selectedClientId ? (
                <Card>
                    <CardContent className='flex items-center justify-center h-64'>
                        <div className='text-center space-y-4'>
                            <div className='text-6xl'>📊</div>
                            <div>
                                <h3 className='text-lg font-semibold'>Select a Client</h3>
                                <p className='text-muted-foreground'>
                                    Choose a client above to view their financial analytics
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : isLoading ? (
                <div className='flex items-center justify-center h-64'>
                    <div className='text-center space-y-4'>
                        <div className='animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto'></div>
                        <p className='text-muted-foreground'>Loading analytics...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Metrics Overview */}
                    {summary && <MetricsCards metrics={summary.metrics} />}

                    {/* Charts and Analysis */}
                    <Tabs
                        defaultValue='overview'
                        className='space-y-4'
                    >
                        <TabsList className='grid w-full grid-cols-5'>
                            <TabsTrigger value='overview'>Overview</TabsTrigger>
                            <TabsTrigger value='cashflow'>Cash Flow</TabsTrigger>
                            <TabsTrigger value='categories'>Categories</TabsTrigger>
                            <TabsTrigger value='patterns'>Patterns</TabsTrigger>
                            <TabsTrigger value='vendors'>Vendors</TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value='overview'
                            className='space-y-4'
                        >
                            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className='flex items-center gap-2'>
                                            <BarChart3 className='h-5 w-5' />
                                            Cash Flow Trends
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>{summary && <CashFlowChart data={summary.cashFlow} />}</CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className='flex items-center gap-2'>
                                            <TrendingUp className='h-5 w-5' />
                                            Liquidity Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {summary?.liquidity && (
                                            <div className='space-y-4'>
                                                <div className='grid grid-cols-2 gap-4 text-sm'>
                                                    <div>
                                                        <span className='text-muted-foreground'>Average Balance</span>
                                                        <div className='font-semibold'>
                                                            {formatCurrency(summary.liquidity.averageBalance)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className='text-muted-foreground'>Liquidity Score</span>
                                                        <div className='font-semibold'>
                                                            {Math.round(summary.liquidity.liquidityScore * 100)}/100
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className='text-muted-foreground'>Idle Days</span>
                                                        <div className='font-semibold'>
                                                            {summary.liquidity.idleDays}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className='text-muted-foreground'>Volatility</span>
                                                        <div className='font-semibold'>
                                                            {formatPercentage(summary.liquidity.volatility)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {summary.liquidity.thresholdExceeded && (
                                                    <div className='flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                                                        <AlertTriangle className='h-4 w-4 text-yellow-600' />
                                                        <div className='text-sm text-yellow-800'>
                                                            Threshold exceeded:{' '}
                                                            {formatCurrency(summary.liquidity.thresholdAmount)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent
                            value='cashflow'
                            className='space-y-4'
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detailed Cash Flow Analysis</CardTitle>
                                    <CardDescription>
                                        Historical cash flow patterns with trends analysis
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>{summary && <CashFlowChart data={summary.cashFlow} />}</CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent
                            value='categories'
                            className='space-y-4'
                        >
                            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className='flex items-center gap-2'>
                                            <PieChart className='h-5 w-5' />
                                            Category Breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className='space-y-3'>
                                            {categories.slice(0, 8).map(category => (
                                                <div
                                                    key={category.category}
                                                    className='flex items-center justify-between'
                                                >
                                                    <div className='flex items-center gap-3'>
                                                        <div className='text-sm font-medium'>{category.category}</div>
                                                        <Badge
                                                            variant='outline'
                                                            className={getTrendColor(category.trend)}
                                                        >
                                                            {getTrendIcon(category.trend)} {category.trend}
                                                        </Badge>
                                                    </div>
                                                    <div className='text-right'>
                                                        <div className='font-semibold'>
                                                            {formatCurrency(category.amount)}
                                                        </div>
                                                        <div className='text-xs text-muted-foreground'>
                                                            {category.count} transactions (
                                                            {formatPercentage(category.percentage / 100)})
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Category Insights</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className='space-y-4'>
                                            {categories.length > 0 && (
                                                <>
                                                    <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                                                        <div className='text-sm font-medium text-blue-900'>
                                                            Largest Category
                                                        </div>
                                                        <div className='text-blue-800'>
                                                            {categories[0].category} -{' '}
                                                            {formatCurrency(categories[0].amount)}
                                                        </div>
                                                    </div>
                                                    <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                                                        <div className='text-sm font-medium text-green-900'>
                                                            Most Frequent
                                                        </div>
                                                        <div className='text-green-800'>
                                                            {categories.sort((a, b) => b.count - a.count)[0]?.category}{' '}
                                                            - {categories.sort((a, b) => b.count - a.count)[0]?.count}{' '}
                                                            transactions
                                                        </div>
                                                    </div>
                                                    <div className='p-3 bg-purple-50 border border-purple-200 rounded-lg'>
                                                        <div className='text-sm font-medium text-purple-900'>
                                                            Trending Up
                                                        </div>
                                                        <div className='text-purple-800'>
                                                            {categories.filter(c => c.trend === 'up').length} categories
                                                            showing increase
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent
                            value='patterns'
                            className='space-y-4'
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className='flex items-center gap-2'>
                                        <Activity className='h-5 w-5' />
                                        Spending Patterns
                                    </CardTitle>
                                    <CardDescription>Recurring patterns and seasonality analysis</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className='space-y-4'>
                                        {patterns.map((pattern, index) => (
                                            <div
                                                key={index}
                                                className='border rounded-lg p-4'
                                            >
                                                <div className='flex items-center justify-between mb-2'>
                                                    <div className='font-medium'>{pattern.category}</div>
                                                    <Badge
                                                        variant='outline'
                                                        className='capitalize'
                                                    >
                                                        {pattern.frequency}
                                                    </Badge>
                                                </div>
                                                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                                                    <div>
                                                        <span className='text-muted-foreground'>Average Amount</span>
                                                        <div className='font-semibold'>
                                                            {formatCurrency(pattern.averageAmount)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className='text-muted-foreground'>Frequency</span>
                                                        <div className='font-semibold capitalize'>
                                                            {pattern.frequency}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className='text-muted-foreground'>Seasonality</span>
                                                        <div className='font-semibold capitalize'>
                                                            {pattern.seasonality || 'None'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className='text-muted-foreground'>Vendors</span>
                                                        <div className='font-semibold'>{pattern.vendors.length}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent
                            value='vendors'
                            className='space-y-4'
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className='flex items-center gap-2'>
                                        <Building2 className='h-5 w-5' />
                                        Vendor Concentration Analysis
                                    </CardTitle>
                                    <CardDescription>Top vendors and payment concentration risk</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className='space-y-4'>
                                        {vendors.slice(0, 10).map((vendor: VendorConcentration, index: number) => (
                                            <div
                                                key={index}
                                                className='flex items-center justify-between'
                                            >
                                                <div className='flex items-center gap-3 flex-1'>
                                                    <div className='font-medium'>{vendor.vendorName}</div>
                                                    <div className='flex gap-1'>
                                                        {vendor.paymentMethods.map(method => (
                                                            <Badge
                                                                key={method}
                                                                variant='outline'
                                                                className='text-xs capitalize'
                                                            >
                                                                {method}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className='text-right'>
                                                    <div className='font-semibold'>
                                                        {formatCurrency(vendor.totalAmount)}
                                                    </div>
                                                    <div className='text-xs text-muted-foreground'>
                                                        {vendor.transactionCount} transactions (
                                                        {formatPercentage(vendor.percentage / 100)})
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
};
