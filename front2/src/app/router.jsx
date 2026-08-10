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
      <Route path="panel" element={<PanelPage />} />
      <Route path="cases" element={<CasesPage />} />
      <Route path="cases/:caseId" element={<CaseWorkspacePage />} />
      <Route path="cases/new" element={<NewCasePage />} />
      <Route path="agenda" element={<AgendaPage />} />
      <Route path="management" element={<Navigate to="/panel" replace />} />
      <Route path="management/clients" element={<ManagementClientsPage />} />
      <Route path="management/vehicles" element={<ManagementVehiclesPage />} />
      <Route path="management/referrers" element={<ManagementReferrersPage />} />
      <Route path="management/insurance" element={<ManagementInsurancePage />} />
      <Route path="management/providers" element={<ManagementProvidersPage />} />
      <Route path="management/organization" element={<ManagementPage />} />
      <Route path="management/settings" element={<Navigate to="/management/organization" replace />} />
    </Route>
  </Routes>
);
