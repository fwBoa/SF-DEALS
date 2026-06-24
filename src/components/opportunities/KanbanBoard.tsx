import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { OpportuniteWithRelations } from '@/lib/types'
import { PIPELINE_STAGES, type StageId } from '@/config/pipeline'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'

interface KanbanBoardProps {
  data: OpportuniteWithRelations[]
  onMove: (id: string, stage: StageId) => void
}

export function KanbanBoard({ data, onMove }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const stageIds = new Set<string>(PIPELINE_STAGES.map((s) => s.id))
  const oppStage = new Map(data.map((o) => [o.id, o.etape_pipeline]))
  const activeOpp = data.find((o) => o.id === activeId) ?? null

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const overId = String(over.id)
    const currentStage = oppStage.get(String(active.id))
    // cible : colonne (stageId) ou carte (stage de la carte survolée)
    const targetStage: StageId | undefined = stageIds.has(overId)
      ? (overId as StageId)
      : (oppStage.get(overId) as StageId | undefined)
    if (!targetStage || targetStage === currentStage) return
    onMove(String(active.id), targetStage)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            opps={data.filter((o) => o.etape_pipeline === stage.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeOpp ? <KanbanCard opp={activeOpp} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}