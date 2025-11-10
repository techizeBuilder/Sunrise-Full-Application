import React from 'react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * ActionButton component that respects user permissions
 * Only renders if user has permission for the specified action
 */
export const ActionButton = ({ 
  module, 
  feature, 
  action, 
  children, 
  disabled = false,
  ...buttonProps 
}) => {
  const { canPerformAction } = usePermissions();

  // Check if user has permission for this action
  const hasPermission = canPerformAction(module, feature, action);

  // Don't render if no permission
  if (!hasPermission) {
    return null;
  }

  return (
    <Button 
      disabled={disabled} 
      {...buttonProps}
    >
      {children}
    </Button>
  );
};

/**
 * Hook to check permissions for components
 */
export const useActionPermissions = (module, feature) => {
  const { canPerformAction } = usePermissions();

  return {
    canView: canPerformAction(module, feature, 'view'),
    canAdd: canPerformAction(module, feature, 'add'),
    canEdit: canPerformAction(module, feature, 'edit'),
    canDelete: canPerformAction(module, feature, 'delete'),
    canAlter: canPerformAction(module, feature, 'alter')
  };
};

export default ActionButton;