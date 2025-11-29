import React from 'react';
import { Switch, Route, Redirect } from 'wouter';
import ProductionDashboard from '@/pages/production/ProductionDashboard';
import ProductionReports from '@/pages/production/ProductionReports';
import ProductionGroup from '@/pages/production/ProductionGroup';
import ProductionShift from '@/pages/production/ProductionShift';

export default function ProductionModule() {
  return (
    <Switch>
      <Route path="/production/dashboard">
        <ProductionDashboard />
      </Route>
      <Route path="/production/reports">
        <ProductionReports />
      </Route>
      <Route path="/production/production-group">
        <ProductionGroup />
      </Route>
      <Route path="/production/production-sheet">
        <ProductionShift />
      </Route>
      <Route path="/production">
        <Redirect to="/production/dashboard" />
      </Route>
      {/* Super Admin Production Routes */}
      <Route path="/super-admin/production/dashboard">
        <ProductionDashboard />
      </Route>
      <Route path="/super-admin/production/reports">
        <ProductionReports />
      </Route>
      <Route path="/super-admin/production/production-group">
        <ProductionGroup />
      </Route>
      <Route path="/super-admin/production/production-sheet">
        <ProductionShift />
      </Route>
      <Route path="/super-admin/production">
        <Redirect to="/super-admin/production/dashboard" />
      </Route>
      {/* Unit Head Production Routes */}
      <Route path="/unit-head/production/dashboard">
        <ProductionDashboard />
      </Route>
      <Route path="/unit-head/production/reports">
        <ProductionReports />
      </Route>
      <Route path="/unit-head/production/production-group">
        <ProductionGroup />
      </Route>
      <Route path="/unit-head/production/production-sheet">
        <ProductionShift />
      </Route>
      <Route path="/unit-head/production">
        <Redirect to="/unit-head/production/dashboard" />
      </Route>
    </Switch>
  );
}