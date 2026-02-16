'use client';
import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';

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

export function useDraggable({ id, disabled }: { id: string | number; disabled?: boolean }) {
  const ctx = useContext(Ctx);
  const nodeRef = useRef<HTMLElement | null>(null);

  const setNodeRef = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
    if (node) {
      node.style.transition = 'transform 150ms ease, opacity 150ms ease';
    }
  }, []);

  const listeners = disabled ? {} : {
    onDragStart: () => {
      ctx.setActiveId(id);
      if (nodeRef.current) {
        nodeRef.current.style.opacity = '0.5';
        nodeRef.current.style.transform = 'scale(1.03)';
      }
    },
    onDragEnd: () => {
      if (nodeRef.current) {
        nodeRef.current.style.opacity = '1';
        nodeRef.current.style.transform = '';
      }
      ctx.setActiveId(null);
      ctx.setOverId(null);
    },
  };

  return {
    attributes: { draggable: !disabled },
    listeners,
    setNodeRef,
    transform: null as { x: number; y: number } | null,
    isDragging: !disabled && ctx.activeId === id,
  };
}
