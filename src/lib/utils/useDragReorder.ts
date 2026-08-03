"use client";

import { useState } from "react";

/**
 * Reordenamiento por arrastre (drag & drop nativo del navegador, sin sumar
 * ninguna librería) para listas simples: proyectos, fotos, etapas. El
 * consumidor mantiene su propia copia del array en estado (`items`) y le
 * pasa un `onReorder` que recibe el array ya reordenado — no persiste nada
 * por sí solo, así cada lugar decide cuándo guardar (al soltar, con un
 * botón "Guardar orden", etc).
 *
 * Pensado para un "drag handle" chico (ícono de agarre) en vez de arrastrar
 * la fila entera: `dragHandleProps` va en ese ícono (`draggable` +
 * `onDragStart`), mientras que `dropTargetProps` va en el contenedor de la
 * fila completa (`onDragOver`/`onDrop`/`onDragEnd`) — así los botones y
 * links de adentro de la fila (editar, eliminar, etc.) siguen siendo
 * clickeables normalmente.
 */
export function useDragReorder<T>(items: T[], onReorder: (next: T[]) => void) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function reset() {
    setDraggingIndex(null);
    setOverIndex(null);
  }

  function dragHandleProps(index: number) {
    return {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = "move";
        setDraggingIndex(index);
      },
    };
  }

  function dropTargetProps(index: number) {
    return {
      onDragOver: (e: React.DragEvent) => {
        if (draggingIndex === null) return;
        e.preventDefault();
        if (index !== overIndex) setOverIndex(index);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        if (draggingIndex === null || draggingIndex === index) {
          reset();
          return;
        }
        const next = [...items];
        const [moved] = next.splice(draggingIndex, 1);
        if (moved === undefined) {
          reset();
          return;
        }
        next.splice(index, 0, moved);
        reset();
        onReorder(next);
      },
      onDragEnd: reset,
    };
  }

  return { draggingIndex, overIndex, dragHandleProps, dropTargetProps };
}
