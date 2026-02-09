import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { KitsPage } from '../../src/modules/kits/KitsPage';

export default function Page() {
  return <ProtectedRoute><KitsPage /></ProtectedRoute>;
}
