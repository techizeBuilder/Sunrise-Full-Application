import { useQuery } from '@tanstack/react-query';

export function useSettings() {
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    settings: settingsData?.settings,
    isLoading,
    companyLogo: settingsData?.settings?.company?.logo,
    companyName: settingsData?.settings?.company?.name || 'ManuERP Industries'
  };
}