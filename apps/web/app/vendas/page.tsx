import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { VendasListPage } from '../../src/modules/vendas/VendasListPage';

export default function Page() {
  return <ProtectedRoute><VendasListPage /></ProtectedRoute>;
}
