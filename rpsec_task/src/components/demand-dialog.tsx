import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar as CalendarIcon, Loader2, Trash2, X } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DemandInput } from "@/hooks/use-demands";
import { composeDeadline, splitDeadline, suggestHorizon } from "@/lib/demands";
import { cn } from "@/lib/utils";
import { LINK_PATTERN, normalizeLink } from "@/lib/validation";
import { HORIZONS, TASK_STATUSES } from "@/types/doapp";
import type { CategoriesDoapp, ListDoapp, TaskStatus } from "@/types/doapp";

const demandSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Describe the demand.")
    .max(160, "Keep it under 160 characters."),
  category_id: z.string().min(1, "Pick a category."),
  link: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || LINK_PATTERN.test(value),
      "Enter a link like example.com.",
    ),
  deadline_date: z.date().optional(),
  deadline_time: z.string(),
  horizon: z.enum(["daily", "weekly", "monthly", "long_term"]),
  status: z.enum(["pending", "in_progress", "done"]),
});

type DemandFormValues = z.infer<typeof demandSchema>;

interface DemandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null creates a new demand. */
  demand: ListDoapp | null;
  /** Status pre-selected when creating from a lane header. */
  defaultStatus?: TaskStatus;
  categories: CategoriesDoapp[];
  onSubmit: (input: DemandInput) => Promise<void>;
  onDelete?: (demand: ListDoapp) => void;
}

function buildDefaults(
  demand: ListDoapp | null,
  defaultStatus: TaskStatus | undefined,
  categories: CategoriesDoapp[],
): DemandFormValues {
  const { date, time } = splitDeadline(demand?.deadline ?? null);

  return {
    description: demand?.description ?? "",
    category_id: String(demand?.category_id ?? categories[0]?.id ?? ""),
    link: demand?.link ?? "",
    deadline_date: date,
    deadline_time: time,
    horizon: demand?.horizon ?? suggestHorizon(demand?.deadline ?? null),
    status: demand?.status ?? defaultStatus ?? "pending",
  };
}

export function DemandDialog({
  open,
  onOpenChange,
  demand,
  defaultStatus,
  categories,
  onSubmit,
  onDelete,
}: DemandDialogProps) {
  const form = useForm<DemandFormValues>({
    resolver: zodResolver(demandSchema),
    defaultValues: buildDefaults(demand, defaultStatus, categories),
  });

  // Horizon follows the deadline until the user picks one by hand.
  const horizonTouched = useRef(false);
  const previousDeadline = useRef<string | null>(null);

  const deadlineDate = form.watch("deadline_date");
  const deadlineTime = form.watch("deadline_time");
  const horizon = form.watch("horizon");
  const status = form.watch("status");
  const categoryId = form.watch("category_id");
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (!open) return;

    const defaults = buildDefaults(demand, defaultStatus, categories);
    horizonTouched.current = false;
    previousDeadline.current = composeDeadline(
      defaults.deadline_date,
      defaults.deadline_time,
    );
    form.reset(defaults);
  }, [open, demand, defaultStatus, categories, form]);

  useEffect(() => {
    if (!open) return;

    const composed = composeDeadline(deadlineDate, deadlineTime);
    const deadlineChanged = previousDeadline.current !== composed;
    previousDeadline.current = composed;

    if (!deadlineChanged || horizonTouched.current) return;
    form.setValue("horizon", suggestHorizon(composed));
  }, [deadlineDate, deadlineTime, open, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      description: values.description,
      category_id: Number(values.category_id),
      link: values.link.trim() ? normalizeLink(values.link) : null,
      deadline: composeDeadline(values.deadline_date, values.deadline_time),
      horizon: values.horizon,
      status: values.status,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[520px] sm:rounded-xl">
        <DialogHeader>
          <DialogTitle>{demand ? "Edit demand" : "New demand"}</DialogTitle>
          <DialogDescription>
            {demand
              ? "Update what needs to happen and when."
              : "Describe what needs to happen, then place it on the board."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="demand-description">Demand</Label>
            <Textarea
              id="demand-description"
              placeholder="What needs to happen?"
              className="min-h-[84px] resize-none"
              {...form.register("description")}
            />
            {errors.description && (
              <p className="text-xs font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="demand-category">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(value) =>
                  form.setValue("category_id", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="demand-category" className="h-9">
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-xs font-medium text-destructive">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="demand-horizon">Horizon</Label>
              <Select
                value={horizon}
                onValueChange={(value) => {
                  horizonTouched.current = true;
                  form.setValue("horizon", value as DemandFormValues["horizon"]);
                }}
              >
                <SelectTrigger id="demand-horizon" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HORIZONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-2xs text-muted-foreground">
                Suggested from the deadline — change it any time.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="demand-deadline">Deadline</Label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="demand-deadline"
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-9 flex-1 justify-start gap-2 px-3 font-normal",
                        !deadlineDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="size-4" />
                      {deadlineDate ? format(deadlineDate, "PPP") : "No deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadlineDate}
                      onSelect={(date) =>
                        form.setValue("deadline_date", date, { shouldValidate: true })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {deadlineDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Clear the deadline"
                    className="size-9 shrink-0"
                    onClick={() =>
                      form.setValue("deadline_date", undefined, { shouldValidate: true })
                    }
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="demand-time">Time</Label>
              <Input
                id="demand-time"
                type="time"
                className="h-9"
                {...form.register("deadline_time")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="demand-link">Link</Label>
            <Input
              id="demand-link"
              placeholder="example.com"
              className="h-9"
              {...form.register("link")}
            />
            {errors.link && (
              <p className="text-xs font-medium text-destructive">{errors.link.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="demand-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                form.setValue("status", value as DemandFormValues["status"])
              }
            >
              <SelectTrigger id="demand-status" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {demand && onDelete && (
              <Button
                type="button"
                variant="destructive"
                className="sm:mr-auto"
                onClick={() => onDelete(demand)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {demand ? "Save changes" : "Add demand"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
