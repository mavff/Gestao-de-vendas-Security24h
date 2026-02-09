import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { KanbanPage } from '../../src/modules/kanban/KanbanPage';

export default function LeadsPage() {
  return <ProtectedRoute><KanbanPage /></ProtectedRoute>;
}
