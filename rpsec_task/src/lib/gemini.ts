import type { CategoriesDoapp, Horizon, TaskStatus } from "@/types/doapp";

const GEMINI_KEY_STORAGE = "doapp.gemini_key.v1";
// Chave lida do ambiente ou do localStorage do navegador
const DEFAULT_GEMINI_API_KEY =
  (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || "";

export const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
];

export function getGeminiApiKey(): string {
  if (typeof window === "undefined") return DEFAULT_GEMINI_API_KEY;
  const stored = localStorage.getItem(GEMINI_KEY_STORAGE);
  return stored && stored.trim() ? stored.trim() : DEFAULT_GEMINI_API_KEY;
}

export function setGeminiApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
}

export interface ExtractedDemandItem {
  id?: string;
  description: string;
  category_id: number;
  category_name: string;
  horizon: Horizon;
  status: TaskStatus;
  deadline: string | null;
  link: string | null;
  urgencia: "Urgente" | "Alta" | "Normal" | "Baixa";
  cliente?: string;
  ticket_num?: string;
  status_chamado?: string;
  is_dev_queue?: boolean;
  responsavel_tipo?: "Ação Imediata" | "Fila Dev" | "Pendente Cliente" | "Outro";
  motivo_horizon?: string;
  selected?: boolean;
}

export interface ImageAttachment {
  base64: string;
  mimeType?: string;
}

export interface ExtractOptions {
  text?: string;
  imageBase64?: string;
  images?: ImageAttachment[];
  mimeType?: string;
  categories: CategoriesDoapp[];
  customApiKey?: string;
}

export async function extractDemandsWithAi(
  options: ExtractOptions
): Promise<{ demands: ExtractedDemandItem[]; modelUsed: string }> {
  const { text, imageBase64, images, mimeType = "image/jpeg", categories, customApiKey } = options;

  const apiKey = (customApiKey || getGeminiApiKey()).trim();
  if (!apiKey) {
    throw new Error("Chave de API do Gemini não configurada.");
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const dayName = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ][now.getDay()];

  const categoryNames = categories.map((c) => c.description).join(", ");
  const trabalhoCategory =
    categories.find((c) =>
      /trabalho|suporte|serviço|servico/i.test(c.description)
    ) ?? categories[0];

  // Agrupa todas as imagens (suporta múltiplos prints de tela simultâneos!)
  const allImages: ImageAttachment[] = [];
  if (images && images.length > 0) {
    allImages.push(...images);
  } else if (imageBase64) {
    allImages.push({ base64: imageBase64, mimeType });
  }

  const systemInstruction = `Você é o assistente inteligente de gestão e triagem de demandas e suporte técnico da RPsecti Soluções Inteligentes.
Sua especialidade é extrair e estruturar ordens de serviço, chamados de helpdesk, mensagens de clientes e demandas técnicas de trabalho ("modo serviço").

Hoje é ${todayStr} (${dayName}).

Categorias disponíveis no sistema: [${categoryNames}].
Se a demanda for de suporte, chamado, sistema, bug, ERP ou cliente corporativo, classifique preferencialmente em "${trabalhoCategory?.description || "Trabalho / Suporte"}".

Regras de Classificação e Extração:
1. "description": Título claro, objetivo e profissional, no formato: "[Nº Chamado] Cliente: Resumo da Demanda Técnica" (ex: "148656 MOCMAQ: NF não respeita valor de parcelas"). Se não houver número de chamado, use apenas "Cliente: Resumo". Máximo de 150 caracteres.
2. "status_chamado": OBRIGATÓRIO extrair o status EXATO de cada chamado no sistema de suporte / helpdesk.
   Exemplos muito comuns no sistema:
   - "Encaminhar ao Desenvolvimento"
   - "Pendente Desenvolvimento"
   - "Retorno Desenvolvimento"
   - "Pendente Cliente"
   - "Pendente Empresa"
   - "Atendimento Pausado"
   - "Em análise"
   - "Concluído"
3. "is_dev_queue": Retorne true se o status for "Encaminhar ao Desenvolvimento" ou "Pendente Desenvolvimento" (chamados que dependem de desenvolvimento de software e NÃO de atendimento imediato do suporte).
4. "urgencia": Classifique em "Urgente", "Alta", "Normal" ou "Baixa".
5. "horizon":
   - "daily": Para hoje/imediato (somente chamados de AÇÃO IMEDIATA, urgente, retorno desenvolvimento que travou cliente, notas paradas).
   - "weekly": Para esta semana (configurações, retornos rotineiros, demandas de curto prazo).
   - "monthly": Para este mês (melhorias planejadas, relatórios mensais).
   - "long_term": Para longo prazo / backlog (chamados parados na fila de desenvolvimento, refatorações, etc.).
   ATENÇÃO: Se "status_chamado" for "Encaminhar ao Desenvolvimento" ou "Pendente Desenvolvimento", o horizonte NUNCA deve ser "daily" (use "weekly" ou "long_term"), pois o operador NÃO vai pegá-los para hoje!
6. "deadline": Data sugerida no formato "YYYY-MM-DD" ou null.
7. "link": Se houver URL do ticket, ERP, commit ou link web mencionado, extraia. Se não houver, retorne null.
8. "cliente": Razão social ou nome do cliente/empresa.
9. "ticket_num": Número do ticket/chamado se identificado (ex: "148656", "148887").
10. "motivo_horizon": Breve explicação de 1 linha indicando o porquê da prioridade (ex: "Fila de desenvolvimento - aguarda correção de software").
11. Pode retornar múltiplas demandas se houver múltiplos chamados no print ou texto! Se houver mais de uma imagem anexada, processe e una todos os chamados de TODAS as imagens anexadas sem duplicar!

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem markdown, sem blocos com crases):
{
  "demands": [
    {
      "description": "148656 MOCMAQ: NF não respeita valor de parcelas",
      "category": "${trabalhoCategory?.description || "Trabalho / Suporte"}",
      "status_chamado": "Pendente Desenvolvimento",
      "is_dev_queue": true,
      "horizon": "weekly",
      "deadline": "${todayStr}",
      "link": null,
      "urgencia": "Normal",
      "cliente": "MOCMAQ",
      "ticket_num": "148656",
      "motivo_horizon": "Pendente de desenvolvimento - aguarda equipe técnica"
    }
  ]
}`;

  const parts: Array<Record<string, unknown>> = [];

  if (text && text.trim()) {
    parts.push({
      text: `${systemInstruction}\n\nConteúdo em texto dos chamados:\n"""\n${text.trim()}\n"""`,
    });
  } else {
    parts.push({
      text: `${systemInstruction}\n\nAnalise as ${allImages.length} imagem(ns) da tela/tabela de tickets e extraia com exatidão cada demanda/chamado visível, capturando a coluna Status de cada linha.`,
    });
  }

  // Anexa todas as imagens na chamada do Gemini Vision
  for (const img of allImages) {
    const cleanB64 = img.base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
    parts.push({
      inline_data: {
        mime_type: img.mimeType || "image/jpeg",
        data: cleanB64,
      },
    });
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: "application/json",
    },
  };

  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Gemini [${model}] status ${response.status}:`, errorText);
        lastError = new Error(`Modelo ${model} retornou status ${response.status}`);
        continue;
      }

      const resJson = await response.json();
      const rawText =
        resJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      if (!rawText) {
        lastError = new Error(`Resposta vazia do modelo ${model}`);
        continue;
      }

      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      const rawDemands = Array.isArray(parsed)
        ? parsed
        : parsed?.demands || parsed?.tickets || parsed?.items || [];

      if (!Array.isArray(rawDemands) || rawDemands.length === 0) {
        throw new Error("A IA não identificou nenhuma demanda nas entradas informadas.");
      }

      const mapped: ExtractedDemandItem[] = rawDemands.map((item, idx) => {
        const catName = String(item.category || "").toLowerCase();
        const matchedCategory =
          categories.find((c) =>
            catName ? c.description.toLowerCase().includes(catName) : false
          ) || trabalhoCategory || categories[0];

        const statusChamadoRaw = String(item.status_chamado || item.status || "").trim();
        const statusNorm = statusChamadoRaw.toUpperCase();

        const isDevQueue =
          item.is_dev_queue === true ||
          statusNorm.includes("ENCAMINHAR") ||
          (statusNorm.includes("PENDENTE") && statusNorm.includes("DESENV")) ||
          statusNorm.includes("DEV");

        let responsavelTipo: "Ação Imediata" | "Fila Dev" | "Pendente Cliente" | "Outro" = "Outro";
        if (isDevQueue) {
          responsavelTipo = "Fila Dev";
        } else if (statusNorm.includes("RETORNO") || statusNorm.includes("IMEDIAT") || statusNorm.includes("ANALISE") || statusNorm.includes("ANÁLISE")) {
          responsavelTipo = "Ação Imediata";
        } else if (statusNorm.includes("CLIENTE")) {
          responsavelTipo = "Pendente Cliente";
        } else {
          responsavelTipo = "Ação Imediata";
        }

        let horizon: Horizon = "daily";
        const h = String(item.horizon || "").toLowerCase();
        if (h === "weekly" || h === "semanal") horizon = "weekly";
        else if (h === "monthly" || h === "mensal") horizon = "monthly";
        else if (h === "long_term" || h === "longo_prazo") horizon = "long_term";
        else horizon = "daily";

        if (isDevQueue && horizon === "daily") {
          horizon = "weekly";
        }

        let urgencia: "Urgente" | "Alta" | "Normal" | "Baixa" = "Normal";
        const u = String(item.urgencia || "").toLowerCase();
        if (u.includes("urgente") || u.includes("crit") || u.includes("altíssim")) urgencia = "Urgente";
        else if (u.includes("alta")) urgencia = "Alta";
        else if (u.includes("baix")) urgencia = "Baixa";

        let deadline: string | null = null;
        if (item.deadline && typeof item.deadline === "string") {
          deadline = item.deadline.includes("T") ? item.deadline : `${item.deadline}T18:00:00`;
        } else if (urgencia === "Urgente" || horizon === "daily") {
          deadline = `${todayStr}T18:00:00`;
        }

        return {
          id: `ai-${Date.now()}-${idx}`,
          description: String(item.description || "Nova Demanda").slice(0, 160).trim(),
          category_id: matchedCategory ? matchedCategory.id : (trabalhoCategory?.id ?? 1),
          category_name: matchedCategory ? matchedCategory.description : (trabalhoCategory?.description ?? "Trabalho"),
          horizon,
          status: "pending",
          deadline,
          link: item.link && typeof item.link === "string" && item.link.trim() ? item.link.trim() : null,
          urgencia,
          cliente: item.cliente,
          ticket_num: item.ticket_num,
          status_chamado: statusChamadoRaw || (isDevQueue ? "Pendente Desenvolvimento" : "Ação Suporte"),
          is_dev_queue: isDevQueue,
          responsavel_tipo: responsavelTipo,
          motivo_horizon: item.motivo_horizon || (isDevQueue ? "Fila de desenvolvimento (bloqueado para hoje)" : undefined),
          selected: !isDevQueue,
        };
      });

      return { demands: mapped, modelUsed: model };
    } catch (err: unknown) {
      console.error(`Erro ao consultar modelo ${model}:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw (
    lastError ||
    new Error("Falha ao comunicar com a API do Gemini em todos os modelos candidatos.")
  );
}
