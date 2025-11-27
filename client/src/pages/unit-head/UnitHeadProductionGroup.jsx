import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function UnitHeadProductionGroup() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // Fetch production groups for Unit Head view
    fetchProductionGroups();
  }, []);

  const fetchProductionGroups = async () => {
    try {
      // This will be replaced with actual API call
      const mockData = [
        {
          id: 1,
          name: 'Group A - Morning Shift',
          members: 8,
          leader: 'John Doe',
          status: 'active',
          shift: 'Morning',
          department: 'Assembly'
        },
        {
          id: 2,
          name: 'Group B - Evening Shift', 
          members: 6,
          leader: 'Jane Smith',
          status: 'active',
          shift: 'Evening',
          department: 'Packaging'
        },
        {
          id: 3,
          name: 'Group C - Night Shift',
          members: 5,
          leader: 'Mike Johnson',
          status: 'inactive',
          shift: 'Night',
          department: 'Quality Control'
        }
      ];
      setGroups(mockData);
    } catch (error) {
      console.error('Error fetching production groups:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unit Head - Production Groups</h1>
          <p className="text-gray-600">Monitor and manage all production groups in your unit</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create New Group
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.filter(g => g.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.reduce((sum, g) => sum + g.members, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shifts</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(groups.map(g => g.shift)).size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className={`${group.status === 'inactive' ? 'opacity-70' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{group.name}</CardTitle>
              <div className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${group.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{group.members} Members</div>
              <p className="text-xs text-muted-foreground">Led by {group.leader}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs"><span className="font-semibold">Shift:</span> {group.shift}</p>
                <p className="text-xs"><span className="font-semibold">Department:</span> {group.department}</p>
                <p className="text-xs"><span className="font-semibold">Status:</span> 
                  <span className={`ml-1 ${group.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                  </span>
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" title="View Details">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" title="Edit Group">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" title="Delete Group" className="hover:bg-red-50">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Group Card */}
      <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Plus className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Add New Production Group</h3>
          <p className="text-sm text-gray-500 text-center">Create a new production group to organize your workforce</p>
        </CardContent>
      </Card>
    </div>
  );
}