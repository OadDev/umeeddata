import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ArrowLeft, Target, Percent, Users, CalendarBlank, TrendUp, TrendDown } from '@phosphor-icons/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const CampaignDetailPage = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [campaignRes, entriesRes] = await Promise.all([
        axios.get(`${API}/campaigns/${id}`),
        axios.get(`${API}/daily-entries?campaign_id=${id}`)
      ]);
      setCampaign(campaignRes.data);
      setEntries(entriesRes.data);
    } catch (e) {
      console.error(e);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-[#78716C]">Campaign not found</p>
        <Link to="/campaigns">
          <Button variant="outline" className="mt-4">Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  // Calculate totals
  const totals = entries.reduce((acc, e) => ({
    ad_spend: acc.ad_spend + e.ad_spend,
    website_collection: acc.website_collection + e.website_collection,
    qr_collection: acc.qr_collection + e.qr_collection,
    total_revenue: acc.total_revenue + e.total_revenue,
    net_profit: acc.net_profit + e.net_profit,
    platform_commission: acc.platform_commission + e.platform_commission
  }), { ad_spend: 0, website_collection: 0, qr_collection: 0, total_revenue: 0, net_profit: 0, platform_commission: 0 });

  // Chart data (last 30 entries)
  const chartData = [...entries].reverse().slice(-30);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">{campaign.name}</h1>
            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}
              className={campaign.status === 'active' ? 'bg-[#6AAF35]' : ''}>
              {campaign.status}
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-[#78716C] mt-1">{campaign.description}</p>
          )}
        </div>
      </div>

      {/* Campaign Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
                <Percent size={20} className="text-[#F5A623]" />
              </div>
              <div>
                <p className="text-xs text-[#78716C]">Commission</p>
                <p className="text-xl font-bold text-[#F5A623]">{campaign.commission_percentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#6AAF35]/10 flex items-center justify-center">
                <TrendUp size={20} className="text-[#6AAF35]" />
              </div>
              <div>
                <p className="text-xs text-[#78716C]">Total Revenue</p>
                <p className="text-xl font-bold text-[#6AAF35]">{formatCurrency(totals.total_revenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${totals.net_profit >= 0 ? 'bg-[#6AAF35]/10' : 'bg-red-100'} flex items-center justify-center`}>
                {totals.net_profit >= 0 ? <TrendUp size={20} className="text-[#6AAF35]" /> : <TrendDown size={20} className="text-red-500" />}
              </div>
              <div>
                <p className="text-xs text-[#78716C]">Net Profit</p>
                <p className={`text-xl font-bold ${totals.net_profit >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
                  {formatCurrency(totals.net_profit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
                <Percent size={20} className="text-[#F5A623]" />
              </div>
              <div>
                <p className="text-xs text-[#78716C]">Platform Commission</p>
                <p className="text-xl font-bold text-[#F5A623]">{formatCurrency(totals.platform_commission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Distribution */}
      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
            <Users size={20} />
            Commission Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-stone-50 rounded-lg">
              <p className="text-xs text-[#78716C]">Company Share</p>
              <p className="text-lg font-bold text-[#1C1917]">{campaign.company_share}%</p>
              <p className="text-sm text-[#6AAF35]">{formatCurrency(totals.platform_commission * campaign.company_share / campaign.commission_percentage)}</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg">
              <p className="text-xs text-[#78716C]">Dev Share</p>
              <p className="text-lg font-bold text-[#1C1917]">{campaign.dev_share}%</p>
              <p className="text-sm text-[#6AAF35]">{formatCurrency(totals.platform_commission * campaign.dev_share / campaign.commission_percentage)}</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg">
              <p className="text-xs text-[#78716C]">Himanshu Share</p>
              <p className="text-lg font-bold text-[#1C1917]">{campaign.himanshu_share}%</p>
              <p className="text-sm text-[#6AAF35]">{formatCurrency(totals.platform_commission * campaign.himanshu_share / campaign.commission_percentage)}</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg">
              <p className="text-xs text-[#78716C]">Denim Share</p>
              <p className="text-lg font-bold text-[#1C1917]">{campaign.denim_share}%</p>
              <p className="text-sm text-[#6AAF35]">{formatCurrency(totals.platform_commission * campaign.denim_share / campaign.commission_percentage)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#1C1917]">Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716C" />
                <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} stroke="#78716C" />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E7E5E4' }}
                />
                <Legend />
                <Line type="monotone" dataKey="total_revenue" stroke="#6AAF35" strokeWidth={2} dot={false} name="Revenue" />
                <Line type="monotone" dataKey="net_profit" stroke="#F5A623" strokeWidth={2} dot={false} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#1C1917]">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Ad Spend</TableHead>
                  <TableHead className="text-right">Website</TableHead>
                  <TableHead className="text-right">QR</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.slice(0, 10).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.ad_spend)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.website_collection)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.qr_collection)}</TableCell>
                    <TableCell className="text-right text-[#6AAF35]">{formatCurrency(entry.total_revenue)}</TableCell>
                    <TableCell className={`text-right ${entry.net_profit >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
                      {formatCurrency(entry.net_profit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignDetailPage;
