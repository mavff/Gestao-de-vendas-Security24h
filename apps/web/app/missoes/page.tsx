import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { MissionsPage } from '../../src/modules/missions/MissionsPage';

export default function Page() {
  return <ProtectedRoute><MissionsPage /></ProtectedRoute>;
}
