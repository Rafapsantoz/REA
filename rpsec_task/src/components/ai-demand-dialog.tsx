import { useState, useRef, useEffect, useMemo, type ClipboardEvent } from "react";
import {
  Sparkles,
  Loader2,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Settings2,
  RotateCcw,
  Code2,
  ArrowUpRight,
  UserCheck,
  CheckSquare,
  Square,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import {
  extractDemandsWithAi,
  getGeminiApiKey,
  setGeminiApiKey,
  type ExtractedDemandItem,
} from "@/lib/gemini";
import type { CategoriesDoapp, Horizon, TaskStatus } from "@/types/doapp";
import type { DemandInput } from "@/hooks/use-demands";

interface AiDemandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoriesDoapp[];
  onCreateDemand: (input: DemandInput) => Promise<void>;
}

type FilterView = "all" | "immediate" | "dev_queue";

export function AiDemandDialog({
  open,
  onOpenChange,
  categories,
  onCreateDemand,
}: AiDemandDialogProps) {
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedDemands, setExtractedDemands] = useState<ExtractedDemandItem[]>([]);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [filterView, setFilterView] = useState<FilterView>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reseta ao abrir
  useEffect(() => {
    if (open) {
      setApiKeyInput(getGeminiApiKey());
      setFilterView("all");
    }
  }, [open]);

  // Captura paste de imagem na área de transferência (Ctrl+V)
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setImageBase64(result);
            setImagePreview(result);
            toast.info("Imagem da área de transferência anexada.");
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageBase64(result);
      setImagePreview(result);
      toast.info("Imagem carregada com sucesso.");
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProcess = async () => {
    if (!text.trim() && !imageBase64) {
      toast.error("Cole um texto de chamado ou dê Ctrl+V em um print para processar.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await extractDemandsWithAi({
        text: text.trim(),
        imageBase64: imageBase64 ?? undefined,
        categories,
        customApiKey: apiKeyInput.trim(),
      });

      setExtractedDemands(result.demands);
      setModelUsed(result.modelUsed);
      setFilterView("all");

      const devCount = result.demands.filter((d) => d.is_dev_queue).length;
      const immediateCount = result.demands.length - devCount;

      toast.success(
        `${result.demands.length} chamados extraídos! (${immediateCount} ação imediata selecionados, ${devCount} de fila dev desmarcados).`
      );
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Erro desconhecido ao processar com IA";
      toast.error(`Falha na IA: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (id: string | undefined) => {
    if (!id) return;
    setExtractedDemands((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSelectAll = (select: boolean) => {
    setExtractedDemands((prev) =>
      prev.map((item) => ({ ...item, selected: select }))
    );
  };

  const handleSelectOnlyImmediate = () => {
    setExtractedDemands((prev) =>
      prev.map((item) => ({ ...item, selected: !item.is_dev_queue }))
    );
    toast.info("Selecionados apenas chamados de Ação Imediata (Fila Dev desmarcada).");
  };

  const handleDeselectDevQueue = () => {
    setExtractedDemands((prev) =>
      prev.map((item) =>
        item.is_dev_queue ? { ...item, selected: false } : item
      )
    );
    toast.info("Chamados da Fila de Desenvolvimento desmarcados.");
  };

  const handleFieldChange = (
    id: string | undefined,
    field: keyof ExtractedDemandItem,
    value: unknown
  ) => {
    if (!id) return;
    setExtractedDemands((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleCreateDemands = async () => {
    const selected = extractedDemands.filter((d) => d.selected !== false);
    if (selected.length === 0) {
      toast.error("Nenhuma demanda selecionada para criar.");
      return;
    }

    setIsLoading(true);
    let createdCount = 0;
    try {
      for (const item of selected) {
        const input: DemandInput = {
          description: item.description.trim(),
          category_id: Number(item.category_id) || categories[0]?.id || 1,
          link: item.link && item.link.trim() ? item.link.trim() : null,
          deadline: item.deadline ? item.deadline : null,
          horizon: item.horizon as Horizon,
          status: item.status as TaskStatus,
        };
        await onCreateDemand(input);
        createdCount++;
      }

      toast.success(
        createdCount === 1
          ? "Demanda adicionada ao quadro com sucesso!"
          : `${createdCount} demandas adicionadas ao quadro com sucesso!`
      );

      // Limpa e fecha
      setText("");
      removeImage();
      setExtractedDemands([]);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Erro ao salvar algumas demandas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput);
    setShowConfig(false);
    toast.success("Chave de API do Gemini salva com sucesso.");
  };

  // Contagens
  const totalCount = extractedDemands.length;
  const devQueueCount = extractedDemands.filter((d) => d.is_dev_queue).length;
  const immediateCount = totalCount - devQueueCount;
  const selectedCount = extractedDemands.filter((d) => d.selected !== false).length;

  // Filtragem visual da lista
  const filteredDemands = useMemo(() => {
    if (filterView === "immediate") {
      return extractedDemands.filter((d) => !d.is_dev_queue);
    }
    if (filterView === "dev_queue") {
      return extractedDemands.filter((d) => d.is_dev_queue);
    }
    return extractedDemands;
  }, [extractedDemands, filterView]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="shrink-0 flex flex-row items-start justify-between pb-2 border-b border-border">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </span>
              Adicionar com IA (Modo Serviço / Chamados)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Extrai chamados de suporte identificando o status original (Ação Imediata vs Fila Desenvolvimento).
            </DialogDescription>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            title="Configurar Chave Gemini API"
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Settings2 className="size-4" />
            <span className="text-xs hidden sm:inline">Chave IA</span>
          </Button>
        </DialogHeader>

        {showConfig && (
          <div className="shrink-0 bg-muted/60 p-3 rounded-lg border border-border my-2 flex flex-col gap-2">
            <Label className="text-xs font-semibold">Chave de API do Google Gemini</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Insira sua chave AIzaSy..."
                className="h-8 text-xs font-mono"
              />
              <Button size="sm" className="h-8 text-xs" onClick={handleSaveApiKey}>
                Salvar
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Utiliza os modelos Gemini 3.1 Flash Lite / 3.5 Flash com fallback automático de alta disponibilidade.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Se ainda não extraiu ou quer editar */}
          {extractedDemands.length === 0 ? (
            <div className="space-y-3" onPaste={handlePaste}>
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-input" className="text-xs font-medium text-foreground">
                  Texto do Chamado / Mensagem / E-mail:
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="size-3.5" />
                    Carregar Print
                  </Button>
                </div>
              </div>

              <Textarea
                id="ai-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Exemplo de entrada:
Cole uma tabela de chamados, print com Ctrl+V ou texto como:
148656 MOCMAQ - NF não respeita valor de parcelas (Status: Pendente Desenvolvimento)
151255 CONCREPOOL - Problema com certificado NF-e travando emissão hoje (Status: Retorno Desenvolvimento)"
                className="min-h-[140px] text-sm resize-y leading-relaxed font-sans"
              />

              {imagePreview && (
                <div className="relative inline-flex items-center gap-3 p-2 bg-muted/70 rounded-lg border border-border">
                  <img
                    src={imagePreview}
                    alt="Print anexado"
                    className="h-16 w-24 object-cover rounded border border-border"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Print Screen Anexado</p>
                    <p className="text-muted-foreground">A IA analisará a grade de tickets e status com visão computacional.</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 ml-auto text-muted-foreground hover:text-destructive"
                    onClick={removeImage}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}

              <div className="rounded-lg bg-accent/40 border border-border p-3 text-xs text-muted-foreground flex items-start gap-2.5">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground mb-0.5">Triagem de Suporte com 1 Clique:</p>
                  <p>
                    Pressione <kbd className="px-1 py-0.5 bg-muted rounded font-mono text-[10px]">PrintScreen</kbd> ou{" "}
                    <kbd className="px-1 py-0.5 bg-muted rounded font-mono text-[10px]">Win+Shift+S</kbd> no helpdesk e cole aqui (<kbd className="px-1 py-0.5 bg-muted rounded font-mono text-[10px]">Ctrl+V</kbd>).
                    A IA identifica a coluna <strong>Status</strong> e <strong>desmarca automaticamente</strong> chamados de <em>Encaminhar ao Desenvolvimento</em> e <em>Pendente Desenvolvimento</em> para não poluir suas tarefas de hoje!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Resultados extraídos para revisão antes de salvar */
            <div className="space-y-3">
              {/* Barra de Filtro e Contagem Rápida */}
              <div className="flex flex-col gap-2.5 pb-2 border-b border-border">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Extraídos: {totalCount} chamados ({selectedCount} marcados para adicionar)
                    </span>
                    {modelUsed && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                        {modelUsed}
                      </Badge>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                    onClick={() => setExtractedDemands([])}
                  >
                    <RotateCcw className="size-3.5" />
                    Voltar / Refazer
                  </Button>
                </div>

                {/* Abas e Filtros Rápidos */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {/* Pílulas de visualização */}
                  <div className="inline-flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterView("all")}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        filterView === "all"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Todos ({totalCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterView("immediate")}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1 ${
                        filterView === "immediate"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      ⚡ Ação Imediata ({immediateCount})
                    </button>
                    {devQueueCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterView("dev_queue")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1 ${
                          filterView === "dev_queue"
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        ⚙️ Fila Dev ({devQueueCount})
                      </button>
                    )}
                  </div>

                  {/* Ações em lote para seleção */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectOnlyImmediate}
                      title="Marca apenas chamados que dependem de você hoje e desmarca fila dev"
                      className="h-7 text-[11px] px-2 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                    >
                      <CheckCircle2 className="size-3" />
                      Apenas Ação Imediata
                    </Button>

                    {devQueueCount > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectDevQueue}
                        title="Desmarca todos os chamados com status Encaminhar ao Desenvolvimento ou Pendente Desenvolvimento"
                        className="h-7 text-[11px] px-2 text-purple-700 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/10 gap-1"
                      >
                        <Code2 className="size-3" />
                        Desmarcar Fila Dev
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAll(selectedCount !== totalCount)}
                      className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                    >
                      {selectedCount === totalCount ? "Desmarcar Todos" : "Marcar Todos"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lista dos Chamados */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredDemands.map((item, index) => {
                  const isDev = item.is_dev_queue;
                  const isRetorno =
                    item.status_chamado?.toUpperCase().includes("RETORNO");

                  return (
                    <div
                      key={item.id || index}
                      className={`p-3.5 rounded-lg border transition-all ${
                        item.selected !== false
                          ? isDev
                            ? "border-purple-500/40 bg-purple-500/5 shadow-xs"
                            : "border-primary/40 bg-card shadow-xs"
                          : "border-border/60 bg-muted/20 opacity-65"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={item.selected !== false}
                          onCheckedChange={() => handleToggleSelect(item.id)}
                          className="mt-1"
                        />

                        <div className="flex-1 space-y-2.5">
                          {/* Linha de Badges de Status do Suporte */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* STATUS DO CHAMADO NO HELPDESK (DESTAQUE MÁXIMO) */}
                            {isDev ? (
                              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold text-[11px] flex items-center gap-1">
                                <Code2 className="size-3" />
                                ⚙️ {item.status_chamado || "Pendente Desenvolvimento"}
                              </Badge>
                            ) : isRetorno ? (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-[11px] flex items-center gap-1">
                                <ArrowUpRight className="size-3" />
                                🔄 {item.status_chamado} (Ação Imediata)
                              </Badge>
                            ) : item.status_chamado ? (
                              <Badge
                                variant="outline"
                                className="bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-300 dark:border-sky-800 font-semibold text-[11px]"
                              >
                                📋 {item.status_chamado}
                              </Badge>
                            ) : null}

                            {/* Urgência */}
                            {item.urgencia === "Urgente" && (
                              <Badge variant="destructive" className="text-[11px] font-bold">
                                🔥 Urgente
                              </Badge>
                            )}
                            {item.urgencia === "Alta" && (
                              <Badge className="bg-amber-600 text-white text-[11px] font-bold">
                                ⚡ Alta
                              </Badge>
                            )}
                            {item.urgencia === "Normal" && (
                              <Badge variant="secondary" className="text-[11px]">
                                Normal
                              </Badge>
                            )}

                            {/* Horizonte Sugerido */}
                            <Badge variant="outline" className="text-[11px] capitalize">
                              📅 {item.horizon === "daily" ? "Hoje (Daily)" : item.horizon === "weekly" ? "Esta Semana" : item.horizon === "monthly" ? "Este Mês" : "Longo Prazo"}
                            </Badge>

                            {/* Número do Ticket */}
                            {item.ticket_num && (
                              <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                                #{item.ticket_num}
                              </span>
                            )}

                            {/* Cliente */}
                            {item.cliente && (
                              <span className="text-[11px] font-semibold text-foreground bg-muted px-2 py-0.5 rounded border border-border/60">
                                🏢 {item.cliente}
                              </span>
                            )}
                          </div>

                          {/* Campo Descrição Editável */}
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Descrição / Título no Quadro:</Label>
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                handleFieldChange(item.id, "description", e.target.value)
                              }
                              className="h-8 text-xs font-medium"
                            />
                          </div>

                          {/* Linha com Categoria, Horizonte e Prazo */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <Label className="text-[11px] text-muted-foreground">Categoria:</Label>
                              <Select
                                value={String(item.category_id)}
                                onValueChange={(val) =>
                                  handleFieldChange(item.id, "category_id", Number(val))
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                                      {c.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-[11px] text-muted-foreground">Horizonte:</Label>
                              <Select
                                value={item.horizon}
                                onValueChange={(val) =>
                                  handleFieldChange(item.id, "horizon", val as Horizon)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily" className="text-xs">Hoje (Daily)</SelectItem>
                                  <SelectItem value="weekly" className="text-xs">Semana (Weekly)</SelectItem>
                                  <SelectItem value="monthly" className="text-xs">Mês (Monthly)</SelectItem>
                                  <SelectItem value="long_term" className="text-xs">Longo Prazo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-[11px] text-muted-foreground">Prazo (Deadline):</Label>
                              <Input
                                type="date"
                                value={item.deadline ? item.deadline.slice(0, 10) : ""}
                                onChange={(e) =>
                                  handleFieldChange(
                                    item.id,
                                    "deadline",
                                    e.target.value ? `${e.target.value}T18:00:00` : null
                                  )
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>

                          {/* Dica / Alerta da Fila Dev */}
                          {isDev ? (
                            <p className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded border border-purple-200 dark:border-purple-800/60 flex items-center gap-1.5 font-medium">
                              <Code2 className="size-3.5 shrink-0" />
                              Fila de Desenvolvimento: desmarcado por padrão para não entrar nas tarefas de hoje.
                            </p>
                          ) : item.motivo_horizon ? (
                            <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                              <AlertCircle className="size-3 text-primary shrink-0" />
                              {item.motivo_horizon}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t border-border flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>

          {extractedDemands.length === 0 ? (
            <Button
              type="button"
              size="sm"
              className="gap-2 bg-primary text-primary-foreground font-medium shadow-sm hover:opacity-90"
              onClick={handleProcess}
              disabled={isLoading || (!text.trim() && !imageBase64)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processando com Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Processar com IA
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="gap-2 bg-primary text-primary-foreground font-medium shadow-sm hover:opacity-90"
              onClick={handleCreateDemands}
              disabled={isLoading || selectedCount === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Criando Demanda(s)...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Adicionar ao Quadro ({selectedCount})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
