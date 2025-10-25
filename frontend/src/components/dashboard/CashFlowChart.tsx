import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import type { CashFlowData } from '@/types/analytics';
import { useState } from 'react';

interface CashFlowChartProps {
    data: CashFlowData[];
    isLoading?: boolean;
    className?: string;
}

type ChartType = 'line' | 'area' | 'bar';
type TimeRange = 'all' | '30d' | '90d' | '1y';

export const CashFlowChart = ({ data, isLoading = false, className }: CashFlowChartProps) => {
    const [chartType, setChartType] = useState<ChartType>('area');
    const [timeRange, setTimeRange] = useState<TimeRange>('all');

    // Filter data based on time range
    const filteredData = data.filter(item => {
        if (timeRange === 'all') return true;

        const itemDate = new Date(item.date);
        const now = new Date();
        const daysBack =
            {
                '30d': 30,
                '90d': 90,
                '1y': 365
            }[timeRange] || 0;

        const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        return itemDate >= cutoffDate;
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className='bg-white border border-gray-200 rounded-lg shadow-lg p-3'>
                    <p className='font-medium text-gray-900 mb-2'>
                        {formatDate(label, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </p>
                    {payload.map((entry: any, index: number) => (
                        <div
                            key={index}
                            className='flex items-center justify-between gap-4'
                        >
                            <div className='flex items-center gap-2'>
                                <div
                                    className='w-3 h-3 rounded-full'
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className='text-sm text-gray-600'>{entry.name}:</span>
                            </div>
                            <span className='text-sm font-medium'>{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        const chartProps = {
            data: filteredData,
            margin: { top: 5, right: 30, left: 20, bottom: 5 }
        };

        switch (chartType) {
            case 'line':
                return (
                    <LineChart {...chartProps}>
                        <CartesianGrid
                            strokeDasharray='3 3'
                            className='opacity-30'
                        />
                        <XAxis
                            dataKey='date'
                            tickFormatter={value => formatDate(value, { month: 'short', day: 'numeric' })}
                            className='text-xs'
                        />
                        <YAxis
                            tickFormatter={value => formatCurrency(value, 'USD', 'en-US').replace('.00', '')}
                            className='text-xs'
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                            type='monotone'
                            dataKey='inflow'
                            stroke='#10b981'
                            strokeWidth={2}
                            name='Inflow'
                            dot={{ r: 4 }}
                        />
                        <Line
                            type='monotone'
                            dataKey='outflow'
                            stroke='#ef4444'
                            strokeWidth={2}
                            name='Outflow'
                            dot={{ r: 4 }}
                        />
                        <Line
                            type='monotone'
                            dataKey='balance'
                            stroke='#3b82f6'
                            strokeWidth={2}
                            name='Balance'
                            dot={{ r: 4 }}
                        />
                    </LineChart>
                );

            case 'area':
                return (
                    <AreaChart {...chartProps}>
                        <CartesianGrid
                            strokeDasharray='3 3'
                            className='opacity-30'
                        />
                        <XAxis
                            dataKey='date'
                            tickFormatter={value => formatDate(value, { month: 'short', day: 'numeric' })}
                            className='text-xs'
                        />
                        <YAxis
                            tickFormatter={value => formatCurrency(value, 'USD', 'en-US').replace('.00', '')}
                            className='text-xs'
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                            type='monotone'
                            dataKey='inflow'
                            stackId='1'
                            stroke='#10b981'
                            fill='#10b981'
                            fillOpacity={0.3}
                            name='Inflow'
                        />
                        <Area
                            type='monotone'
                            dataKey='outflow'
                            stackId='2'
                            stroke='#ef4444'
                            fill='#ef4444'
                            fillOpacity={0.3}
                            name='Outflow'
                        />
                    </AreaChart>
                );

            case 'bar':
                return (
                    <BarChart {...chartProps}>
                        <CartesianGrid
                            strokeDasharray='3 3'
                            className='opacity-30'
                        />
                        <XAxis
                            dataKey='date'
                            tickFormatter={value => formatDate(value, { month: 'short', day: 'numeric' })}
                            className='text-xs'
                        />
                        <YAxis
                            tickFormatter={value => formatCurrency(value, 'USD', 'en-US').replace('.00', '')}
                            className='text-xs'
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                            dataKey='inflow'
                            fill='#10b981'
                            name='Inflow'
                        />
                        <Bar
                            dataKey='outflow'
                            fill='#ef4444'
                            name='Outflow'
                        />
                    </BarChart>
                );

            default:
                return (
                    <LineChart {...chartProps}>
                        <CartesianGrid
                            strokeDasharray='3 3'
                            className='opacity-30'
                        />
                        <XAxis
                            dataKey='date'
                            tickFormatter={value => formatDate(value, { month: 'short', day: 'numeric' })}
                            className='text-xs'
                        />
                        <YAxis
                            tickFormatter={value => formatCurrency(value, 'USD', 'en-US').replace('.00', '')}
                            className='text-xs'
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                            type='monotone'
                            dataKey='inflow'
                            stroke='#10b981'
                            strokeWidth={2}
                            name='Inflow'
                            dot={{ r: 4 }}
                        />
                    </LineChart>
                );
        }
    };

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Cash Flow Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='h-80 flex items-center justify-center'>
                        <div className='text-center'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
                            <p className='text-sm text-gray-500'>Loading cash flow data...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-2'>
                        <TrendingUp className='h-5 w-5' />
                        Cash Flow Analysis
                    </CardTitle>
                    <div className='flex items-center gap-2'>
                        {/* Time Range Selector */}
                        <Select
                            value={timeRange}
                            onValueChange={(value: TimeRange) => setTimeRange(value)}
                        >
                            <SelectTrigger className='w-24'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>All</SelectItem>
                                <SelectItem value='30d'>30d</SelectItem>
                                <SelectItem value='90d'>90d</SelectItem>
                                <SelectItem value='1y'>1y</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Chart Type Selector */}
                        <div className='flex items-center border rounded-lg'>
                            <Button
                                variant={chartType === 'area' ? 'default' : 'ghost'}
                                size='sm'
                                onClick={() => setChartType('area')}
                                className='rounded-r-none'
                            >
                                <Activity className='h-4 w-4' />
                            </Button>
                            <Button
                                variant={chartType === 'line' ? 'default' : 'ghost'}
                                size='sm'
                                onClick={() => setChartType('line')}
                                className='rounded-none'
                            >
                                <TrendingUp className='h-4 w-4' />
                            </Button>
                            <Button
                                variant={chartType === 'bar' ? 'default' : 'ghost'}
                                size='sm'
                                onClick={() => setChartType('bar')}
                                className='rounded-l-none'
                            >
                                <BarChart3 className='h-4 w-4' />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className='h-80'>
                    <ResponsiveContainer
                        width='100%'
                        height='100%'
                    >
                        {renderChart()}
                    </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                <div className='mt-4 grid grid-cols-3 gap-4 pt-4 border-t'>
                    <div className='text-center'>
                        <p className='text-sm text-gray-500'>Avg Inflow</p>
                        <p className='font-medium'>
                            {formatCurrency(
                                filteredData.reduce((sum, item) => sum + item.inflow, 0) / filteredData.length
                            )}
                        </p>
                    </div>
                    <div className='text-center'>
                        <p className='text-sm text-gray-500'>Avg Outflow</p>
                        <p className='font-medium'>
                            {formatCurrency(
                                filteredData.reduce((sum, item) => sum + item.outflow, 0) / filteredData.length
                            )}
                        </p>
                    </div>
                    <div className='text-center'>
                        <p className='text-sm text-gray-500'>Net Flow</p>
                        <p
                            className={`font-medium ${
                                filteredData[filteredData.length - 1]?.netFlow > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                            {formatCurrency(filteredData[filteredData.length - 1]?.netFlow || 0)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
