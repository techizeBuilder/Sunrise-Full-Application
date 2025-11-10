import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, BarChart3 } from 'lucide-react';
import { Link } from 'wouter';

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Link href="/orders">
            <Button className="w-full justify-center">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </Link>
          
          <Link href="/inventory">
            <Button variant="outline" className="w-full justify-center">
              <Package className="w-4 h-4 mr-2" />
              Add Inventory
            </Button>
          </Link>
          
          <Link href="/sales">
            <Button variant="outline" className="w-full justify-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
