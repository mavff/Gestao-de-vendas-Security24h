import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { ComissoesPage } from '../../src/modules/comissoes/ComissoesPage';

export default function Page() {
  return <ProtectedRoute><ComissoesPage /></ProtectedRoute>;
}
