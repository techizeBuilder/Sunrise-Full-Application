import React from 'react';
import { Switch, Route, Redirect } from 'wouter';
import ProductionDashboard from '@/pages/production/ProductionDashboard';
import BatchPlanning from '@/pages/production/BatchPlanning';
import ProductionExecution from '@/pages/production/ProductionExecution';
import BatchProductionRegister from '@/pages/production/BatchProductionRegister';
import ProductionVerification from '@/pages/production/ProductionVerification';
import ProductionReports from '@/pages/production/ProductionReports';

export default function ProductionModule() {
  return (
    <Switch>
      <Route path="/production/dashboard">
        <ProductionDashboard />
      </Route>
      <Route path="/production/batch-planning">
        <BatchPlanning />
      </Route>
      <Route path="/production/execution">
        <ProductionExecution />
      </Route>
      <Route path="/production/register">
        <BatchProductionRegister />
      </Route>
      <Route path="/production/verification">
        <ProductionVerification />
      </Route>
      <Route path="/production/reports">
        <ProductionReports />
      </Route>
      <Route path="/production">
        <Redirect to="/production/dashboard" />
      </Route>
      {/* Super Admin Production Routes */}
      <Route path="/super-admin/production/dashboard">
        <ProductionDashboard />
      </Route>
      <Route path="/super-admin/production/batch-planning">
        <BatchPlanning />
      </Route>
      <Route path="/super-admin/production/execution">
        <ProductionExecution />
      </Route>
      <Route path="/super-admin/production/register">
        <BatchProductionRegister />
      </Route>
      <Route path="/super-admin/production/verification">
        <ProductionVerification />
      </Route>
      <Route path="/super-admin/production/reports">
        <ProductionReports />
      </Route>
      <Route path="/super-admin/production">
        <Redirect to="/super-admin/production/dashboard" />
      </Route>
      {/* Unit Head Production Routes */}
      <Route path="/unit-head/production/dashboard">
        <ProductionDashboard />
      </Route>
      <Route path="/unit-head/production/batch-planning">
        <BatchPlanning />
      </Route>
      <Route path="/unit-head/production/execution">
        <ProductionExecution />
      </Route>
      <Route path="/unit-head/production/register">
        <BatchProductionRegister />
      </Route>
      <Route path="/unit-head/production/verification">
        <ProductionVerification />
      </Route>
      <Route path="/unit-head/production/reports">
        <ProductionReports />
      </Route>
      <Route path="/unit-head/production">
        <Redirect to="/unit-head/production/dashboard" />
      </Route>
    </Switch>
  );
}