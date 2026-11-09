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
import { HORIZONS, PRIORITIES, TASK_STATUSES } from "@/types/doapp";
import type { CategoriesDoapp, ListDoapp, PriorityLevel, TaskStatus } from "@/types/doapp";

const demandSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Descreva a demanda.")
    .max(200, "Limite de 200 caracteres."),
  category_id: z.string().min(1, "Escolha uma categoria."),
  link: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || LINK_PATTERN.test(value),
      "Informe um link válido (ex.: sistema.com).",
    ),
  deadline_date: z.date().optional(),
  deadline_time: z.string(),
  horizon: z.enum(["daily", "weekly", "monthly", "long_term"]),
  status: z.enum(["pending", "in_progress", "done"]),
  priority: z.enum(["urgent", "high", "normal", "low"]),
});

type DemandFormValues = z.infer<typeof demandSchema>;

interface DemandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null creates a new demand. */
  demand: ListDoapp | null;
  /** Status pre-selected when creating from a lane header. */
  defaultStatus?: TaskStatus;
  defaultPriority?: PriorityLevel;
  categories: CategoriesDoapp[];
  onSubmit: (input: DemandInput) => Promise<void>;
  onDelete?: (demand: ListDoapp) => void;
}

function buildDefaults(
  demand: ListDoapp | null,
  defaultStatus: TaskStatus | undefined,
  defaultPriority: PriorityLevel | undefined,
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
    priority: demand?.priority ?? defaultPriority ?? "normal",
  };
}

export function DemandDialog({
  open,
  onOpenChange,
  demand,
  defaultStatus,
  defaultPriority,
  categories,
  onSubmit,
  onDelete,
}: DemandDialogProps) {
  const form = useForm<DemandFormValues>({
    resolver: zodResolver(demandSchema),
    defaultValues: buildDefaults(demand, defaultStatus, defaultPriority, categories),
  });

  // Horizon follows the deadline until the user picks one by hand.
  const horizonTouched = useRef(false);
  const previousDeadline = useRef<string | null>(null);

  const deadlineDate = form.watch("deadline_date");
  const deadlineTime = form.watch("deadline_time");
  const horizon = form.watch("horizon");
  const status = form.watch("status");
  const priority = form.watch("priority");
  const categoryId = form.watch("category_id");
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (!open) return;

    const defaults = buildDefaults(demand, defaultStatus, defaultPriority, categories);
    horizonTouched.current = false;
    previousDeadline.current = composeDeadline(
      defaults.deadline_date,
      defaults.deadline_time,
    );
    form.reset(defaults);
  }, [open, demand, defaultStatus, defaultPriority, categories, form]);

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
      priority: values.priority,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[520px] sm:rounded-xl">
        <DialogHeader>
          <DialogTitle>{demand ? "Editar Demanda" : "Nova Demanda"}</DialogTitle>
          <DialogDescription>
            {demand
              ? "Atualize os detalhes, prioridade ou prazo da demanda."
              : "Cadastre um novo chamado ou pendência e posicione no seu quadro."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="demand-description">Descrição da Demanda</Label>
            <Textarea
              id="demand-description"
              placeholder="Ex: 148656 MOCMAQ - NF não respeita valor de parcelas"
              className="min-h-[84px] resize-none"
              {...form.register("description")}
            />
            {errors.description && (
              <p className="text-xs font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="demand-category">Categoria</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => form.setValue("category_id", value)}
              >
                <SelectTrigger id="demand-category" className="h-9">
                  <SelectValue placeholder="Selecione" />
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
              <Label htmlFor="demand-horizon">Horizonte (Planejamento)</Label>
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
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Prazo (Deadline)</Label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-9 flex-1 justify-start px-3 text-left font-normal",
                        !deadlineDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {deadlineDate ? format(deadlineDate, "dd/MM/yyyy") : "Sem data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadlineDate}
                      onSelect={(selected) => form.setValue("deadline_date", selected)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {deadlineDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Limpar data"
                    className="size-9 shrink-0"
                    onClick={() => form.setValue("deadline_date", undefined)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="demand-time">Horário Limite</Label>
              <Input
                id="demand-time"
                type="time"
                className="h-9"
                {...form.register("deadline_time")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="demand-priority">Prioridade (Urgência)</Label>
              <Select
                value={priority}
                onValueChange={(value) =>
                  form.setValue("priority", value as PriorityLevel)
                }
              >
                <SelectTrigger id="demand-priority" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="mr-1.5">{option.icon}</span>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="demand-status">Status no Quadro</Label>
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
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="demand-link">Link / Chamado Web (Opcional)</Label>
            <Input
              id="demand-link"
              placeholder="ex.: helpdesk.empresa.com.br/ticket/148656"
              className="h-9"
              {...form.register("link")}
            />
            {errors.link && (
              <p className="text-xs font-medium text-destructive">{errors.link.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {demand && onDelete && (
              <Button
                type="button"
                variant="destructive"
                className="sm:mr-auto"
                onClick={() => onDelete(demand)}
              >
                <Trash2 className="size-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              {demand ? "Salvar alterações" : "Criar Demanda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
