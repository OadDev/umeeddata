import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Wallet, Plus, PencilSimple, Trash, Bank, CurrencyInr, ArrowDown, Scales } from '@phosphor-icons/react';
import { toast } from 'sonner';

const TRANSFER_MODES = ['Bank Transfer (NEFT/RTGS/IMPS)', 'UPI', 'Cheque', 'Cash', 'Other'];

const FundDisbursementsPage = () => {
  const { isAdmin } = useAuth();
  const [disbursements, setDisbursements] = useState([]);
  const [summary, setSummary] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({
    campaign_id: '',
    report_month: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    transfer_mode: '',
    remarks: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterCampaign, filterMonth]);

  const fetchCampaigns = async () => {
    try {
      const { data } = await axios.get(`${API}/campaigns`);
      setCampaigns(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      let params = '';
      if (filterCampaign !== 'all') params += `campaign_id=${filterCampaign}&`;
      if (filterMonth !== 'all') params += `report_month=${filterMonth}`;

      const [disbRes, summRes] = await Promise.all([
        axios.get(`${API}/disbursements?${params}`),
        axios.get(`${API}/disbursements/summary?${params}`)
      ]);
      setDisbursements(disbRes.data);
      setSummary(summRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getMonthOptions = () => {
    const months = [...new Set(summary.map(s => s.month))].sort().reverse();
    return months;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const openAddDialog = () => {
    setEditingId(null);
    setForm({
      campaign_id: filterCampaign !== 'all' ? filterCampaign : '',
      report_month: filterMonth !== 'all' ? filterMonth : '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      transfer_mode: '',
      remarks: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (d) => {
    setEditingId(d.id);
    setForm({
      campaign_id: d.campaign_id,
      report_month: d.report_month,
      amount: d.amount,
      date: d.date,
      transfer_mode: d.transfer_mode,
      remarks: d.remarks || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.campaign_id || !form.report_month || !form.amount || !form.date || !form.transfer_mode) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      if (editingId) {
        await axios.put(`${API}/disbursements/${editingId}`, {
          amount: parseFloat(form.amount),
          date: form.date,
          transfer_mode: form.transfer_mode,
          remarks: form.remarks
        });
        toast.success('Disbursement updated');
      } else {
        await axios.post(`${API}/disbursements`, {
          campaign_id: form.campaign_id,
          report_month: form.report_month,
          amount: parseFloat(form.amount),
          date: form.date,
          transfer_mode: form.transfer_mode,
          remarks: form.remarks
        });
        toast.success('Disbursement recorded');
      }
      setDialogOpen(false);
      fetchData();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/disbursements/${deletingId}`);
      toast.success('Disbursement deleted');
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  // Aggregate totals
  const totals = summary.reduce((acc, s) => ({
    funds_to_give: acc.funds_to_give + s.funds_to_give,
    total_disbursed: acc.total_disbursed + s.total_disbursed,
    balance: acc.balance + s.balance
  }), { funds_to_give: 0, total_disbursed: 0, balance: 0 });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]" data-testid="disbursements-title">Fund Disbursements</h1>
          <p className="text-[#78716C]">Track funds disbursed to campaign clients</p>
        </div>
        {isAdmin && (
          <Button
            onClick={openAddDialog}
            className="bg-[#6AAF35] hover:bg-[#5A9A2D] gap-2"
            data-testid="add-disbursement-btn"
          >
            <Plus size={18} />
            Record Disbursement
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-stone-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Campaign</Label>
              <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                <SelectTrigger className="w-[200px]" data-testid="filter-campaign">
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
                <SelectTrigger className="w-[150px]" data-testid="filter-month">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <CurrencyInr size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-[#78716C]">Total Funds to Give</p>
                <p className="text-xl font-bold text-[#1C1917]" data-testid="total-funds-to-give">{formatCurrency(totals.funds_to_give)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <ArrowDown size={22} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-[#78716C]">Total Disbursed</p>
                <p className="text-xl font-bold text-[#6AAF35]" data-testid="total-disbursed">{formatCurrency(totals.total_disbursed)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Scales size={22} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-[#78716C]">Balance Remaining</p>
                <p className={`text-xl font-bold ${totals.balance >= 0 ? 'text-[#F5A623]' : 'text-red-500'}`} data-testid="total-balance">{formatCurrency(totals.balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign-Month Balance Overview */}
      {summary.length > 0 && (
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <Wallet size={20} />
              Balance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50">
                    <TableHead>Month</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-right">Funds to Give</TableHead>
                    <TableHead className="text-right">Disbursed</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((s, idx) => (
                    <TableRow key={idx} className="hover:bg-stone-50">
                      <TableCell className="font-medium">{formatMonth(s.month)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{s.campaign_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.funds_to_give)}</TableCell>
                      <TableCell className="text-right text-[#6AAF35]">{formatCurrency(s.total_disbursed)}</TableCell>
                      <TableCell className={`text-right font-semibold ${s.balance >= 0 ? 'text-[#F5A623]' : 'text-red-500'}`}>
                        {formatCurrency(s.balance)}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.total_disbursed === 0 ? (
                          <Badge variant="secondary" data-testid={`status-pending-${idx}`}>Pending</Badge>
                        ) : s.balance <= 0 ? (
                          <Badge className="bg-[#6AAF35]" data-testid={`status-complete-${idx}`}>Fully Paid</Badge>
                        ) : (
                          <Badge className="bg-[#F5A623]" data-testid={`status-partial-${idx}`}>Partial</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disbursement Transactions */}
      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
            <Bank size={20} />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Transfer Mode</TableHead>
                  <TableHead>Remarks</TableHead>
                  {isAdmin && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {disbursements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-[#78716C]">
                      No disbursements recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  disbursements.map((d) => {
                    const camp = campaigns.find(c => c.id === d.campaign_id);
                    return (
                      <TableRow key={d.id} className="hover:bg-stone-50">
                        <TableCell className="font-medium">{formatDate(d.date)}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{camp?.name || d.campaign_id}</TableCell>
                        <TableCell>{formatMonth(d.report_month)}</TableCell>
                        <TableCell className="text-right font-semibold text-[#6AAF35]">{formatCurrency(d.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{d.transfer_mode}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-[#78716C]">{d.remarks || '-'}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(d)}
                                data-testid={`edit-disbursement-${d.id}`}
                              >
                                <PencilSimple size={18} className="text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setDeletingId(d.id); setDeleteDialogOpen(true); }}
                                data-testid={`delete-disbursement-${d.id}`}
                              >
                                <Trash size={18} className="text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="disbursement-dialog">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Disbursement' : 'Record New Disbursement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingId && (
              <>
                <div className="space-y-1">
                  <Label>Campaign *</Label>
                  <Select value={form.campaign_id} onValueChange={v => setForm(f => ({ ...f, campaign_id: v }))}>
                    <SelectTrigger data-testid="form-campaign">
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Report Month *</Label>
                  <Input
                    type="month"
                    value={form.report_month}
                    onChange={e => setForm(f => ({ ...f, report_month: e.target.value }))}
                    data-testid="form-report-month"
                  />
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label>Amount (Rs.) *</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="Enter amount"
                data-testid="form-amount"
              />
            </div>
            <div className="space-y-1">
              <Label>Transfer Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                data-testid="form-date"
              />
            </div>
            <div className="space-y-1">
              <Label>Transfer Mode *</Label>
              <Select value={form.transfer_mode} onValueChange={v => setForm(f => ({ ...f, transfer_mode: v }))}>
                <SelectTrigger data-testid="form-transfer-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFER_MODES.map(mode => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Remarks</Label>
              <Textarea
                value={form.remarks}
                onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                placeholder="Optional notes about this transfer"
                rows={2}
                data-testid="form-remarks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#6AAF35] hover:bg-[#5A9A2D]" onClick={handleSubmit} data-testid="form-submit-btn">
              {editingId ? 'Update' : 'Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm" data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete Disbursement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#78716C]">Are you sure you want to delete this disbursement record? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-btn">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FundDisbursementsPage;
