import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { FilePdf, Download, ChartPie, Check, X } from '@phosphor-icons/react';
import { toast } from 'sonner';

const MonthlyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filterCampaign, filterMonth]);

  const fetchData = async () => {
    try {
      const { data } = await axios.get(`${API}/campaigns`);
      setCampaigns(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    try {
      let url = `${API}/monthly-reports?`;
      if (filterCampaign !== 'all') url += `campaign_id=${filterCampaign}&`;
      if (filterMonth !== 'all') url += `report_month=${filterMonth}`;
      
      const { data } = await axios.get(url);
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (campaignId, month, campaignName) => {
    try {
      const response = await axios.get(`${API}/generate-pdf/${campaignId}/${month}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      // Create filename with campaign name and month
      const monthName = formatMonthFull(month);
      const safeName = campaignName.replace(/\s+/g, '_').replace(/-/g, '_');
      a.download = `${safeName}_${monthName.replace(', ', '_')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (e) {
      toast.error('Failed to download PDF');
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
    return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const formatMonthFull = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  // Get unique months from reports
  const getMonthOptions = () => {
    const months = [...new Set(reports.map(r => r.month))].sort().reverse();
    return months;
  };

  // Calculate totals
  const totals = reports.reduce((acc, r) => ({
    funds_raised: acc.funds_raised + r.funds_raised,
    ad_cost: acc.ad_cost + r.ad_cost_with_gst,
    gateway: acc.gateway + r.gateway_charge,
    profit: acc.profit + r.net_profit,
    commission: acc.commission + r.commission,
    after_commission: acc.after_commission + (r.net_profit - r.commission),
    ad_account: acc.ad_account + r.ad_account_charges,
    misc: acc.misc + r.miscellaneous_expenses,
    funds_to_give: acc.funds_to_give + r.funds_to_give
  }), { funds_raised: 0, ad_cost: 0, gateway: 0, profit: 0, commission: 0, after_commission: 0, ad_account: 0, misc: 0, funds_to_give: 0 });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">Monthly Reports</h1>
        <p className="text-[#78716C]">Campaign-wise monthly summary with settlement details</p>
      </div>

      {/* Filters */}
      <Card className="border-stone-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Campaign</Label>
              <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                <SelectTrigger className="w-[180px]">
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

            <div className="space-y-1">
              <Label className="text-xs">Month</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {getMonthOptions().map(m => (
                    <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
            <ChartPie size={20} />
            Monthly Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead>Month</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Funds Raised</TableHead>
                  <TableHead className="text-right">Ad Cost (GST)</TableHead>
                  <TableHead className="text-right">Gateway</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">After Commission</TableHead>
                  <TableHead className="text-right">Ad Account</TableHead>
                  <TableHead className="text-right">Misc</TableHead>
                  <TableHead className="text-right">To Give</TableHead>
                  <TableHead className="text-center">Settlement</TableHead>
                  <TableHead className="text-center">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-[#78716C]">
                      No monthly reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {reports.map((report, idx) => (
                      <TableRow key={idx} className="hover:bg-stone-50">
                        <TableCell className="font-medium">{formatMonth(report.month)}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{report.campaign_name}</TableCell>
                        <TableCell className="text-right text-[#6AAF35]">{formatCurrency(report.funds_raised)}</TableCell>
                        <TableCell className="text-right text-red-500">{formatCurrency(report.ad_cost_with_gst)}</TableCell>
                        <TableCell className="text-right text-red-500">{formatCurrency(report.gateway_charge)}</TableCell>
                        <TableCell className={`text-right font-medium ${report.net_profit >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
                          {formatCurrency(report.net_profit)}
                        </TableCell>
                        <TableCell className="text-right text-[#F5A623]">{formatCurrency(report.commission)}</TableCell>
                        <TableCell className={`text-right font-medium ${(report.net_profit - report.commission) >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
                          {formatCurrency(report.net_profit - report.commission)}
                        </TableCell>
                        <TableCell className="text-right text-red-500">{formatCurrency(report.ad_account_charges)}</TableCell>
                        <TableCell className="text-right text-red-500">{formatCurrency(report.miscellaneous_expenses)}</TableCell>
                        <TableCell className={`text-right font-bold ${report.funds_to_give >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
                          {formatCurrency(report.funds_to_give)}
                        </TableCell>
                        <TableCell className="text-center">
                          {report.has_settlement ? (
                            <Badge className="bg-[#6AAF35]"><Check size={14} /></Badge>
                          ) : (
                            <Badge variant="secondary"><X size={14} /></Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => downloadPDF(report.campaign_id, report.month, report.campaign_name)}
                            data-testid={`download-pdf-${report.campaign_id}-${report.month}`}
                          >
                            <FilePdf size={20} className="text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-stone-100 font-bold">
                      <TableCell colSpan={2}>TOTAL</TableCell>
                      <TableCell className="text-right text-[#6AAF35]">{formatCurrency(totals.funds_raised)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatCurrency(totals.ad_cost)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatCurrency(totals.gateway)}</TableCell>
                      <TableCell className={`text-right ${totals.profit >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
                        {formatCurrency(totals.profit)}
                      </TableCell>
                      <TableCell className="text-right text-[#F5A623]">{formatCurrency(totals.commission)}</TableCell>
                      <TableCell className={`text-right ${totals.after_commission >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
                        {formatCurrency(totals.after_commission)}
                      </TableCell>
                      <TableCell className="text-right text-red-500">{formatCurrency(totals.ad_account)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatCurrency(totals.misc)}</TableCell>
                      <TableCell className={`text-right ${totals.funds_to_give >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
                        {formatCurrency(totals.funds_to_give)}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stakeholder Earnings Preview */}
      {reports.length > 0 && (
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-[#1C1917]">Commission Distribution (This View)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['company', 'dev', 'himanshu', 'denim'].map(stakeholder => {
                const total = reports.reduce((sum, r) => sum + (r.stakeholder_earnings?.[stakeholder] || 0), 0);
                return (
                  <div key={stakeholder} className="p-4 bg-stone-50 rounded-lg">
                    <p className="text-xs text-[#78716C] capitalize">{stakeholder} Share</p>
                    <p className="text-xl font-bold text-[#F5A623]">{formatCurrency(total)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MonthlyReportsPage;
