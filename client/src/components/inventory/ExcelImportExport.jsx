import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { ClientExcelExporter } from '@/utils/excelExport';

export default function ExcelImportExport({ type = 'items' }) {
  const [importOpen, setImportOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const getTypeConfig = () => {
    switch (type) {
      case 'categories':
        return {
          title: 'Categories',
          importFn: null, // Categories import not implemented yet
          queryKey: '/api/categories'
        };
      case 'customer-categories':
        return {
          title: 'Customer Categories',
          importFn: null, // Customer categories import not implemented yet
          queryKey: '/api/customer-categories'
        };
      case 'customers':
        return {
          title: 'Customers',
          importFn: api.importCustomersFromExcel.bind(api),
          queryKey: '/api/customers'
        };
      case 'suppliers':
        return {
          title: 'Suppliers',
          importFn: api.importSuppliersFromExcel.bind(api),
          queryKey: '/api/suppliers'
        };
      default:
        return {
          title: 'Inventory Items',
          importFn: api.importItemsFromExcel.bind(api),
          queryKey: '/api/items'
        };
    }
  };

  const config = getTypeConfig();

  const handleExport = async () => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching data and generating Excel file...",
      });
      
      let data = [];
      let exportResult;
      
      // Get fresh data for export
      switch (type) {
        case 'categories':
          const categoriesResponse = await api.getCategories();
          data = categoriesResponse.categories || [];
          exportResult = ClientExcelExporter.exportCategories(data);
          break;
        case 'customer-categories':
          const customerCategoriesResponse = await api.getCustomerCategories();
          data = customerCategoriesResponse.customerCategories || [];
          exportResult = ClientExcelExporter.exportCustomerCategories(data);
          break;
        case 'customers':
          const customersResponse = await api.getCustomers();
          data = customersResponse.customers || [];
          exportResult = ClientExcelExporter.exportCustomers(data);
          break;
        case 'suppliers':
          const suppliersResponse = await api.getSuppliers();
          data = suppliersResponse.suppliers || [];
          exportResult = ClientExcelExporter.exportSuppliers(data);
          break;
        default:
          const itemsResponse = await api.getItems();
          data = itemsResponse.items || [];
          exportResult = ClientExcelExporter.exportInventoryItems(data);
          break;
      }
      
      if (exportResult.success) {
        toast({
          title: "Export Successful",
          description: `${config.title} exported successfully with ${data.length} records.`,
        });
      } else {
        toast({
          title: "Export Failed",
          description: exportResult.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImport(file);
    }
  };

  const handleImport = async (file) => {
    if (!config.importFn) {
      toast({
        title: "Import Not Available",
        description: `Import functionality for ${config.title} is not yet implemented`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setImportResult(null);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await config.importFn(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      console.log('Import result:', result);
      setImportResult(result);

      // Refresh the data if successful
      if (result.success) {
        queryClient.invalidateQueries([config.queryKey]);
        queryClient.invalidateQueries(['/api/inventory/stats']);

        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.results?.successful || 0} records`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.message || "Import failed",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: error.message || 'Import failed',
        results: null
      });
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetImport = () => {
    setImportResult(null);
    setUploadProgress(0);
    setUploading(false);
  };

  const downloadTemplate = async () => {
    try {
      // Create template data with sample/empty rows
      let templateData = [];
      
      switch (type) {
        case 'categories':
          templateData = [{
            'S.No': 1,
            'Category Name': 'Sample Category',
            'Description': 'Sample description',
            'Subcategories': 'Sub1, Sub2, Sub3',
            'Total Subcategories': 3,
            'Active': 'YES',
            'Created Date': '',
            'Updated Date': ''
          }];
          ClientExcelExporter.exportCategories(templateData);
          break;
        case 'customer-categories':
          templateData = [{
            'S.No': 1,
            'Category Name': 'Sample Customer Category',
            'Description': 'Sample description',
            'Active': 'YES',
            'Created Date': '',
            'Updated Date': ''
          }];
          ClientExcelExporter.exportCustomerCategories(templateData);
          break;
        case 'customers':
          templateData = [{
            'S.No': 1,
            'Customer Name': 'Sample Customer',
            'Mobile': '1234567890',
            'Email': 'customer@example.com',
            'Address': 'Sample Address',
            'City': 'Sample City',
            'State': 'Sample State',
            'Country': 'Sample Country',
            'GST Number': 'SAMPLE123456789',
            'Category': 'General',
            'Active': 'YES',
            'Created Date': '',
            'Updated Date': ''
          }];
          ClientExcelExporter.exportCustomers(templateData);
          break;
        case 'suppliers':
          templateData = [{
            'S.No': 1,
            'Supplier Name': 'Sample Supplier',
            'Contact Person': 'John Doe',
            'Mobile': '1234567890',
            'Email': 'supplier@example.com',
            'Address': 'Sample Address',
            'City': 'Sample City',
            'State': 'Sample State',
            'Country': 'Sample Country',
            'GST Number': 'SAMPLE123456789',
            'Category': 'General',
            'Active': 'YES',
            'Created Date': '',
            'Updated Date': ''
          }];
          ClientExcelExporter.exportSuppliers(templateData);
          break;
        default:
          templateData = [{
            'S.No': 1,
            'Item Code': 'ITEM001',
            'Item Name': 'Sample Item',
            'Description': 'Sample description',
            'Type': 'Product',
            'Category': 'Sample Category',
            'Sub Category': 'Sample Sub',
            'Customer Category': 'General',
            'Unit': 'pieces',
            'Purchase Price': 100,
            'Sale Price': 150,
            'MRP': 200,
            'Current Stock': 50,
            'Min Stock': 10,
            'Max Stock': 100,
            'GST %': 18,
            'HSN Code': '12345678',
            'Store Location': 'Warehouse A',
            'Supplier': 'Sample Supplier',
            'Batch': 'BATCH001',
            'Lead Time': 5,
            'Internal Manufacturing': 'NO',
            'Purchase Allowed': 'YES',
            'Active': 'YES',
            'Created Date': '',
            'Updated Date': ''
          }];
          ClientExcelExporter.exportInventoryItems(templateData);
          break;
      }
      
      toast({
        title: "Template Downloaded",
        description: `${config.title} template downloaded successfully`,
      });
    } catch (error) {
      console.error('Template download error:', error);
      toast({
        title: "Template Download Failed", 
        description: error.message || "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const oldDownloadTemplate = () => {
    // Create a sample template based on type
    let templateData = [];
    
    if (type === 'items') {
      templateData = [{
        'Item Code': 'SAMPLE-001',
        'Item Name': 'Sample Item',
        'Category': 'Electronics',
        'Subcategory': 'Phones',
        'Customer Category': 'Retail',
        'Unit Price': 100.00,
        'Cost Price': 80.00,
        'Quantity': 50,
        'Min Stock': 10,
        'Max Stock': 100,
        'Location': 'Warehouse A',
        'Description': 'Sample item description'
      }];
    } else if (type === 'categories') {
      templateData = [{
        'Category Name': 'Electronics',
        'Description': 'Electronic items and devices',
        'Subcategories': 'Phones, Laptops, Tablets'
      }];
    } else if (type === 'customers') {
      templateData = [{
        'Customer Name': 'John Doe',
        'Email': 'john@example.com',
        'Phone': '+1234567890',
        'Company': 'ABC Corp',
        'Address': '123 Main St',
        'City': 'New York',
        'State': 'NY',
        'Country': 'USA',
        'Postal Code': '10001',
        'Status': 'active',
        'Customer Type': 'retail'
      }];
    } else if (type === 'suppliers') {
      templateData = [{
        'Supplier Name': 'ABC Supplies',
        'Contact Person': 'Jane Smith',
        'Email': 'jane@abcsupplies.com',
        'Phone': '+1234567890',
        'Company': 'ABC Supplies Inc',
        'Address': '456 Business Ave',
        'City': 'Chicago',
        'State': 'IL',
        'Country': 'USA',
        'Postal Code': '60601',
        'Tax ID': 'TAX123456',
        'Payment Terms': '30 days',
        'Status': 'active'
      }];
    } else {
      templateData = [{
        'Category Name': 'Retail',
        'Description': 'Retail customers'
      }];
    }

    // Convert to CSV for simple download
    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(','),
      templateData.map(row => headers.map(header => `"${row[header]}"`).join(',')).join('\n')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Template Downloaded",
      description: `${config.title} template downloaded successfully`,
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Export Button */}
      <Button
        onClick={handleExport}
        variant="outline"
        size="sm"
        className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 text-green-700 dark:text-green-300"
      >
        <Download className="h-4 w-4 mr-2" />
        Export Excel
      </Button>

      {/* Template Download Button */}
      <Button
        onClick={downloadTemplate}
        variant="outline"
        size="sm"
        className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 text-amber-700 dark:text-amber-300"
      >
        <FileText className="h-4 w-4 mr-2" />
        Template
      </Button>

      {/* Import Button - Only show if import is available */}
      {config.importFn && (
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 text-blue-700 dark:text-blue-300"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                Import {config.title} from Excel
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {!importResult && !uploading && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Upload an Excel file (.xlsx or .xls) containing {config.title.toLowerCase()} data. 
                      Download the template below to see the required format and column headers.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-center">
                    <Button
                      onClick={downloadTemplate}
                      variant="outline"
                      size="sm"
                      className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="h-12 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      variant="outline"
                    >
                      <FileSpreadsheet className="h-5 w-5 mr-2" />
                      Choose Excel File
                    </Button>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Uploading and processing file...
                    </p>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                </div>
              )}

              {importResult && (
                <div className="space-y-4">
                  <Alert className={importResult.success ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"}>
                    {importResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {importResult.message}
                    </AlertDescription>
                  </Alert>

                  {importResult.results && (
                    <div className="bg-muted p-3 rounded-lg space-y-2">
                      <div className="text-sm font-medium">Import Summary:</div>
                      <div className="text-sm space-y-1">
                        <div>Total records: {importResult.results.total}</div>
                        <div className="text-green-600">Successful: {importResult.results.successful}</div>
                        {importResult.results.failed > 0 && (
                          <div className="text-red-600">Failed: {importResult.results.failed}</div>
                        )}
                      </div>
                      
                      {importResult.results.errors && importResult.results.errors.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-red-600 mb-1">Errors:</div>
                          <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                            {importResult.results.errors.slice(0, 10).map((error, index) => (
                              <div key={index} className="text-red-600">{error}</div>
                            ))}
                            {importResult.results.errors.length > 10 && (
                              <div className="text-muted-foreground">...and {importResult.results.errors.length - 10} more errors</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button onClick={resetImport} variant="outline" size="sm">
                      Import Another File
                    </Button>
                    <Button onClick={() => setImportOpen(false)} size="sm">
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}