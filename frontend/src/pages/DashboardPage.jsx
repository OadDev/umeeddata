import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import {
  TrendUp,
  TrendDown,
  CurrencyInr,
  ChartLineUp,
  Target,
  Percent,
  Desktop,
  QrCode
} from '@phosphor-icons/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard`);
      setData(data);
    } catch (e) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  const today = data?.today || {};
  const yesterday = data?.yesterday || {};
  const thisMonth = data?.this_month || {};
  const lastMonth = data?.last_month || {};
  const todayVsYesterday = data?.today_vs_yesterday || {};
  const thisMonthVsLast = data?.this_month_vs_last || {};
  const trendData = data?.trend_data || [];
  const campaignStats = data?.campaign_stats || [];

  // Change indicator component
  const ChangeIndicator = ({ change, inverse = false }) => {
    const isPositive = inverse ? change < 0 : change > 0;
    const color = isPositive ? '#6AAF35' : change === 0 ? '#78716C' : '#EF4444';
    const Icon = change >= 0 ? TrendUp : TrendDown;
    return (
      <div className="flex items-center gap-1 text-xs" style={{ color }}>
        <Icon size={14} weight="bold" />
        <span>{Math.abs(change)}%</span>
      </div>
    );
  };

  const pieData = [
    { name: 'Website', value: today.website_collection || 0 },
    { name: 'QR', value: today.qr_collection || 0 }
  ];
  const COLORS = ['#6AAF35', '#F5A623'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">Dashboard</h1>
          <p className="text-[#78716C]">Welcome back, {user?.name}</p>
        </div>
        <div className="text-sm text-[#78716C] bg-white px-4 py-2 rounded-lg border border-stone-200">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Today vs Yesterday Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-[#1C1917] mb-3">Today vs Yesterday</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="card-hover border-stone-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#78716C] uppercase">Profit</span>
                <ChangeIndicator change={todayVsYesterday.profit_change || 0} />
              </div>
              <p className="text-xl font-bold text-[#6AAF35]">{formatCurrency(today.total_profit || 0)}</p>
              <p className="text-xs text-[#78716C]">Yesterday: {formatCurrency(yesterday.total_profit || 0)}</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-stone-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#78716C] uppercase">Revenue</span>
                <ChangeIndicator change={todayVsYesterday.revenue_change || 0} />
              </div>
              <p className="text-xl font-bold text-[#6AAF35]">{formatCurrency(today.total_revenue || 0)}</p>
              <p className="text-xs text-[#78716C]">Yesterday: {formatCurrency(yesterday.total_revenue || 0)}</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-stone-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#78716C] uppercase">Ad Spend</span>
                <ChangeIndicator change={todayVsYesterday.ad_spend_change || 0} inverse />
              </div>
              <p className="text-xl font-bold text-red-500">{formatCurrency(today.total_ad_spend || 0)}</p>
              <p className="text-xs text-[#78716C]">Yesterday: {formatCurrency(yesterday.total_ad_spend || 0)}</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-stone-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#78716C] uppercase">Website Collection</span>
                <ChangeIndicator change={todayVsYesterday.website_change || 0} />
              </div>
              <p className="text-xl font-bold text-[#3B82F6]">{formatCurrency(today.website_collection || 0)}</p>
              <p className="text-xs text-[#78716C]">Yesterday: {formatCurrency(yesterday.website_collection || 0)}</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-stone-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#78716C] uppercase">QR Collection</span>
                <ChangeIndicator change={todayVsYesterday.qr_change || 0} />
              </div>
              <p className="text-xl font-bold text-[#8B5CF6]">{formatCurrency(today.qr_collection || 0)}</p>
              <p className="text-xs text-[#78716C]">Yesterday: {formatCurrency(yesterday.qr_collection || 0)}</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-stone-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#78716C] uppercase">Platform Profit</span>
                <Percent size={16} className="text-[#F5A623]" />
              </div>
              <p className="text-xl font-bold text-[#F5A623]">{formatCurrency(today.platform_profit || 0)}</p>
              <p className="text-xs text-[#78716C]">Yesterday: {formatCurrency(yesterday.platform_profit || 0)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* This Month vs Last Month Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-[#1C1917] mb-3">This Month vs Last Month</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover border-stone-200 bg-gradient-to-br from-[#6AAF35]/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#78716C] uppercase">Profit</span>
                <ChangeIndicator change={thisMonthVsLast.profit_change || 0} />
              </div>
              <p className="text-xl font-bold text-[#6AAF35]">{formatCurrency(thisMonth.total_profit || 0)}</p>
              <p className="text-xs text-[#78716C]">Last Month: {formatCurrency(lastMonth.total_profit || 0)}</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-stone-200 bg-gradient-to-br from-[#6AAF35]/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#78716C] uppercase">Revenue</span>
                <ChangeIndicator change={thisMonthVsLast.revenue_change || 0} />
              </div>
              <p className="text-xl font-bold text-[#6AAF35]">{formatCurrency(thisMonth.total_revenue || 0)}</p>
              <p className="text-xs text-[#78716C]">Last Month: {formatCurrency(lastMonth.total_revenue || 0)}</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-stone-200 bg-gradient-to-br from-red-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#78716C] uppercase">Ad Spend</span>
                <ChangeIndicator change={thisMonthVsLast.ad_spend_change || 0} inverse />
              </div>
              <p className="text-xl font-bold text-red-500">{formatCurrency(thisMonth.total_ad_spend || 0)}</p>
              <p className="text-xs text-[#78716C]">Last Month: {formatCurrency(lastMonth.total_ad_spend || 0)}</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-stone-200 bg-gradient-to-br from-[#F5A623]/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#78716C] uppercase">Platform Profit</span>
                <Percent size={16} className="text-[#F5A623]" />
              </div>
              <p className="text-xl font-bold text-[#F5A623]">{formatCurrency(thisMonth.platform_profit || 0)}</p>
              <p className="text-xs text-[#78716C]">Last Month: {formatCurrency(lastMonth.platform_profit || 0)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Profit Trend */}
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-[#1C1917]">Revenue & Profit Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} stroke="#78716C" />
                  <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} stroke="#78716C" />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN')}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E7E5E4' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#6AAF35" strokeWidth={2} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="profit" stroke="#F5A623" strokeWidth={2} dot={false} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Split Pie */}
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-[#1C1917]">Collection Source (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E7E5E4' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Comparison */}
      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#1C1917]">Campaign Performance (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis type="number" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} stroke="#78716C" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#78716C" width={150} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E7E5E4' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#6AAF35" name="Revenue" radius={[0, 4, 4, 0]} />
                <Bar dataKey="profit" fill="#F5A623" name="Profit" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Cards */}
      <div>
        <h2 className="text-lg font-semibold text-[#1C1917] mb-4">Active Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaignStats.map((campaign) => (
            <Card key={campaign.id} className="card-hover border-stone-200" data-testid={`campaign-card-${campaign.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target size={20} className="text-[#6AAF35]" weight="duotone" />
                    <h3 className="font-semibold text-[#1C1917] truncate">{campaign.name}</h3>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#78716C]">Revenue</span>
                    <span className="font-medium text-[#6AAF35]">{formatCurrency(campaign.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#78716C]">Profit</span>
                    <span className={`font-medium ${campaign.profit >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
                      {formatCurrency(campaign.profit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#78716C]">Platform Profit</span>
                    <span className="font-medium text-[#F5A623]">{formatCurrency(campaign.platform_profit)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
