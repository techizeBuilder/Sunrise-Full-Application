import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Client-side Excel export utility
export class ClientExcelExporter {
  static exportToExcel(data, filename, sheetName = 'Sheet1') {
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Create worksheet from JSON data
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Set column widths based on content
      const columnWidths = [];
      if (data.length > 0) {
        Object.keys(data[0]).forEach(key => {
          const maxLength = Math.max(
            key.length,
            ...data.map(row => String(row[key] || '').length)
          );
          columnWidths.push({ wch: Math.min(maxLength + 2, 50) });
        });
        worksheet['!cols'] = columnWidths;
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });
      
      // Create blob and download
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      saveAs(blob, filename);
      
      return { success: true, message: 'Excel file exported successfully' };
    } catch (error) {
      console.error('Excel export error:', error);
      return { success: false, message: `Export failed: ${error.message}` };
    }
  }
  
  static exportInventoryItems(items) {
    const exportData = items.map((item, index) => ({
      'S.No': index + 1,
      'Item Code': item.code || '',
      'Item Name': item.name || '',
      'Description': item.description || '',
      'Type': item.type || '',
      'Category': item.category || '',
      'Sub Category': item.subCategory || '',
      'Customer Category': item.customerCategory || 'General',
      'Unit': item.unit || 'pieces',
      'Purchase Price': Number(item.purchasePrice || item.purchaseCost || 0),
      'Sale Price': Number(item.salePrice || 0),
      'MRP': Number(item.mrp || 0),
      'Current Stock': Number(item.qty || item.currentStock || 0),
      'Min Stock': Number(item.minStock || 0),
      'Max Stock': Number(item.maxStock || 0),
      'GST %': Number(item.gst || 0),
      'HSN Code': item.hsn || '',
      'Store Location': item.store || item.location || '',
      'Supplier': item.supplier || '',
      'Batch': item.batch || '',
      'Lead Time': Number(item.leadTime || 0),
      'Internal Manufacturing': item.internalManufacturing ? 'YES' : 'NO',
      'Purchase Allowed': item.purchase ? 'YES' : 'NO',
      'Active': item.isActive !== false ? 'YES' : 'NO',
      'Created Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
      'Updated Date': item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''
    }));
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `inventory_items_${timestamp}.xlsx`;
    
    return this.exportToExcel(exportData, filename, 'Inventory Items');
  }
  
  static exportCategories(categories) {
    const exportData = categories.map((category, index) => {
      const subcategories = Array.isArray(category.subcategories) 
        ? category.subcategories.filter(sub => sub && sub.trim()) 
        : [];
      
      return {
        'S.No': index + 1,
        'Category Name': category.name || '',
        'Description': category.description || '',
        'Subcategories': subcategories.length > 0 ? subcategories.join(', ') : 'None',
        'Total Subcategories': subcategories.length,
        'Active': category.isActive !== false ? 'YES' : 'NO',
        'Created Date': category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '',
        'Updated Date': category.updatedAt ? new Date(category.updatedAt).toLocaleDateString() : ''
      };
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `categories_${timestamp}.xlsx`;
    
    return this.exportToExcel(exportData, filename, 'Categories');
  }
  
  static exportCustomerCategories(customerCategories) {
    const exportData = customerCategories.map((category, index) => ({
      'S.No': index + 1,
      'Category Name': category.name || '',
      'Description': category.description || '',
      'Active': category.isActive !== false ? 'YES' : 'NO',
      'Created Date': category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '',
      'Updated Date': category.updatedAt ? new Date(category.updatedAt).toLocaleDateString() : ''
    }));
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `customer_categories_${timestamp}.xlsx`;
    
    return this.exportToExcel(exportData, filename, 'Customer Categories');
  }
  
  static exportCustomers(customers) {
    const exportData = customers.map((customer, index) => ({
      'S.No': index + 1,
      'Customer Name': customer.name || '',
      'Mobile': customer.mobile || '',
      'Email': customer.email || '',
      'Address': customer.address || '',
      'City': customer.city || '',
      'State': customer.state || '',
      'Country': customer.country || '',
      'GST Number': customer.gst || '',
      'Category': customer.category || '',
      'Active': customer.isActive !== false ? 'YES' : 'NO',
      'Created Date': customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '',
      'Updated Date': customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : ''
    }));
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `customers_${timestamp}.xlsx`;
    
    return this.exportToExcel(exportData, filename, 'Customers');
  }
  
  static exportSuppliers(suppliers) {
    const exportData = suppliers.map((supplier, index) => ({
      'S.No': index + 1,
      'Supplier Name': supplier.name || '',
      'Contact Person': supplier.contactPerson || '',
      'Mobile': supplier.mobile || '',
      'Email': supplier.email || '',
      'Address': supplier.address || '',
      'City': supplier.city || '',
      'State': supplier.state || '',
      'Country': supplier.country || '',
      'GST Number': supplier.gst || '',
      'Category': supplier.category || '',
      'Active': supplier.isActive !== false ? 'YES' : 'NO',
      'Created Date': supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : '',
      'Updated Date': supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleDateString() : ''
    }));
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `suppliers_${timestamp}.xlsx`;
    
    return this.exportToExcel(exportData, filename, 'Suppliers');
  }
}