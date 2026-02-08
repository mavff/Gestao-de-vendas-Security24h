'use client';
import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type DragEndEvent = { active: { id: string | number }; over: { id: string | number } | null };

type DndCtx = {
  onDragEnd?: (event: DragEndEvent) => void;
  activeId: string | number | null;
  overId: string | number | null;
  setActiveId: (id: string | number | null) => void;
  setOverId: (id: string | number | null) => void;
};

const Ctx = createContext<DndCtx>({
  activeId: null,
  overId: null,
  setActiveId: () => {},
  setOverId: () => {},
});

export function DndContext({
  children,
  onDragEnd,
}: {
  children: ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
}) {
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [overId, setOverId] = useState<string | number | null>(null);

  return (
    <Ctx.Provider value={{ onDragEnd, activeId, overId, setActiveId, setOverId }}>
      {children}
    </Ctx.Provider>
  );
}

export type { DragEndEvent };

export function useDroppable({ id }: { id: string | number }) {
  const ctx = useContext(Ctx);

  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;
      node.ondragover = (e) => {
        e.preventDefault();
        ctx.setOverId(id);
      };
      node.ondragleave = () => {
        if (ctx.overId === id) ctx.setOverId(null);
      };
      node.ondrop = (e) => {
        e.preventDefault();
        ctx.setOverId(null);
        if (ctx.activeId == null) return;
        ctx.onDragEnd?.({ active: { id: ctx.activeId }, over: { id } });
        ctx.setActiveId(null);
      };
    },
    [ctx, id],
  );

  return {
    setNodeRef,
    isOver: ctx.overId === id,
  };
}

export function useDraggable({ id }: { id: string | number }) {
  const ctx = useContext(Ctx);

  return {
    attributes: { draggable: true },
    listeners: {
      onDragStart: () => {
        ctx.setActiveId(id);
      },
      onDragEnd: () => {
        ctx.setActiveId(null);
        ctx.setOverId(null);
      },
    },
    setNodeRef: (_node: HTMLElement | null) => {},
    transform: null as { x: number; y: number } | null,
  };
}
