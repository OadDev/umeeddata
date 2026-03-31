import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Label } from '../components/ui/label';
import { Coins, TrendUp, Users } from '@phosphor-icons/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#6AAF35', '#F5A623', '#3B82F6', '#8B5CF6'];

const StakeholderEarningsPage = () => {
  const [earnings, setEarnings] = useState({ totals: {}, by_month: {} });
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCampaign, setFilterCampaign] = useState('all');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [filterCampaign]);

  const fetchCampaigns = async () => {
    try {
      const { data } = await axios.get(`${API}/campaigns`);
      setCampaigns(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEarnings = async () => {
    try {
      let url = `${API}/stakeholder-earnings?`;
      if (filterCampaign !== 'all') url += `campaign_id=${filterCampaign}`;
      
      const { data } = await axios.get(url);
      setEarnings(data);
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

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  const totals = earnings.totals || {};
  const byMonth = earnings.by_month || {};

  // Prepare chart data
  const pieData = [
    { name: 'Company', value: totals.company || 0 },
    { name: 'Dev', value: totals.dev || 0 },
    { name: 'Himanshu', value: totals.himanshu || 0 },
    { name: 'Denim', value: totals.denim || 0 }
  ];

  const barData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: formatMonth(month),
      ...data
    }));

  const grandTotal = (totals.company || 0) + (totals.dev || 0) + (totals.himanshu || 0) + (totals.denim || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">Stakeholder Earnings</h1>
        <p className="text-[#78716C]">Commission distribution among stakeholders</p>
      </div>

      {/* Filter */}
      <Card className="border-stone-200">
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Filter by Campaign</Label>
              <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Earnings Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-stone-200 bg-gradient-to-br from-[#6AAF35]/10 to-white col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins size={20} className="text-[#6AAF35]" />
              <p className="text-xs text-[#78716C]">Total Commission</p>
            </div>
            <p className="text-2xl font-bold text-[#6AAF35]">{formatCurrency(grandTotal)}</p>
          </CardContent>
        </Card>
        
        {[
          { name: 'Company', key: 'company', color: COLORS[0] },
          { name: 'Dev', key: 'dev', color: COLORS[1] },
          { name: 'Himanshu', key: 'himanshu', color: COLORS[2] },
          { name: 'Denim', key: 'denim', color: COLORS[3] }
        ].map((stakeholder) => (
          <Card key={stakeholder.key} className="border-stone-200">
            <CardContent className="p-4">
              <p className="text-xs text-[#78716C]">{stakeholder.name}</p>
              <p className="text-xl font-bold" style={{ color: stakeholder.color }}>
                {formatCurrency(totals[stakeholder.key] || 0)}
              </p>
              <p className="text-xs text-[#78716C]">
                {grandTotal > 0 ? ((totals[stakeholder.key] || 0) / grandTotal * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <Users size={20} />
              Distribution Overview
            </CardTitle>
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

        {/* Bar Chart - Monthly Trend */}
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <TrendUp size={20} />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#78716C" />
                  <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} stroke="#78716C" />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E7E5E4' }}
                  />
                  <Legend />
                  <Bar dataKey="company" name="Company" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="dev" name="Dev" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="himanshu" name="Himanshu" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="denim" name="Denim" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#1C1917]">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Company</TableHead>
                  <TableHead className="text-right">Dev</TableHead>
                  <TableHead className="text-right">Himanshu</TableHead>
                  <TableHead className="text-right">Denim</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(byMonth).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-[#78716C]">
                      No earnings data found
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {Object.entries(byMonth)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([month, data]) => {
                        const monthTotal = (data.company || 0) + (data.dev || 0) + (data.himanshu || 0) + (data.denim || 0);
                        return (
                          <TableRow key={month}>
                            <TableCell className="font-medium">{formatMonth(month)}</TableCell>
                            <TableCell className="text-right" style={{ color: COLORS[0] }}>{formatCurrency(data.company || 0)}</TableCell>
                            <TableCell className="text-right" style={{ color: COLORS[1] }}>{formatCurrency(data.dev || 0)}</TableCell>
                            <TableCell className="text-right" style={{ color: COLORS[2] }}>{formatCurrency(data.himanshu || 0)}</TableCell>
                            <TableCell className="text-right" style={{ color: COLORS[3] }}>{formatCurrency(data.denim || 0)}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(monthTotal)}</TableCell>
                          </TableRow>
                        );
                      })}
                    {/* Totals Row */}
                    <TableRow className="bg-stone-100 font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right" style={{ color: COLORS[0] }}>{formatCurrency(totals.company || 0)}</TableCell>
                      <TableCell className="text-right" style={{ color: COLORS[1] }}>{formatCurrency(totals.dev || 0)}</TableCell>
                      <TableCell className="text-right" style={{ color: COLORS[2] }}>{formatCurrency(totals.himanshu || 0)}</TableCell>
                      <TableCell className="text-right" style={{ color: COLORS[3] }}>{formatCurrency(totals.denim || 0)}</TableCell>
                      <TableCell className="text-right text-[#6AAF35]">{formatCurrency(grandTotal)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StakeholderEarningsPage;
