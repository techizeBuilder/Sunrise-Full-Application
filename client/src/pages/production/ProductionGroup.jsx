import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductionGroup() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Group</h1>
          <p className="text-gray-600">Manage production groups and teams</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group A - Morning Shift</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 Members</div>
            <p className="text-xs text-muted-foreground">Led by John Doe</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm">
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group B - Evening Shift</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6 Members</div>
            <p className="text-xs text-muted-foreground">Led by Jane Smith</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm">
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group C - Night Shift</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 Members</div>
            <p className="text-xs text-muted-foreground">Led by Mike Johnson</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm">
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}