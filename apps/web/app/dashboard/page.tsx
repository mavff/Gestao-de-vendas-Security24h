import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { DashboardPage } from '../../src/modules/dashboard/DashboardPage';

export default function Page() {
  return <ProtectedRoute><DashboardPage /></ProtectedRoute>;
}
