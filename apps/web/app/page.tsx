import { ProtectedRoute } from '../src/components/layout/ProtectedRoute';
import { DashboardPage } from '../src/modules/dashboard/DashboardPage';

export default function Home() {
  return <ProtectedRoute><DashboardPage /></ProtectedRoute>;
}
