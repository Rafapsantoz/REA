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
  motivo_horizon?: string;
  selected?: boolean;
}

export interface ExtractOptions {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  categories: CategoriesDoapp[];
  customApiKey?: string;
}

export async function extractDemandsWithAi(
  options: ExtractOptions
): Promise<{ demands: ExtractedDemandItem[]; modelUsed: string }> {
  const { text, imageBase64, mimeType = "image/jpeg", categories, customApiKey } = options;

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

  const systemInstruction = `Você é o assistente inteligente de gestão e triagem de demandas e suporte técnico da RPsecti Soluções Inteligentes.
Sua especialidade é extrair e estruturar ordens de serviço, chamados de helpdesk, mensagens de clientes e demandas técnicas de trabalho ("modo serviço").

Hoje é ${todayStr} (${dayName}).

Categorias disponíveis no sistema: [${categoryNames}].
Se a demanda for de suporte, chamado, sistema, bug, ERP ou cliente corporativo, classifique preferencialmente em "${trabalhoCategory?.description || "Trabalho / Suporte"}".

Regras de Classificação e Extração:
1. "description": Título claro, objetivo e profissional, no formato exato: "[Nº Chamado] Cliente: Resumo da Demanda Técnica" (ex: "158932 Concrepool: Falha de emissão NF-e erro 503 SEFAZ"). Se não houver número de chamado, use apenas "Cliente: Resumo". Máximo de 150 caracteres.
2. "urgencia": Classifique em "Urgente", "Alta", "Normal" ou "Baixa". (Casos de notas fiscais paradas, clientes bloqueados ou termos como urgente/crítico são "Urgente" ou "Alta").
3. "horizon":
   - "daily": Para hoje/imediato (urgente, bloqueio em produção, prazos de hoje).
   - "weekly": Para esta semana (retorno desenvolvimento, configurações, demandas sem urgência extrema).
   - "monthly": Para este mês (melhorias planejadas, relatórios, rotinas periódicas).
   - "long_term": Para longo prazo ou backlog (ideias, refatorações futuras sem data fixa).
4. "deadline": Data sugerida no formato "YYYY-MM-DD" ou null. Se for urgente ou de hoje, retorne "${todayStr}". Se mencionar prazo ou dias, projete a data a partir de hoje.
5. "link": Se houver URL do ticket, ERP, commit ou link web mencionado, extraia. Se não houver, retorne null.
6. "cliente": Nome da empresa ou solicitante se identificado.
7. "ticket_num": Número do ticket/chamado se identificado.
8. "motivo_horizon": Breve explicação de 1 linha em português sobre por que esse horizonte e prioridade foram sugeridos.
9. Pode retornar múltiplas demandas caso o texto ou imagem contenha uma lista/tabela de múltiplos chamados!

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem markdown, sem blocos de código com crases):
{
  "demands": [
    {
      "description": "158932 Concrepool: Falha na emissão de NF-e erro 503 SEFAZ",
      "category": "${trabalhoCategory?.description || "Trabalho / Suporte"}",
      "horizon": "daily",
      "deadline": "${todayStr}",
      "link": null,
      "urgencia": "Urgente",
      "cliente": "Concrepool Mococa",
      "ticket_num": "158932",
      "motivo_horizon": "Cliente bloqueado com erro 503 na SEFAZ hoje"
    }
  ]
}`;

  const parts: Array<Record<string, unknown>> = [];

  if (text && text.trim()) {
    parts.push({
      text: `${systemInstruction}\n\nConteúdo bruto do chamado / mensagem para processar:\n"""\n${text.trim()}\n"""`,
    });
  } else {
    parts.push({
      text: `${systemInstruction}\n\nAnalise a imagem da tela/tabela de tickets e extraia com exatidão cada demanda/chamado visível.`,
    });
  }

  if (imageBase64) {
    // Remove prefixo data:image/...;base64, se houver
    const cleanB64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
    parts.push({
      inline_data: {
        mime_type: mimeType,
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
        continue; // Tenta o próximo modelo candidato
      }

      const resJson = await response.json();
      const rawText =
        resJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      if (!rawText) {
        lastError = new Error(`Resposta vazia do modelo ${model}`);
        continue;
      }

      // Sanitiza caso venha com blocos de markdown
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      const rawDemands = Array.isArray(parsed)
        ? parsed
        : parsed?.demands || parsed?.tickets || parsed?.items || [];

      if (!Array.isArray(rawDemands) || rawDemands.length === 0) {
        throw new Error("A IA não identificou nenhuma demanda no texto ou imagem informada.");
      }

      const mapped: ExtractedDemandItem[] = rawDemands.map((item, idx) => {
        // Encontra a categoria correspondente ou usa a de trabalho
        const catName = String(item.category || "").toLowerCase();
        const matchedCategory =
          categories.find((c) =>
            catName ? c.description.toLowerCase().includes(catName) : false
          ) || trabalhoCategory || categories[0];

        let horizon: Horizon = "daily";
        const h = String(item.horizon || "").toLowerCase();
        if (h === "weekly" || h === "semanal") horizon = "weekly";
        else if (h === "monthly" || h === "mensal") horizon = "monthly";
        else if (h === "long_term" || h === "longo_prazo") horizon = "long_term";
        else horizon = "daily";

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
          motivo_horizon: item.motivo_horizon,
          selected: true,
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
