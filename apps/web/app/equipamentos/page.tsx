import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { EquipmentPage } from '../../src/modules/equipment/EquipmentPage';

export default function Page() {
  return <ProtectedRoute><EquipmentPage /></ProtectedRoute>;
}
