import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ChartBar, Funnel, Export, CalendarBlank } from '@phosphor-icons/react';

const ReportsPage = () => {
  const [reports, setReports] = useState({ entries: [], summary: {} });
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [preset, setPreset] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filterCampaign, preset, startDate, endDate]);

  const fetchCampaigns = async () => {
    try {
      const { data } = await axios.get(`${API}/campaigns`);
      setCampaigns(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    try {
      let url = `${API}/reports?`;
      if (filterCampaign !== 'all') url += `campaign_id=${filterCampaign}&`;
      if (preset !== 'custom') {
        url += `preset=${preset}`;
      } else {
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}`;
      }
      
      const { data } = await axios.get(url);
      setReports(data);
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

  const exportToCSV = () => {
    const headers = ['Date', 'Campaign', 'Ad Spend', 'Ad Spend+GST', 'Website', 'QR', 'Gateway', 'Revenue', 'Profit', 'Commission'];
    const rows = reports.entries.map(e => [
      e.date,
      e.campaign_name,
      e.ad_spend,
      e.ad_spend_with_gst,
      e.website_collection,
      e.qr_collection,
      e.gateway_charge,
      e.total_revenue,
      e.net_profit,
      e.platform_commission
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  const summary = reports.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">Reports</h1>
          <p className="text-[#78716C]">Detailed financial reports and analytics</p>
        </div>
        <Button variant="outline" onClick={exportToCSV} data-testid="export-csv-btn">
          <Export size={20} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-stone-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <Funnel size={20} className="text-[#78716C]" />
              <span className="text-sm font-medium text-[#1C1917]">Filters:</span>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Period</Label>
              <Select value={preset} onValueChange={(v) => { setPreset(v); if (v !== 'custom') { setStartDate(''); setEndDate(''); } }}>
                <SelectTrigger className="w-[160px]" data-testid="preset-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="day_before">Day Before</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {preset === 'custom' && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Campaign</Label>
              <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                <SelectTrigger className="w-[180px]" data-testid="campaign-filter">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="border-stone-200">
          <CardContent className="p-3">
            <p className="text-xs text-[#78716C]">Entries</p>
            <p className="text-lg font-bold text-[#1C1917]">{summary.entry_count || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-3">
            <p className="text-xs text-[#78716C]">Ad Spend</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(summary.total_ad_spend || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-3">
            <p className="text-xs text-[#78716C]">Ad+GST</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(summary.total_ad_spend_with_gst || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-3">
            <p className="text-xs text-[#78716C]">Website</p>
            <p className="text-lg font-bold text-[#6AAF35]">{formatCurrency(summary.total_website_collection || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-3">
            <p className="text-xs text-[#78716C]">QR</p>
            <p className="text-lg font-bold text-[#6AAF35]">{formatCurrency(summary.total_qr_collection || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-3">
            <p className="text-xs text-[#78716C]">Revenue</p>
            <p className="text-lg font-bold text-[#6AAF35]">{formatCurrency(summary.total_revenue || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-3">
            <p className="text-xs text-[#78716C]">Profit</p>
            <p className={`text-lg font-bold ${(summary.total_net_profit || 0) >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
              {formatCurrency(summary.total_net_profit || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-3">
            <p className="text-xs text-[#78716C]">Commission</p>
            <p className="text-lg font-bold text-[#F5A623]">{formatCurrency(summary.total_platform_commission || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
            <ChartBar size={20} />
            Detailed Report
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Ad Spend</TableHead>
                  <TableHead className="text-right">Ad+GST</TableHead>
                  <TableHead className="text-right">Website</TableHead>
                  <TableHead className="text-right">QR</TableHead>
                  <TableHead className="text-right">Gateway</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-[#78716C]">
                      No data found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.entries.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{entry.campaign_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.ad_spend)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.ad_spend_with_gst)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.website_collection)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.qr_collection)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatCurrency(entry.gateway_charge)}</TableCell>
                      <TableCell className="text-right text-[#6AAF35]">{formatCurrency(entry.total_revenue)}</TableCell>
                      <TableCell className={`text-right font-medium ${entry.net_profit >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
                        {formatCurrency(entry.net_profit)}
                      </TableCell>
                      <TableCell className="text-right text-[#F5A623]">{formatCurrency(entry.platform_commission)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
