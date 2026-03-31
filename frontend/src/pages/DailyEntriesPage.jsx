import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { format } from 'date-fns';
import { Plus, Pencil, Trash, CalendarBlank, Funnel } from '@phosphor-icons/react';

const DailyEntriesPage = () => {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Filters
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [formData, setFormData] = useState({
    campaign_id: '',
    date: new Date().toISOString().split('T')[0],
    ad_spend: 0,
    website_collection: 0,
    qr_collection: 0
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [filterCampaign, filterStartDate, filterEndDate]);

  const fetchCampaigns = async () => {
    try {
      const { data } = await axios.get(`${API}/campaigns`);
      setCampaigns(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, campaign_id: data[0].id }));
      }
    } catch (e) {
      toast.error('Failed to load campaigns');
    }
  };

  const fetchEntries = async () => {
    try {
      let url = `${API}/daily-entries?`;
      if (filterCampaign !== 'all') url += `campaign_id=${filterCampaign}&`;
      if (filterStartDate) url += `start_date=${filterStartDate}&`;
      if (filterEndDate) url += `end_date=${filterEndDate}&`;
      
      const { data } = await axios.get(url);
      setEntries(data);
    } catch (e) {
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await axios.put(`${API}/daily-entries/${editingEntry.id}`, {
          ad_spend: formData.ad_spend,
          website_collection: formData.website_collection,
          qr_collection: formData.qr_collection
        });
        toast.success('Entry updated successfully');
      } else {
        await axios.post(`${API}/daily-entries`, formData);
        toast.success('Entry created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchEntries();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/daily-entries/${entryToDelete.id}`);
      toast.success('Entry deleted successfully');
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      fetchEntries();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const openEditDialog = (entry) => {
    setEditingEntry(entry);
    setFormData({
      campaign_id: entry.campaign_id,
      date: entry.date,
      ad_spend: entry.ad_spend,
      website_collection: entry.website_collection,
      qr_collection: entry.qr_collection
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      campaign_id: campaigns.length > 0 ? campaigns[0].id : '',
      date: new Date().toISOString().split('T')[0],
      ad_spend: 0,
      website_collection: 0,
      qr_collection: 0
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">Daily Entries</h1>
          <p className="text-[#78716C]">Track daily campaign finances</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#6AAF35] hover:bg-[#5C982E]" data-testid="add-entry-btn">
              <Plus size={20} className="mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Edit Entry' : 'Add Daily Entry'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign *</Label>
                <Select 
                  value={formData.campaign_id} 
                  onValueChange={(v) => setFormData({ ...formData, campaign_id: v })}
                  disabled={!!editingEntry}
                >
                  <SelectTrigger data-testid="campaign-select">
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
                <Label>Date *</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={!!editingEntry}
                      data-testid="date-picker"
                    >
                      <CalendarBlank size={18} className="mr-2" />
                      {formData.date ? format(new Date(formData.date), 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') });
                          setCalendarOpen(false);
                        }
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Ad Spend (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.ad_spend}
                  onChange={(e) => setFormData({ ...formData, ad_spend: parseFloat(e.target.value) || 0 })}
                  required
                  data-testid="ad-spend-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Website Collection (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.website_collection}
                  onChange={(e) => setFormData({ ...formData, website_collection: parseFloat(e.target.value) || 0 })}
                  required
                  data-testid="website-collection-input"
                />
              </div>

              <div className="space-y-2">
                <Label>QR Collection (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.qr_collection}
                  onChange={(e) => setFormData({ ...formData, qr_collection: parseFloat(e.target.value) || 0 })}
                  required
                  data-testid="qr-collection-input"
                />
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="bg-[#6AAF35] hover:bg-[#5C982E]" data-testid="save-entry-btn">
                  {editingEntry ? 'Update' : 'Add'} Entry
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-stone-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Funnel size={20} className="text-[#78716C]" />
              <span className="text-sm font-medium text-[#1C1917]">Filters:</span>
            </div>
            <Select value={filterCampaign} onValueChange={setFilterCampaign}>
              <SelectTrigger className="w-[200px]" data-testid="filter-campaign">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-[150px]"
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-[150px]"
              placeholder="End Date"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { setFilterCampaign('all'); setFilterStartDate(''); setFilterEndDate(''); }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card className="border-stone-200">
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
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 11 : 10} className="text-center py-8 text-[#78716C]">
                      No entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id} data-testid={`entry-row-${entry.id}`}>
                      <TableCell className="font-medium">{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{getCampaignName(entry.campaign_id)}</TableCell>
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
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(entry)} data-testid={`edit-entry-${entry.id}`}>
                              <Pencil size={18} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => { setEntryToDelete(entry); setDeleteDialogOpen(true); }}
                              data-testid={`delete-entry-${entry.id}`}
                            >
                              <Trash size={18} />
                            </Button>
                          </div>
                        </TableCell>
                      )}
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
            <DialogTitle>Delete Entry</DialogTitle>
          </DialogHeader>
          <p className="text-[#44403C]">
            Are you sure you want to delete this entry for {entryToDelete?.date}? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-entry-btn">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyEntriesPage;
