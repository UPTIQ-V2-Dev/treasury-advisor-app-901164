import { TrendingUp, TrendingDown, DollarSign, Activity, Percent, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage, formatCompactNumber } from '@/lib/formatters';
import type { DashboardMetrics } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface MetricsCardsProps {
    metrics: DashboardMetrics;
    isLoading?: boolean;
    className?: string;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    alert?: boolean;
    format?: 'currency' | 'number' | 'percentage' | 'compact';
}

const MetricCard = ({
    title,
    value,
    change,
    changeLabel,
    icon,
    trend,
    alert,
    format = 'currency'
}: MetricCardProps) => {
    const formatValue = (val: string | number) => {
        const numValue = typeof val === 'string' ? parseFloat(val) : val;

        switch (format) {
            case 'currency':
                return formatCurrency(numValue);
            case 'percentage':
                return formatPercentage(numValue);
            case 'compact':
                return formatCompactNumber(numValue);
            case 'number':
                return numValue.toLocaleString();
            default:
                return val;
        }
    };

    const getTrendIcon = () => {
        if (trend === 'up') return <TrendingUp className='h-3 w-3' />;
        if (trend === 'down') return <TrendingDown className='h-3 w-3' />;
        return null;
    };

    const getTrendColor = () => {
        if (trend === 'up') return 'text-green-600';
        if (trend === 'down') return 'text-red-600';
        return 'text-gray-600';
    };

    return (
        <Card className={cn(alert && 'border-orange-200 bg-orange-50/50')}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>{title}</CardTitle>
                <div className={cn('p-2 rounded-full', alert ? 'bg-orange-100' : 'bg-blue-100')}>
                    {alert ? <AlertTriangle className='h-4 w-4 text-orange-600' /> : icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className='text-2xl font-bold text-gray-900'>{formatValue(value)}</div>
                {(change !== undefined || changeLabel) && (
                    <div className={cn('flex items-center text-xs mt-1', getTrendColor())}>
                        {getTrendIcon()}
                        <span className='ml-1'>
                            {change !== undefined && `${change > 0 ? '+' : ''}${change}%`}
                            {changeLabel && ` ${changeLabel}`}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export const MetricsCards = ({ metrics, isLoading = false, className }: MetricsCardsProps) => {
    if (isLoading) {
        return (
            <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className='pb-2'>
                            <div className='flex items-center justify-between'>
                                <div className='h-4 w-24 bg-gray-200 rounded animate-pulse' />
                                <div className='h-8 w-8 bg-gray-200 rounded-full animate-pulse' />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className='h-8 w-32 bg-gray-200 rounded animate-pulse' />
                            <div className='h-3 w-20 bg-gray-200 rounded animate-pulse mt-2' />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const cards: MetricCardProps[] = [
        {
            title: 'Total Inflow',
            value: metrics.totalInflow,
            icon: <TrendingUp className='h-4 w-4 text-blue-600' />,
            trend: metrics.totalInflow > 0 ? 'up' : 'neutral',
            changeLabel: 'this period',
            format: 'currency'
        },
        {
            title: 'Total Outflow',
            value: metrics.totalOutflow,
            icon: <TrendingDown className='h-4 w-4 text-blue-600' />,
            trend: 'down',
            changeLabel: 'this period',
            format: 'currency'
        },
        {
            title: 'Net Cash Flow',
            value: metrics.netCashFlow,
            icon: <DollarSign className='h-4 w-4 text-blue-600' />,
            trend: metrics.netCashFlow > 0 ? 'up' : 'down',
            format: 'currency'
        },
        {
            title: 'Average Daily Balance',
            value: metrics.averageDailyBalance,
            icon: <Activity className='h-4 w-4 text-blue-600' />,
            trend: 'neutral',
            format: 'currency'
        },
        {
            title: 'Liquidity Ratio',
            value: metrics.liquidityRatio,
            icon: <Percent className='h-4 w-4 text-blue-600' />,
            trend: metrics.liquidityRatio > 1.5 ? 'up' : metrics.liquidityRatio < 1.0 ? 'down' : 'neutral',
            format: 'number'
        },
        {
            title: 'Idle Balance',
            value: metrics.idleBalance,
            icon: <AlertTriangle className='h-4 w-4 text-orange-600' />,
            trend: 'neutral',
            alert: metrics.idleBalance > 250000,
            changeLabel: 'earning minimal interest',
            format: 'currency'
        }
    ];

    return (
        <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
            {cards.map((card, index) => (
                <MetricCard
                    key={index}
                    {...card}
                />
            ))}
        </div>
    );
};
