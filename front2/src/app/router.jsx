import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/modules/auth/pages/login-page';
import { AppShell } from '@/app/shell/app-shell';
import { PanelPage } from '@/modules/panel/pages/panel-page';
import { AgendaPage } from '@/modules/agenda/pages/agenda-page';
import { CasesPage } from '@/modules/cases/pages/cases-page';
import { CaseWorkspacePage } from '@/modules/cases/pages/case-workspace-page';
import { NewCasePage } from '@/modules/cases/pages/new-case-page';
import { ManagementPage } from '@/modules/management/pages/management-page';
import { ManagementClientsPage } from '@/modules/management/pages/management-clients-page';
import { ManagementVehiclesPage } from '@/modules/management/pages/management-vehicles-page';
import { ManagementReferrersPage } from '@/modules/management/pages/management-referrers-page';
import { ManagementInsurancePage } from '@/modules/management/pages/management-insurance-page';
import { ManagementProvidersPage } from '@/modules/management/pages/management-providers-page';
import { AuthGate } from '@/modules/auth/components/auth-gate';
import { AuthorizationGate } from '@/modules/auth/components/authorization-gate';

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/"
      element={(
        <AuthGate>
          <AppShell />
        </AuthGate>
      )}
    >
      <Route index element={<Navigate to="/panel" replace />} />
      <Route path="panel" element={<AuthorizationGate navigationCode="PANEL"><PanelPage /></AuthorizationGate>} />
      <Route path="cases" element={<AuthorizationGate navigationCode="CASES"><CasesPage /></AuthorizationGate>} />
      <Route path="cases/:caseId" element={<AuthorizationGate navigationCode="CASES"><CaseWorkspacePage /></AuthorizationGate>} />
      <Route path="cases/new" element={<AuthorizationGate navigationCode="NEW_CASE"><NewCasePage /></AuthorizationGate>} />
      <Route path="agenda" element={<AuthorizationGate navigationCode="AGENDA"><AgendaPage /></AuthorizationGate>} />
      <Route path="management" element={<AuthorizationGate navigationCode="MANAGEMENT"><Navigate to="/management/organization" replace /></AuthorizationGate>} />
      <Route path="management/clients" element={<AuthorizationGate navigationCode="MANAGEMENT"><ManagementClientsPage /></AuthorizationGate>} />
      <Route path="management/vehicles" element={<AuthorizationGate navigationCode="MANAGEMENT"><ManagementVehiclesPage /></AuthorizationGate>} />
      <Route path="management/referrers" element={<AuthorizationGate navigationCode="MANAGEMENT"><ManagementReferrersPage /></AuthorizationGate>} />
      <Route path="management/insurance" element={<AuthorizationGate navigationCode="MANAGEMENT"><ManagementInsurancePage /></AuthorizationGate>} />
      <Route path="management/providers" element={<AuthorizationGate navigationCode="MANAGEMENT"><ManagementProvidersPage /></AuthorizationGate>} />
      <Route path="management/organization" element={<AuthorizationGate navigationCode="MANAGEMENT"><ManagementPage /></AuthorizationGate>} />
      <Route path="management/settings" element={<AuthorizationGate navigationCode="MANAGEMENT"><Navigate to="/management/organization" replace /></AuthorizationGate>} />
    </Route>
  </Routes>
);
