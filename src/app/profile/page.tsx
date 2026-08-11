"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { updateAccount, deleteAccount } from "@/lib/auth";
import { Settings, AccentColor, ACCENT_COLORS } from "@/lib/types";
import {
  Camera,
  Loader2,
  LogOut,
  Save,
  Trash2,
} from "lucide-react";

function syncDocumentClasses(s: Settings) {
  const el = document.documentElement;

  Object.keys(ACCENT_COLORS).forEach((c) => {
    el.classList.remove(`accent-${c}`);
  });
  el.classList.add(`accent-${s.accentColor}`);

  if (s.trueBlack) {
    el.classList.add("true-black");
  } else {
    el.classList.remove("true-black");
  }

  if (s.glassMode) {
    el.classList.add("glass-mode");
  } else {
    el.classList.remove("glass-mode");
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { account, settings, updateSettings, refreshAccount, logout, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(() => account?.username ?? "");
  const [driveTeamRole, setDriveTeamRole] = useState(() => account?.driveTeamRole ?? "");
  const [bio, setBio] = useState(() => account?.bio ?? "");
  const [profilePicture, setProfilePicture] = useState(() => account?.profilePicture ?? "");
  const [localSettings, setLocalSettings] = useState<Settings>(() => ({ ...settings }));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-muted-foreground text-lg">Please log in to view your profile.</p>
        <Link href="/login" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          Go to Login
        </Link>
      </div>
    );
  }

  const initials = account.username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setProfilePicture(result);
      await updateAccount({ profilePicture: result });
      await refreshAccount();
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    await updateAccount({ username, driveTeamRole, bio });
    await refreshAccount();
  };

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    const updated = { ...localSettings, theme: newTheme };
    setLocalSettings(updated);
    await updateSettings({ theme: newTheme });
    syncDocumentClasses(updated);
  };

  const handleAccentChange = async (color: AccentColor) => {
    const updated = { ...localSettings, accentColor: color };
    setLocalSettings(updated);
    await updateSettings({ accentColor: color });
    syncDocumentClasses(updated);
  };

  const handleGlassModeChange = async (checked: boolean) => {
    const updated = { ...localSettings, glassMode: checked };
    setLocalSettings(updated);
    await updateSettings({ glassMode: checked });
    syncDocumentClasses(updated);
  };

  const handleTrueBlackChange = async (checked: boolean) => {
    const updated = { ...localSettings, trueBlack: checked };
    setLocalSettings(updated);
    await updateSettings({ trueBlack: checked });
    syncDocumentClasses(updated);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    const success = await deleteAccount();
    if (success) {
      router.push("/login");
    }
  };

  const showTrueBlack = localSettings.theme === "dark" || localSettings.theme === "system";

  return (
    <div className="space-y-6 max-w-2xl px-4 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account and appearance</p>
      </div>

      {/* Profile Picture & Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div
              className="relative h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {profilePicture ? (
                <Image
                  src={profilePicture}
                  alt="Profile"
                  width={96}
                  height={96}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground">
                  {initials}
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{account.username}</p>
              <p className="text-xs text-muted-foreground">Click the avatar to upload</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-3.5 w-3.5" />
                {profilePicture ? "Change Photo" : "Upload Photo"}
              </Button>
              {profilePicture && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={async () => {
                    setProfilePicture("");
                    await updateAccount({ profilePicture: "" });
                    await refreshAccount();
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
              />
              <Button
                size="sm"
                onClick={async () => {
                  if (username.trim()) {
                    await updateAccount({ username: username.trim() });
                    await refreshAccount();
                  }
                }}
              >
                <Save className="mr-2 h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Drive Team Role</Label>
            <Input
              value={driveTeamRole}
              onChange={(e) => setDriveTeamRole(e.target.value)}
              placeholder="e.g., Driver, Operator, Builder, Programmer"
            />
          </div>

          <div className="space-y-2">
            <Label>Personal Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other scouts about yourself..."
              rows={3}
            />
          </div>

          <Button onClick={handleSaveProfile} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={localSettings.theme}
              onValueChange={(v) =>
                handleThemeChange((v ?? "system") as "light" | "dark" | "system")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Accent Color</Label>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((color) => {
                const meta = ACCENT_COLORS[color];
                const isActive = localSettings.accentColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleAccentChange(color)}
                    className={`flex flex-col items-center gap-1.5 rounded-md p-2 transition-colors ${
                      isActive
                        ? "bg-accent/10 ring-2 ring-ring"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div
                      className="h-8 w-8 rounded-full border-2 border-background shadow-sm"
                      style={{
                        backgroundColor: `hsl(${meta.dark})`,
                      }}
                    />
                    <span className="text-xs font-medium">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Glass UI Mode</Label>
              <p className="text-sm text-muted-foreground">
                Frosted glass cards with blurred backgrounds
              </p>
            </div>
            <Switch
              checked={localSettings.glassMode}
              onCheckedChange={handleGlassModeChange}
            />
          </div>

          {showTrueBlack && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>True Black (OLED)</Label>
                <p className="text-sm text-muted-foreground">
                  Pure black background for OLED screens
                </p>
              </div>
              <Switch
                checked={localSettings.trueBlack}
                onCheckedChange={handleTrueBlackChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Member Since</span>
            <Badge variant="secondary">
              {new Date(account.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Account ID</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {account.id.slice(0, 12)}...
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Log Out */}
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all personal data. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Are you sure you want to delete your account?</p>
                <p>This action cannot be undone.</p>
                <p>All your personal data will be removed.</p>
                <p>Shared reports will remain, but your name will be shown as &quot;Deleted User&quot;.</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                >
                  Confirm Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
