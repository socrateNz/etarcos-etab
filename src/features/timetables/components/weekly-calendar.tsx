"use client";

import { useMemo } from "react";
import { Clock, User, Landmark, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LessonWithRelations } from "../types";

const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

interface WeeklyCalendarProps {
  lessons: LessonWithRelations[];
  onEdit: (lesson: LessonWithRelations) => void;
  onDelete: (lesson: LessonWithRelations) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function WeeklyCalendar({
  lessons,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: WeeklyCalendarProps) {
  // Group lessons by day
  const lessonsByDay = useMemo(() => {
    const groups: Record<number, LessonWithRelations[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
    };

    lessons.forEach((l) => {
      if (groups[l.day_of_week]) {
        groups[l.day_of_week]!.push(l);
      }
    });

    // Sort chronologically per day
    Object.keys(groups).forEach((key) => {
      groups[Number(key)]!.sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return groups;
  }, [lessons]);

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5); // "08:00:00" -> "08:00"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
      {DAYS.map((day) => {
        const dayLessons = lessonsByDay[day.value] ?? [];
        return (
          <div key={day.value} className="bg-card border rounded-xl overflow-hidden flex flex-col min-h-[350px]">
            <div className="bg-muted px-4 py-2.5 border-b flex justify-between items-center">
              <span className="font-semibold text-sm text-foreground">{day.label}</span>
              <span className="text-xs text-muted-foreground font-mono bg-background px-1.5 py-0.5 rounded border">
                {dayLessons.length} {dayLessons.length > 1 ? "cours" : "cours"}
              </span>
            </div>

            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
              {dayLessons.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic py-8">
                  Aucun cours
                </div>
              ) : (
                dayLessons.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 border rounded-lg bg-background hover:shadow-md transition-shadow relative group border-l-4"
                    style={{ borderLeftColor: l.subject?.color || "#e2e8f0" }}
                  >
                    <div className="pr-12">
                      <p className="font-bold text-sm text-foreground line-clamp-1">{l.subject?.name}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground font-mono">
                        <Clock className="size-3" />
                        <span>
                          {formatTime(l.start_time)} - {formatTime(l.end_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <User className="size-3 text-brand-500" />
                        <span className="truncate">{l.teacher?.name || "Sans prof"}</span>
                      </div>
                      {l.room && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-brand-500 font-medium">
                          <Landmark className="size-3" />
                          <span>{l.room.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-0.5 md:opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded shadow-sm p-0.5 no-print">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onEdit(l)}
                          title="Modifier"
                        >
                          <Pencil className="size-3 text-muted-foreground hover:text-foreground" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDelete(l)}
                          title="Supprimer"
                        >
                          <Trash2 className="size-3 text-rose-500 hover:text-rose-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
