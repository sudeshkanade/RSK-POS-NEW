import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TableNode } from './TableNode';
import { usePOSStore } from '../../store/posStore';

interface DraggableTableProps {
  id: string;
  name: string;
  status: 'VACANT' | 'OCCUPIED' | 'BILL_PRINTED' | 'SETTLED' | 'PAYMENT_PENDING';
  capacity: number;
  position: { x: number; y: number };
  onClick: (id: string) => void;
  isDraggable: boolean;
}

export const DraggableTable: React.FC<DraggableTableProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
    disabled: !props.isDraggable,
  });

  const total = usePOSStore(s => {
    const order = s.orders[props.id];
    if (!order) return 0;
    return order.items.filter(i => !i.isVoided).reduce((sum, i) => sum + i.price * i.qty, 0);
  });
  const openedAt = usePOSStore(s => s.orders[props.id]?.openedAt);

  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute' as const,
    left: props.position.x,
    top: props.position.y,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TableNode
        id={props.id}
        name={props.name}
        status={props.status}
        capacity={props.capacity}
        totalAmount={total}
        openedAt={openedAt}
        onClick={props.onClick}
        isEditMode={props.isDraggable}
      />
    </div>
  );
};
