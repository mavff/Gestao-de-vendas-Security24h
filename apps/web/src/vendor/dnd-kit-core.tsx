'use client';
import { createContext, useContext } from 'react';

type DragEndEvent = { active: { id: string | number }; over: { id: string | number } | null };
const Ctx = createContext<{ onDragEnd?: (event: DragEndEvent) => void; setOver: (id: string | number | null) => void; over: string | number | null }>({ setOver: () => {}, over: null });
let activeId: string | number | null = null;

export function DndContext({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (event: DragEndEvent) => void }) {
  return <Ctx.Provider value={{ onDragEnd, over: null, setOver: () => {} }}>{children}</Ctx.Provider>;
}

export type { DragEndEvent };

export function useDroppable({ id }: { id: string | number }) {
  const ctx = useContext(Ctx);
  return {
    setNodeRef: (node: HTMLElement | null) => {
      if (!node) return;
      node.ondragover = (e) => { e.preventDefault(); };
      node.ondrop = (e) => {
        e.preventDefault();
        if (!activeId) return;
        ctx.onDragEnd?.({ active: { id: activeId }, over: { id } });
        activeId = null;
      };
    },
    isOver: false,
  };
}

export function useDraggable({ id }: { id: string | number }) {
  return {
    attributes: { draggable: true },
    listeners: {
      onDragStart: () => { activeId = id; },
      onDragEnd: () => { activeId = null; },
    },
    setNodeRef: () => {},
    transform: null,
  };
}
