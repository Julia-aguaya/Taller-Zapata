import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/modules/auth/pages/login-page';
import { AppShell } from '@/app/shell/app-shell';
import { PanelPage } from '@/modules/panel/pages/panel-page';
import { CasesPage } from '@/modules/cases/pages/cases-page';
import { CaseWorkspacePage } from '@/modules/cases/pages/case-workspace-page';
import { NewCasePage } from '@/modules/cases/pages/new-case-page';
import { ManagementPage } from '@/modules/management/pages/management-page';
import { PlaceholderPage } from '@/shared/ui/placeholder-page';
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
      <Route path="agenda" element={<PlaceholderPage title="Agenda" description="La agenda de tareas va a mostrarse acá, consumiendo las operaciones del backend nuevo." />} />
      <Route path="management" element={<ManagementPage />} />
    </Route>
  </Routes>
);
