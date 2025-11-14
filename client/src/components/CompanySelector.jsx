import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, Building2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

const CompanySelector = ({ 
  value, 
  onChange, 
  placeholder = "Select company...",
  className,
  disabled = false,
  filterByCity = '',
  filterByUnitName = '',
  multiple = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch companies for dropdown
  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['companies-dropdown', { search: searchTerm, city: filterByCity, unitName: filterByUnitName }],
    queryFn: () => api.getCompaniesDropdown({ 
      search: searchTerm,
      ...(filterByCity && { city: filterByCity }),
      ...(filterByUnitName && { unitName: filterByUnitName })
    }),
    enabled: open || searchTerm.length > 0,
  });

  const companies = companiesData?.companies || [];

  // Find selected company/companies
  const getSelectedCompany = (companyId) => {
    return companies.find(company => company.value === companyId);
  };

  const getSelectedCompanies = () => {
    if (!value) return [];
    if (multiple) {
      return Array.isArray(value) ? value.map(getSelectedCompany).filter(Boolean) : [];
    }
    const company = getSelectedCompany(value);
    return company ? [company] : [];
  };

  const selectedCompanies = getSelectedCompanies();

  const handleSelect = (companyValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(companyValue)
        ? currentValues.filter(v => v !== companyValue)
        : [...currentValues, companyValue];
      onChange?.(newValues);
    } else {
      onChange?.(companyValue === value ? '' : companyValue);
      setOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (selectedCompanies.length === 0) {
      return placeholder;
    }
    
    if (multiple) {
      if (selectedCompanies.length === 1) {
        return selectedCompanies[0].label;
      }
      return `${selectedCompanies.length} companies selected`;
    }
    
    return selectedCompanies[0].label;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center truncate">
            <Building2 className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{getDisplayValue()}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search companies..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading companies..." : "No companies found."}
            </CommandEmpty>
            <CommandGroup>
              {companies.map((company) => (
                <CommandItem
                  key={company.value}
                  value={company.value}
                  onSelect={() => handleSelect(company.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      (multiple 
                        ? Array.isArray(value) && value.includes(company.value)
                        : value === company.value
                      ) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <Building2 className="mr-2 h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{company.name}</span>
                      {company.companyType && (
                        <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-1 rounded">
                          {company.companyType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground ml-5">
                      <MapPin className="mr-1 h-3 w-3" />
                      <span>{company.city}</span>
                      {company.unitName && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{company.unitName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CompanySelector;