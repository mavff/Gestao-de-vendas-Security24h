import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { SdrPage } from '../../src/modules/sdr/SdrPage';

export default function Page() {
  return <ProtectedRoute><SdrPage /></ProtectedRoute>;
}
