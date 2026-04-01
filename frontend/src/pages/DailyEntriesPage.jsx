import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import { useAuth } from '../context/AuthContext';
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
import { Plus, Pencil, Trash, CalendarBlank, Funnel, UploadSimple, FileText } from '@phosphor-icons/react';

// Helper function to format date as "1st April, 2026"
const formatDateOrdinal = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const suffix = (day >= 11 && day <= 13) ? 'th' : 
    { 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th';
  const month = date.toLocaleDateString('en-IN', { month: 'long' });
  const year = date.getFullYear();
  return `${day}${suffix} ${month}, ${year}`;
};

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
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [csvCampaign, setCsvCampaign] = useState('');
  const fileInputRef = useRef(null);
  
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
        setCsvCampaign(data[0].id);
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
  
  const getCampaignCommission = (id) => campaigns.find(c => c.id === id)?.commission_percentage || 0;

  // CSV Upload handler
  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!csvCampaign) {
      toast.error('Please select a campaign first');
      return;
    }
    
    setUploading(true);
    try {
      const content = await file.text();
      const { data } = await axios.post(
        `${API}/daily-entries/upload-csv/${csvCampaign}?file_content=${encodeURIComponent(content)}`
      );
      
      if (data.success > 0) {
        toast.success(`Successfully imported ${data.success} entries`);
      }
      if (data.failed > 0) {
        toast.error(`Failed to import ${data.failed} entries`);
        if (data.errors?.length > 0) {
          console.log('Import errors:', data.errors);
        }
      }
      
      setCsvDialogOpen(false);
      fetchEntries();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">Daily Entries</h1>
          <p className="text-[#78716C]">Track daily campaign finances</p>
        </div>
        <div className="flex gap-2">
          {/* CSV Upload Dialog */}
          <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="upload-csv-btn">
                <UploadSimple size={20} className="mr-2" />
                Upload CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload CSV Data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-stone-50 rounded-lg text-sm">
                  <p className="font-medium mb-2">CSV Format:</p>
                  <code className="text-xs bg-stone-200 px-2 py-1 rounded block">
                    date,ad_spend,website_collection,qr_collection
                  </code>
                  <p className="mt-2 text-[#78716C]">
                    Supported date formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Select Campaign *</Label>
                  <Select value={csvCampaign} onValueChange={setCsvCampaign}>
                    <SelectTrigger>
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
                  <Label>Choose CSV File</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    disabled={uploading || !csvCampaign}
                    data-testid="csv-file-input"
                  />
                </div>
                
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-[#78716C]">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#6AAF35] border-t-transparent" />
                    Uploading...
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
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
                  <TableHead className="text-right">After Comm.</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 12 : 11} className="text-center py-8 text-[#78716C]">
                      No entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => {
                    const commPct = getCampaignCommission(entry.campaign_id);
                    const afterComm = entry.net_profit - entry.platform_commission;
                    return (
                      <TableRow key={entry.id} data-testid={`entry-row-${entry.id}`}>
                        <TableCell className="font-medium whitespace-nowrap">{formatDateOrdinal(entry.date)}</TableCell>
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
                        <TableCell className="text-right text-[#F5A623]">
                          <div>{formatCurrency(entry.platform_commission)}</div>
                          <div className="text-xs text-[#78716C]">({commPct}%)</div>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${afterComm >= 0 ? 'text-[#6AAF35]' : 'text-red-500'}`}>
                          <div>{formatCurrency(afterComm)}</div>
                          <div className="text-xs text-[#78716C]">({100 - commPct}%)</div>
                        </TableCell>
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
                    )
                  })
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
