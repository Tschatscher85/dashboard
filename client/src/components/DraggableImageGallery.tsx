import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageItem {
  id: string;
  url: string;
  filename?: string;
  category?: string;
  isNAS?: boolean;
}

interface DraggableImageGalleryProps {
  images: ImageItem[];
  onReorder: (reorderedImages: ImageItem[]) => void;
  onDelete?: (imageId: string) => void;
  onRename?: (imageId: string, currentName: string) => void;
  onImageClick?: (index: number) => void;
  viewSize?: "small" | "medium" | "large";
  selectedImages?: Set<string>;
  onToggleSelect?: (imageId: string) => void;
}

function SortableImage({
  image,
  index,
  onDelete,
  onRename,
  onClick,
  isSelected,
  onToggleSelect,
}: {
  image: ImageItem;
  index: number;
  onDelete?: (imageId: string) => void;
  onRename?: (imageId: string, currentName: string) => void;
  onClick?: () => void;
  isSelected?: boolean;
  onToggleSelect?: (imageId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${
        isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent"
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 bg-black/50 hover:bg-black/70 rounded p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-white" />
      </div>

      {/* Selection Checkbox */}
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(image.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 z-10 w-5 h-5 cursor-pointer"
        />
      )}

      {/* Image */}
      <div
        onClick={onClick}
        className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden"
      >
        <img
          src={image.url}
          alt={image.filename || "Image"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between gap-2">
          <span className="text-white text-xs truncate flex-1">
            {image.filename || "Bild"}
          </span>
          <div className="flex gap-1">
            {onRename && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(image.id, image.filename || "");
                }}
              >
                <Pencil className="w-3 h-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-white hover:bg-red-500/80"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(image.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Category Badge */}
      {image.category && (
        <div className="absolute top-2 left-12 bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          {image.category}
        </div>
      )}
    </div>
  );
}

export default function DraggableImageGallery({
  images,
  onReorder,
  onDelete,
  onRename,
  onImageClick,
  viewSize = "medium",
  selectedImages,
  onToggleSelect,
}: DraggableImageGalleryProps) {
  const [items, setItems] = useState(images);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      setItems(reorderedItems);
      onReorder(reorderedItems);
    }
  };

  // Update items when images prop changes
  useState(() => {
    setItems(images);
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((img) => img.id)} strategy={rectSortingStrategy}>
        <div
          className={`grid gap-4 ${
            viewSize === "small"
              ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
              : viewSize === "medium"
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {items.map((image, index) => (
            <SortableImage
              key={image.id}
              image={image}
              index={index}
              onDelete={onDelete}
              onRename={onRename}
              onClick={() => onImageClick?.(index)}
              isSelected={selectedImages?.has(image.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
