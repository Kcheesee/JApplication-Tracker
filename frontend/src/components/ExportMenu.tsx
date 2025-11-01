import { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, Printer } from 'lucide-react';
import { Button } from './ui/button';
import { Job } from '../types/job';
import { exportToCSV, exportToJSON, printPDFReport } from '../utils/exportUtils';

interface ExportMenuProps {
  jobs: Job[];
}

export function ExportMenu({ jobs }: ExportMenuProps) {
  const [open, setOpen] = useState(false);

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        exportToCSV(jobs, `job-applications-${timestamp}.csv`);
        break;
      case 'json':
        exportToJSON(jobs, `job-applications-${timestamp}.json`);
        break;
      case 'pdf':
        printPDFReport(jobs);
        break;
    }

    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Export as CSV</div>
                  <div className="text-xs text-gray-500">Excel, Google Sheets</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FileJson className="h-4 w-4 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Export as JSON</div>
                  <div className="text-xs text-gray-500">Backup & Import</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Printer className="h-4 w-4 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium">Print PDF Report</div>
                  <div className="text-xs text-gray-500">Printable summary</div>
                </div>
              </button>

              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="px-3 py-2 text-xs text-gray-500">
                  {jobs.length} application{jobs.length !== 1 ? 's' : ''} will be exported
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
