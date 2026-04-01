import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Plus, Pencil, Trash, Eye, Target } from '@phosphor-icons/react';

const CampaignsPage = () => {
  const { isAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    commission_percentage: 25,
    company_share: 4,
    dev_share: 7,
    himanshu_share: 7,
    denim_share: 7,
    status: 'active'
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data } = await axios.get(`${API}/campaigns`);
      setCampaigns(data);
    } catch (e) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate commission splits
    const totalSplit = parseFloat(formData.company_share) + parseFloat(formData.dev_share) + 
                       parseFloat(formData.himanshu_share) + parseFloat(formData.denim_share);
    if (Math.abs(totalSplit - parseFloat(formData.commission_percentage)) > 0.01) {
      toast.error(`Commission splits (${totalSplit}%) must equal total commission (${formData.commission_percentage}%)`);
      return;
    }

    try {
      if (editingCampaign) {
        await axios.put(`${API}/campaigns/${editingCampaign.id}`, formData);
        toast.success('Campaign updated successfully');
      } else {
        await axios.post(`${API}/campaigns`, formData);
        toast.success('Campaign created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/campaigns/${campaignToDelete.id}`);
      toast.success('Campaign deleted successfully');
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
      fetchCampaigns();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const openEditDialog = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      commission_percentage: campaign.commission_percentage,
      company_share: campaign.company_share,
      dev_share: campaign.dev_share,
      himanshu_share: campaign.himanshu_share,
      denim_share: campaign.denim_share,
      status: campaign.status
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      commission_percentage: 25,
      company_share: 4,
      dev_share: 7,
      himanshu_share: 7,
      denim_share: 7,
      status: 'active'
    });
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">Campaigns</h1>
          <p className="text-[#78716C]">Manage your fundraising campaigns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#6AAF35] hover:bg-[#5C982E]" data-testid="create-campaign-btn">
              <Plus size={20} className="mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter campaign name"
                  required
                  data-testid="campaign-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Total Commission % *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData({ ...formData, commission_percentage: parseFloat(e.target.value) || 0 })}
                  required
                  data-testid="commission-input"
                />
              </div>

              <div className="p-4 bg-stone-50 rounded-lg space-y-3">
                <p className="text-sm font-medium text-[#1C1917]">Commission Distribution (must sum to {formData.commission_percentage}%)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Company Share %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.company_share}
                      onChange={(e) => setFormData({ ...formData, company_share: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Dev Share %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.dev_share}
                      onChange={(e) => setFormData({ ...formData, dev_share: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Himanshu Share %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.himanshu_share}
                      onChange={(e) => setFormData({ ...formData, himanshu_share: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Denim Share %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.denim_share}
                      onChange={(e) => setFormData({ ...formData, denim_share: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <p className="text-xs text-[#78716C]">
                  Current total: {(parseFloat(formData.company_share) + parseFloat(formData.dev_share) + 
                    parseFloat(formData.himanshu_share) + parseFloat(formData.denim_share)).toFixed(2)}%
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="bg-[#6AAF35] hover:bg-[#5C982E]" data-testid="save-campaign-btn">
                  {editingCampaign ? 'Update' : 'Create'} Campaign
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns Table */}
      <Card className="border-stone-200">
        <CardContent className="p-0">
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-center">Commission</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Distribution</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-[#78716C]">
                      No campaigns found. Create your first campaign to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id} data-testid={`campaign-row-${campaign.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#6AAF35]/10 flex items-center justify-center">
                            <Target size={20} className="text-[#6AAF35]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1C1917]">{campaign.name}</p>
                            <p className="text-xs text-[#78716C] truncate max-w-[200px]">{campaign.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-[#F5A623]">{campaign.commission_percentage}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}
                          className={campaign.status === 'active' ? 'bg-[#6AAF35]' : ''}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <div className="text-xs text-[#78716C]">
                          C:{campaign.company_share}% | D:{campaign.dev_share}% | H:{campaign.himanshu_share}% | De:{campaign.denim_share}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/campaigns/${campaign.id}`}>
                            <Button variant="ghost" size="icon" data-testid={`view-campaign-${campaign.id}`}>
                              <Eye size={18} />
                            </Button>
                          </Link>
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(campaign)} data-testid={`edit-campaign-${campaign.id}`}>
                                <Pencil size={18} />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700"
                                onClick={() => { setCampaignToDelete(campaign); setDeleteDialogOpen(true); }}
                                data-testid={`delete-campaign-${campaign.id}`}>
                                <Trash size={18} />
                              </Button>
                            </>
                          )}
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
            <DialogTitle>Delete Campaign</DialogTitle>
          </DialogHeader>
          <p className="text-[#44403C]">
            Are you sure you want to delete <strong>{campaignToDelete?.name}</strong>? This will also delete all related entries and settlements. This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-btn">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignsPage;
