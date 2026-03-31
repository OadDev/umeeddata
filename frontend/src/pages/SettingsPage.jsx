import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Gear, Percent, CreditCard } from '@phosphor-icons/react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({ gst_percentage: 18, gateway_percentage: 2.6 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get(`${API}/settings`);
      setSettings(data);
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success('Settings updated successfully');
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">Settings</h1>
        <p className="text-[#78716C]">Configure system-wide financial parameters</p>
      </div>

      {/* Settings Form */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
            <Gear size={20} />
            Financial Settings
          </CardTitle>
          <CardDescription>
            These values are used in all financial calculations across campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gst" className="flex items-center gap-2">
                <Percent size={18} className="text-[#6AAF35]" />
                GST Percentage
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gst"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.gst_percentage}
                  onChange={(e) => setSettings({ ...settings, gst_percentage: parseFloat(e.target.value) || 0 })}
                  className="max-w-[150px]"
                  data-testid="gst-input"
                />
                <span className="text-[#78716C]">%</span>
              </div>
              <p className="text-xs text-[#78716C]">
                Applied to Ad Spend to calculate Ad Spend including GST
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gateway" className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#F5A623]" />
                Gateway Charge Percentage
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gateway"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.gateway_percentage}
                  onChange={(e) => setSettings({ ...settings, gateway_percentage: parseFloat(e.target.value) || 0 })}
                  className="max-w-[150px]"
                  data-testid="gateway-input"
                />
                <span className="text-[#78716C]">%</span>
              </div>
              <p className="text-xs text-[#78716C]">
                Deducted from Website Collection for payment gateway fees
              </p>
            </div>

            <div className="pt-4 border-t border-stone-200">
              <Button 
                type="submit" 
                className="bg-[#6AAF35] hover:bg-[#5C982E]"
                disabled={saving}
                data-testid="save-settings-btn"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Calculation Preview */}
      <Card className="border-stone-200 bg-stone-50">
        <CardHeader>
          <CardTitle className="text-md font-semibold text-[#1C1917]">Calculation Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#78716C]">Example Ad Spend:</span>
              <span className="font-medium">₹10,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Ad Spend + GST ({settings.gst_percentage}%):</span>
              <span className="font-medium text-red-500">₹{(10000 * (1 + settings.gst_percentage / 100)).toFixed(2)}</span>
            </div>
            <div className="border-t border-stone-200 my-2"></div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Example Website Collection:</span>
              <span className="font-medium">₹50,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Gateway Charge ({settings.gateway_percentage}%):</span>
              <span className="font-medium text-red-500">₹{(50000 * settings.gateway_percentage / 100).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
