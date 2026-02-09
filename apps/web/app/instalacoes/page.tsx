import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { InstallationsPage } from '../../src/modules/installations/InstallationsPage';

export default function Page() {
  return <ProtectedRoute><InstallationsPage /></ProtectedRoute>;
}
