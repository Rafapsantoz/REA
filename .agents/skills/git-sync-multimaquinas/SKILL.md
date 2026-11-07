---
name: git-sync-multimaquinas
description: >-
  Procedimento seguro e ágil de sincronização entre a máquina de trabalho e a máquina pessoal via Git. Use quando o usuário for alternar de máquina, puxar alterações ou preparar commits para encerramento de turno.
---

# 🔄 Sincronização Git Multi-Máquinas (Trabalho ⟷ Pessoal)

Esta skill orienta o fluxo contínuo de trabalho entre as duas estações de desenvolvimento sem risco de perda de código ou conflitos.

## 🏁 Rotina de Início de Turno (Ao ligar qualquer máquina)
1. Abra o terminal no diretório do projeto:
   ```bash
   git status
   ```
2. Puxe as atualizações mais recentes enviadas pela outra máquina:
   ```bash
   git pull origin main
   ```
3. Se houver novas dependências no app financeiro:
   ```bash
   cmd /c "npm --prefix rpsec_balcao install"
   ```

## 🚀 Rotina de Fim de Turno (Antes de trocar de máquina)
1. Valide se tudo compila sem erros:
   ```bash
   cmd /c "npm --prefix rpsec_balcao run build"
   ```
2. Adicione e commite todas as alterações com mensagem semântica clara:
   ```bash
   git add .
   git commit -m "feat/fix: descricao clara da entrega realizada"
   ```
3. Envie para o GitHub:
   ```bash
   git push origin main
   ```
4. Ao chegar na outra máquina, basta rodar `git pull origin main` para continuar exatamente de onde parou.
