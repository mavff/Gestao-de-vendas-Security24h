import { ProtectedRoute } from '../../../src/components/layout/ProtectedRoute';
import { VendaPage } from '../../../src/modules/venda/VendaPage';

export default function Page() {
  return <ProtectedRoute><VendaPage /></ProtectedRoute>;
}
