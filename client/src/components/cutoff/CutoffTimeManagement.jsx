import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getCutoffTime, setCutoffTime, toggleCutoffTime } from '@/services/api';
import { Clock, Settings, CheckCircle, XCircle, AlertTriangle, Save } from 'lucide-react';

const CutoffTimeManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    cutoffTime: '',
    description: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);

  // Fetch current cutoff time
  const { data: cutoffData, isLoading, error } = useQuery({
    queryKey: ['cutoff-time'],
    queryFn: getCutoffTime,
    refetchInterval: 30000 // Refetch every 30 seconds to keep status current
  });

  // Set form data when cutoff data is loaded
  useEffect(() => {
    if (cutoffData?.data) {
      setFormData({
        cutoffTime: cutoffData.data.cutoffTime || '',
        description: cutoffData.data.description || ''
      });
    }
  }, [cutoffData]);

  // Mutation for setting/updating cutoff time
  const setCutoffMutation = useMutation({
    mutationFn: setCutoffTime,
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Cutoff time updated successfully",
        variant: "default"
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['cutoff-time'] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update cutoff time",
        variant: "destructive" 
      });
    }
  });

  // Mutation for toggling cutoff time status
  const toggleMutation = useMutation({
    mutationFn: toggleCutoffTime,
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Cutoff time status updated successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['cutoff-time'] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to toggle cutoff time",
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.cutoffTime) {
      toast({ 
        title: "Validation Error", 
        description: "Cutoff time is required",
        variant: "destructive" 
      });
      return;
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.cutoffTime)) {
      toast({ 
        title: "Validation Error", 
        description: "Please enter time in HH:MM format (e.g., 15:00)",
        variant: "destructive" 
      });
      return;
    }

    // Map the form data to the expected API format
    const apiData = {
      time: formData.cutoffTime,
      description: formData.description
    };

    setCutoffMutation.mutate(apiData);
  };

  const handleToggle = (isActive) => {
    toggleMutation.mutate(isActive);
  };

  const handleCancel = () => {
    // Reset form to original values
    if (cutoffData?.data) {
      setFormData({
        cutoffTime: cutoffData.data.cutoffTime || '',
        description: cutoffData.data.description || ''
      });
    }
    setIsEditing(false);
  };

  // Get current time for display
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Format cutoff time for display
  const formatCutoffTime = (timeString) => {
    if (!timeString) return 'Not set';
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const cutoffInfo = cutoffData?.data;
  const currentStatus = cutoffInfo?.currentStatus;
  const hasExistingCutoff = !!cutoffInfo;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading cutoff time settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Error Loading Cutoff Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load cutoff time settings: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Cutoff Time Status
          </CardTitle>
          <CardDescription>
            Current time: {getCurrentTime()} | 
            Cutoff time: {formatCutoffTime(cutoffInfo?.cutoffTime)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStatus?.allowed ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <p className="font-medium">
                  {currentStatus?.allowed ? 'Orders Allowed' : 'Orders Blocked'}
                </p>
                <p className="text-sm text-gray-600">
                  {currentStatus?.message || 'No cutoff restrictions'}
                </p>
              </div>
            </div>
            <Badge variant={currentStatus?.allowed ? 'default' : 'destructive'}>
              {currentStatus?.allowed ? 'OPEN' : 'CLOSED'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cutoff Time Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cutoff Time Configuration
          </CardTitle>
          <CardDescription>
            Set a daily cutoff time to control when sales persons can place or edit orders
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Active/Inactive Toggle */}
            {hasExistingCutoff && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-medium">Cutoff Time Active</Label>
                  <p className="text-sm text-gray-600">
                    Enable or disable cutoff time restrictions
                  </p>
                </div>
                <Switch
                  checked={cutoffInfo?.isActive || false}
                  onCheckedChange={handleToggle}
                  disabled={toggleMutation.isPending}
                />
              </div>
            )}

            {/* Time Input */}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="cutoffTime">Cutoff Time *</Label>
              <Input
                id="cutoffTime"
                type="time"
                value={formData.cutoffTime}
                onChange={(e) => setFormData({ ...formData, cutoffTime: e.target.value })}
                disabled={!isEditing && hasExistingCutoff}
                placeholder="15:00"
                required
              />
              <p className="text-xs text-gray-500">
                Orders will be blocked after this time each day (24-hour format)
              </p>
            </div>

            {/* Description */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!isEditing && hasExistingCutoff}
                placeholder="e.g., Daily order submission deadline"
                rows={3}
              />
            </div>

            {/* Information */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Sales persons can place and edit orders only before the cutoff time</li>
                <li>• After cutoff time, order creation/editing buttons will be disabled</li>
                <li>• Unit heads and managers are not affected by cutoff restrictions</li>
                <li>• The cutoff time resets daily at midnight</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            {!hasExistingCutoff || isEditing ? (
              <>
                <Button 
                  type="submit" 
                  disabled={setCutoffMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {setCutoffMutation.isPending ? 'Saving...' : 'Save Cutoff Time'}
                </Button>
                {isEditing && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                )}
              </>
            ) : (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit Settings
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CutoffTimeManagement;