"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import {
  getSettings,
  saveSettings,
  exportData,
  importData,
  resetAllData,
  getTeams,
} from "@/lib/store";
import { Settings, AccentColor, ACCENT_COLORS, DEFAULT_SETTINGS } from "@/lib/types";
import {
  Save,
  Download,
  Upload,
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

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === "undefined") {
      return { ...DEFAULT_SETTINGS };
    }
    return getSettings();
  });
  const [newEvent, setNewEvent] = useState("");
  const [importJson, setImportJson] = useState("");

  useEffect(() => {
    syncDocumentClasses(settings);
  }, [settings]);

  const handleSave = () => {
    saveSettings(settings);
    setTheme(settings.theme);
    syncDocumentClasses(settings);
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    const updated = { ...settings, theme: newTheme };
    setSettings(updated);
    setTheme(newTheme);
    saveSettings(updated);
    syncDocumentClasses(updated);
  };

  const handleAccentChange = (color: AccentColor) => {
    const updated = { ...settings, accentColor: color };
    setSettings(updated);
    saveSettings(updated);
    syncDocumentClasses(updated);
  };

  const handleGlassModeChange = (checked: boolean) => {
    const updated = { ...settings, glassMode: checked };
    setSettings(updated);
    saveSettings(updated);
    syncDocumentClasses(updated);
  };

  const handleTrueBlackChange = (checked: boolean) => {
    const updated = { ...settings, trueBlack: checked };
    setSettings(updated);
    saveSettings(updated);
    syncDocumentClasses(updated);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frc-scout-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJson) return;
    const success = importData(importJson);
    if (success) {
      setSettings(getSettings());
      setImportJson("");
      alert("Data imported successfully!");
    } else {
      alert("Failed to import data. Please check the JSON format.");
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure? This will delete all local data.")) {
      resetAllData();
      setSettings({ ...DEFAULT_SETTINGS });
    }
  };

  const handleAddEvent = () => {
    if (!newEvent || settings.events.includes(newEvent)) return;
    setSettings({
      ...settings,
      events: [...settings.events, newEvent],
    });
    setNewEvent("");
  };

  const showTrueBlack = settings.theme === "dark" || settings.theme === "system";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your scouting application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={settings.theme}
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
                const isActive = settings.accentColor === color;
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
              checked={settings.glassMode}
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
                checked={settings.trueBlack}
                onCheckedChange={handleTrueBlackChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Scout Name / ID</Label>
            <Input
              value={settings.scoutName}
              onChange={(e) =>
                setSettings({ ...settings, scoutName: e.target.value })
              }
              placeholder="Your name or ID"
            />
          </div>

          <div className="space-y-2">
            <Label>Current Event</Label>
            <Select
              value={settings.currentEvent}
              onValueChange={(v) =>
                setSettings({ ...settings, currentEvent: v ?? settings.currentEvent })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settings.events.map((event) => (
                  <SelectItem key={event} value={event}>
                    {event}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Add New Event</Label>
            <div className="flex gap-2">
              <Input
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                placeholder="Event name"
              />
              <Button variant="outline" onClick={handleAddEvent}>
                Add
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Offline Mode</Label>
              <p className="text-sm text-muted-foreground">
                Store all data locally without syncing
              </p>
            </div>
            <Switch
              checked={settings.offlineMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, offlineMode: checked })
              }
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Data ({getTeams().length} teams)
          </Button>

          <div className="space-y-2">
            <Label>Import Data</Label>
            <Textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste exported JSON here..."
              rows={4}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={handleImport}
              disabled={!importJson}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
          </div>

          <Separator />

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleReset}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Reset All Local Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
