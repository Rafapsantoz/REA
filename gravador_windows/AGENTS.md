# 🎥 RPsec Recorder — Diretrizes do Gravador de Tela Portátil

> **Subprojeto:** RPsec Recorder (Gravador Windows Portátil)  
> **Squad Responsável:** `dev1_engine`, `dev2_ui_ux`, `qa_tester`.

---

## 🎯 Propósito do Produto
Utilitário de gravação de tela e áudio para Windows 11 ultraleve (< 40MB RAM), sem instalador (portable standalone `.exe`), com fluxo obrigatório de diálogo de salvamento, suporte a múltiplos monitores e atalho global F9.

---

## ⚙️ Diretrizes Técnicas
1. **Consumo de Memória Reduzido:** O gravador deve permanecer invisível ao desempenho do sistema operacional.
2. **Salvamento Garantido:** Fluxo explícito de diálogo "Salvar Como" ao interromper a gravação, garantindo que o usuário nunca perca arquivos.
3. **Compilação Standalone:** Empacotamento via PyInstaller com flag `--onefile` e `--noconsole` para distribuição limpa.
