import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Users, Package, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function UnitManagerProductionGroup() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [groups, setGroups] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedItems: []
  });

  useEffect(() => {
    fetchGroups(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  useEffect(() => {
    if (showCreateModal || showEditModal) {
      fetchAvailableItems(itemSearchTerm, showEditModal ? selectedGroup?._id : null);
    }
  }, [showCreateModal, showEditModal, itemSearchTerm]);

  // Fetch production groups
  const fetchGroups = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/unit-manager/production-groups?page=${page}&search=${search}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setGroups(data.data.groups);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch groups",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch production groups",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch available items for assignment
  const fetchAvailableItems = async (search = '', excludeGroupId = null) => {
    try {
      let url = `/api/unit-manager/production-groups/items/available?search=${search}`;
      if (excludeGroupId) {
        url += `&excludeGroupId=${excludeGroupId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAvailableItems(data.data.items || []);
      } else {
        console.error('Failed to fetch available items:', data.message);
      }
    } catch (error) {
      console.error('Error fetching available items:', error);
    }
  };

  // Handle item selection
  const handleItemSelection = (itemId, checked) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: checked 
        ? [...prev.selectedItems, itemId]
        : prev.selectedItems.filter(id => id !== itemId)
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      selectedItems: []
    });
    setItemSearchTerm('');
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/unit-manager/production-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          items: formData.selectedItems
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Production group created successfully",
        });
        setShowCreateModal(false);
        resetForm();
        fetchGroups(currentPage, searchTerm);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create group",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create production group",
        variant: "destructive"
      });
    }
  };

  // Update group
  const handleUpdateGroup = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/unit-manager/production-groups/${selectedGroup._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          items: formData.selectedItems
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Production group updated successfully",
        });
        setShowEditModal(false);
        resetForm();
        fetchGroups(currentPage, searchTerm);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update group",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: "Error",
        description: "Failed to update production group",
        variant: "destructive"
      });
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this production group?')) {
      return;
    }

    try {
      const response = await fetch(`/api/unit-manager/production-groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Production group deleted successfully",
        });
        fetchGroups(currentPage, searchTerm);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete group",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete production group",
        variant: "destructive"
      });
    }
  };

  // View group details
  const handleViewGroup = async (groupId) => {
    try {
      const response = await fetch(`/api/unit-manager/production-groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedGroup(data.data);
        setShowViewModal(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch group details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      toast({
        title: "Error",
        description: "Failed to fetch group details",
        variant: "destructive"
      });
    }
  };

  // Edit group
  const handleEditGroup = async (groupId) => {
    try {
      const response = await fetch(`/api/unit-manager/production-groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedGroup(data.data);
        setFormData({
          name: data.data.name,
          description: data.data.description || '',
          selectedItems: data.data.items.map(item => item._id)
        });
        setShowEditModal(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch group details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      toast({
        title: "Error",
        description: "Failed to fetch group details",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Production Groups</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage production groups and assign inventory items</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            Production Groups ({groups.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No production groups found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Group Name</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[150px]">Description</TableHead>
                    <TableHead className="min-w-[100px]">Items Count</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[120px]">Created By</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[120px]">Created Date</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="text-right min-w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group._id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {group.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {group.metadata?.totalItems || 0} items
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {group.createdBy?.username || 'Unknown'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Date(group.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={group.isActive ? "default" : "secondary"} className="text-xs">
                          {group.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewGroup(group._id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditGroup(group._id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteGroup(group._id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm sm:text-base">Page {currentPage} of {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-full sm:w-auto"
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">Create New Production Group</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Group Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter group name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter group description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Assign Items</Label>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Input
                  placeholder="Search items..."
                  value={itemSearchTerm}
                  onChange={(e) => setItemSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => fetchAvailableItems(itemSearchTerm)} className="w-full sm:w-auto">
                  Search
                </Button>
              </div>
              
              <ScrollArea className="h-48 sm:h-64 border rounded-md p-3 sm:p-4 mt-2">
                {availableItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm">No items found.</p>
                ) : (
                  availableItems.map((item) => (
                    <div key={item._id} className="flex items-center space-x-2 sm:space-x-3 mb-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        checked={formData.selectedItems.includes(item._id)}
                        onCheckedChange={(checked) => handleItemSelection(item._id, checked)}
                      />
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-gray-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm sm:text-base">{item.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {item.code} | {item.category}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} className="w-full sm:w-auto">Create Group</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">Edit Production Group</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName" className="text-sm font-medium">Group Name *</Label>
                <Input
                  id="editName"
                  placeholder="Enter group name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="editDescription" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="editDescription"
                  placeholder="Enter group description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Manage Items</Label>
              
              <ScrollArea className="h-48 sm:h-64 border rounded-md p-3 sm:p-4 mt-2">
                {/* Currently Assigned Items */}
                {selectedGroup?.items?.length > 0 && (
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-blue-600 mb-2">Currently Assigned Items:</div>
                    {selectedGroup.items.map((item) => (
                      <div key={`current-${item._id}`} className="flex items-center space-x-2 sm:space-x-3 mb-2 bg-blue-50 p-2 rounded">
                        <Checkbox
                          checked={formData.selectedItems.includes(item._id)}
                          onCheckedChange={(checked) => handleItemSelection(item._id, checked)}
                        />
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm sm:text-base">{item.name}</div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {item.code} | {item.category}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Available Items */}
                {availableItems.length > 0 && (
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-green-600 mb-2 mt-4">Available Items:</div>
                    {availableItems.map((item) => (
                      <div key={item._id} className="flex items-center space-x-2 sm:space-x-3 mb-2 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          checked={formData.selectedItems.includes(item._id)}
                          onCheckedChange={(checked) => handleItemSelection(item._id, checked)}
                        />
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm sm:text-base">{item.name}</div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {item.code} | {item.category}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleUpdateGroup} className="w-full sm:w-auto">Update Group</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">Production Group Details</DialogTitle>
          </DialogHeader>
          
          {selectedGroup && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-500">Group Name</Label>
                  <p className="text-base sm:text-lg font-semibold">{selectedGroup.name}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedGroup.isActive ? "default" : "secondary"} className="text-xs">
                      {selectedGroup.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-500">Description</Label>
                <p className="text-sm sm:text-base mt-1">{selectedGroup.description || "No description provided"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Assigned Items ({selectedGroup.items?.length || 0})</Label>
                <ScrollArea className="h-48 sm:h-64 border rounded-md p-3 sm:p-4 mt-2">
                  {selectedGroup.items?.length > 0 ? (
                    selectedGroup.items.map((item) => (
                      <div key={item._id} className="flex items-center space-x-3 mb-3 p-2 sm:p-3 border rounded">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-gray-100 flex items-center justify-center">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm sm:text-base">{item.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            Code: {item.code} | Category: {item.category}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            Quantity: {item.qty} {item.unit}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center text-sm py-4">No items assigned</p>
                  )}
                </ScrollArea>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setShowViewModal(false)} className="w-full sm:w-auto">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}