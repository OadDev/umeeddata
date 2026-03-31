import React, { useState } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, Lock, Eye, EyeSlash, EnvelopeSimple, Shield } from '@phosphor-icons/react';

const ProfilePage = () => {
  const { user } = useAuth();
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">Profile</h1>
        <p className="text-[#78716C]">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
            <User size={20} />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-[#6AAF35] flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1C1917]">{user?.name}</h3>
                <div className="flex items-center gap-2 text-[#78716C]">
                  <EnvelopeSimple size={16} />
                  {user?.email}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Shield size={16} className={user?.role === 'admin' ? 'text-[#F5A623]' : 'text-[#6AAF35]'} />
                  <span className={`text-sm font-medium ${user?.role === 'admin' ? 'text-[#F5A623]' : 'text-[#6AAF35]'}`}>
                    {user?.role === 'admin' ? 'Administrator' : 'User'}
                  </span>
                </div>
              </div>
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

export default ProfilePage;
