import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Gear, Percent, CreditCard, Lock, Eye, EyeSlash } from '@phosphor-icons/react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({ gst_percentage: 18, gateway_percentage: 2.6, qr_percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    setChangingPassword(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      toast.success('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setChangingPassword(false);
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

            <div className="space-y-2">
              <Label htmlFor="qr" className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#8B5CF6]" />
                QR Transaction Percentage
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="qr"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.qr_percentage || 0}
                  onChange={(e) => setSettings({ ...settings, qr_percentage: parseFloat(e.target.value) || 0 })}
                  className="max-w-[150px]"
                  data-testid="qr-input"
                />
                <span className="text-[#78716C]">%</span>
              </div>
              <p className="text-xs text-[#78716C]">
                Deducted from QR Collection for gateway transaction fees
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
            <div className="border-t border-stone-200 my-2"></div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Example QR Collection:</span>
              <span className="font-medium">₹20,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">QR Transaction Charge ({settings.qr_percentage || 0}%):</span>
              <span className="font-medium text-red-500">₹{(20000 * (settings.qr_percentage || 0) / 100).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
            <Lock size={20} />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  placeholder="Enter current password"
                  required
                  className="pr-10"
                  data-testid="current-password-input"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#44403C]"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  className="pr-10"
                  data-testid="new-password-input"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#44403C]"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-[#78716C]">Minimum 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                placeholder="Confirm new password"
                required
                data-testid="confirm-password-input"
              />
            </div>

            <div className="pt-4 border-t border-stone-200">
              <Button 
                type="submit" 
                className="bg-[#6AAF35] hover:bg-[#5C982E]"
                disabled={changingPassword}
                data-testid="change-password-btn"
              >
                {changingPassword ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Changing...
                  </span>
                ) : (
                  'Change Password'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
