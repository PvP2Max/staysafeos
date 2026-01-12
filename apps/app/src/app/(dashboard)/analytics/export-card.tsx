"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from "@staysafeos/ui";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";

type ExportType = "rides" | "training" | "shifts";
type ExportFormat = "csv" | "xlsx";

export function ExportCard() {
  const [exportType, setExportType] = useState<ExportType>("rides");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsDateRange = exportType === "rides" || exportType === "shifts";

  const handleExport = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate date range if needed
      if (needsDateRange) {
        if (!startDate || !endDate) {
          throw new Error("Please select both start and end dates");
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays > 30) {
          throw new Error("Date range cannot exceed 30 days");
        }

        if (start > end) {
          throw new Error("Start date must be before end date");
        }
      }

      // Build URL
      let url = `/api/exports/${exportType}?format=${format}`;
      if (needsDateRange) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Export failed: ${response.status}`);
      }

      // Get filename from Content-Disposition header or generate one
      const disposition = response.headers.get("Content-Disposition");
      let filename = `${exportType}_export.${format}`;
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  // Set default dates (last 7 days)
  const setDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export Data
        </CardTitle>
        <CardDescription>
          Download rides, training, or shifts data as CSV or Excel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Export Type</Label>
            <Select
              value={exportType}
              onValueChange={(v) => setExportType(v as ExportType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rides">Rides</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="shifts">Shifts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {needsDateRange && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Date Range (max 30 days)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={setDefaultDates}
              >
                Last 7 days
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          onClick={handleExport}
          disabled={loading || (needsDateRange && (!startDate || !endDate))}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download Export
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
