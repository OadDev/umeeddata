import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Plus, Pencil, Trash, Calculator } from '@phosphor-icons/react';

const MonthlySettlementsPage = () => {
  const [settlements, setSettlements] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settlementToDelete, setSettlementToDelete] = useState(null);
  
  const [filterCampaign, setFilterCampaign] = useState('all');

  const [formData, setFormData] = useState({
    campaign_id: '',
    report_month: '',
    ad_account_charges: 0,
    miscellaneous_expenses: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [filterCampaign]);

  const fetchData = async () => {
    try {
      const [campaignsRes] = await Promise.all([
        axios.get(`${API}/campaigns`)
      ]);
      setCampaigns(campaignsRes.data);
      if (campaignsRes.data.length > 0) {
        setFormData(prev => ({ ...prev, campaign_id: campaignsRes.data[0].id }));
      }
    } catch (e) {
      toast.error('Failed to load data');
    }
  };

  const fetchSettlements = async () => {
    try {
      let url = `${API}/monthly-settlements?`;
      if (filterCampaign !== 'all') url += `campaign_id=${filterCampaign}`;
      
      const { data } = await axios.get(url);
      setSettlements(data);
    } catch (e) {
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSettlement) {
        await axios.put(`${API}/monthly-settlements/${editingSettlement.id}`, {
          ad_account_charges: formData.ad_account_charges,
          miscellaneous_expenses: formData.miscellaneous_expenses,
          notes: formData.notes
        });
        toast.success('Settlement updated successfully');
      } else {
        await axios.post(`${API}/monthly-settlements`, formData);
        toast.success('Settlement created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchSettlements();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/monthly-settlements/${settlementToDelete.id}`);
      toast.success('Settlement deleted successfully');
      setDeleteDialogOpen(false);
      setSettlementToDelete(null);
      fetchSettlements();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const openEditDialog = (settlement) => {
    setEditingSettlement(settlement);
    setFormData({
      campaign_id: settlement.campaign_id,
      report_month: settlement.report_month,
      ad_account_charges: settlement.ad_account_charges,
      miscellaneous_expenses: settlement.miscellaneous_expenses,
      notes: settlement.notes || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSettlement(null);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setFormData({
      campaign_id: campaigns.length > 0 ? campaigns[0].id : '',
      report_month: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`,
      ad_account_charges: 0,
      miscellaneous_expenses: 0,
      notes: ''
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getCampaignName = (id) => campaigns.find(c => c.id === id)?.name || 'Unknown';

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  // Generate month options (last 12 months)
  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">Monthly Settlements</h1>
          <p className="text-[#78716C]">Manage ad account charges and miscellaneous expenses</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#6AAF35] hover:bg-[#5C982E]" data-testid="add-settlement-btn">
              <Plus size={20} className="mr-2" />
              Add Settlement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSettlement ? 'Edit Settlement' : 'Add Monthly Settlement'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign *</Label>
                <Select 
                  value={formData.campaign_id} 
                  onValueChange={(v) => setFormData({ ...formData, campaign_id: v })}
                  disabled={!!editingSettlement}
                >
                  <SelectTrigger data-testid="settlement-campaign-select">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Report Month *</Label>
                <Select 
                  value={formData.report_month} 
                  onValueChange={(v) => setFormData({ ...formData, report_month: v })}
                  disabled={!!editingSettlement}
                >
                  <SelectTrigger data-testid="settlement-month-select">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthOptions().map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ad Account Charges (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.ad_account_charges}
                  onChange={(e) => setFormData({ ...formData, ad_account_charges: parseFloat(e.target.value) || 0 })}
                  data-testid="ad-account-charges-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Miscellaneous Expenses (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.miscellaneous_expenses}
                  onChange={(e) => setFormData({ ...formData, miscellaneous_expenses: parseFloat(e.target.value) || 0 })}
                  data-testid="misc-expenses-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                  rows={3}
                />
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="bg-[#6AAF35] hover:bg-[#5C982E]" data-testid="save-settlement-btn">
                  {editingSettlement ? 'Update' : 'Add'} Settlement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-stone-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label>Filter by Campaign:</Label>
            <Select value={filterCampaign} onValueChange={setFilterCampaign}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Settlements Table */}
      <Card className="border-stone-200">
        <CardContent className="p-0">
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Ad Account Charges</TableHead>
                  <TableHead className="text-right">Misc. Expenses</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[#78716C]">
                      No settlements found. Add monthly settlement data on the 1st of each month.
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map((settlement) => (
                    <TableRow key={settlement.id} data-testid={`settlement-row-${settlement.id}`}>
                      <TableCell className="font-medium">{formatMonth(settlement.report_month)}</TableCell>
                      <TableCell>{getCampaignName(settlement.campaign_id)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatCurrency(settlement.ad_account_charges)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatCurrency(settlement.miscellaneous_expenses)}</TableCell>
                      <TableCell className="text-right font-medium text-red-500">
                        {formatCurrency(settlement.ad_account_charges + settlement.miscellaneous_expenses)}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-[#78716C]">{settlement.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(settlement)} data-testid={`edit-settlement-${settlement.id}`}>
                            <Pencil size={18} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => { setSettlementToDelete(settlement); setDeleteDialogOpen(true); }}
                            data-testid={`delete-settlement-${settlement.id}`}
                          >
                            <Trash size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Settlement</DialogTitle>
          </DialogHeader>
          <p className="text-[#44403C]">
            Are you sure you want to delete this settlement for {settlementToDelete?.report_month}? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-settlement-btn">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlySettlementsPage;
