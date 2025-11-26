import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProductionShift() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Shift</h1>
          <p className="text-gray-600">Manage production shifts and schedules</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Shift
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Morning Shift</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6:00 AM - 2:00 PM</div>
            <div className="flex items-center gap-2 mt-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">15 Workers</span>
              <Badge className="bg-green-100 text-green-800 ml-auto">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Supervisor: John Doe
            </p>
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
            <CardTitle className="text-sm font-medium">Evening Shift</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2:00 PM - 10:00 PM</div>
            <div className="flex items-center gap-2 mt-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">12 Workers</span>
              <Badge variant="secondary" className="ml-auto">Scheduled</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Supervisor: Jane Smith
            </p>
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
            <CardTitle className="text-sm font-medium">Night Shift</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10:00 PM - 6:00 AM</div>
            <div className="flex items-center gap-2 mt-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">8 Workers</span>
              <Badge variant="outline" className="ml-auto">Inactive</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Supervisor: Mike Johnson
            </p>
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