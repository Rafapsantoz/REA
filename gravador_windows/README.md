# 🎥 RPsec Recorder - Gravador de Tela Simplificado para Windows
*Um produto RPsecti Soluções Inteligentes*

Uma ferramenta de gravação de tela **ultrarrápida, minimalista e direta ao ponto** para Windows, desenvolvida para alta produtividade, leveza e foco.

---

## ✨ Recursos Principais

- ⚡ **Zero Sobrecarga:** Desenvolvido em Python + MSS + FFmpeg pipe rawvideo. Usa apenas **~40 a 60 MB de memória RAM** durante a gravação.
- 🎨 **Interface Windows 11 (Modo Claro & Escuro):** Visual moderno e ergonômico construído com `CustomTkinter`.
- 📁 **Fluxo Obrigatório de Salvamento:** Ao finalizar a gravação, abre imediatamente a janela nativa do Windows perguntando onde e com qual nome salvar o arquivo (`Gravacao_AAAA-MM-DD_HH-MM-SS.mp4`).
- 🛡️ **Proteção Antiperda:** Caso você cancele o diálogo de salvamento, o aplicativo questiona se deseja salvar automaticamente na pasta padrão (`Vídeos/Gravações RPsec`) ou descartar o arquivo temporário.
- ⌨️ **Atalho Global de Teclado:** Pressione **`F9`** em qualquer momento para Iniciar e Parar a gravação, mesmo com a janela minimizada ou em segundo plano.
- 🖥️ **Múltiplos Monitores:** Detecta automaticamente todos os monitores conectados, permitindo escolher qual tela gravar.
- 🎙️ **Áudio Opcional:** Suporte a gravação de voz (microfone) sincronizada com o vídeo com indicador inteligente de status.

---

## 🚀 Como Executar

### 1. Pré-requisitos
O ambiente virtual já está configurado na pasta `.venv/`.

### 2. Iniciar a Aplicação
No terminal (PowerShell ou Prompt de Comando), execute:
```powershell
.venv\Scripts\python main.py
```

---

## 📦 Como Gerar o Executável Standalone (.EXE)

Para compilar em um único arquivo executável portátil que roda sem precisar de Python instalado:
```powershell
.venv\Scripts\python build_exe.py
```
O executável final será gerado na pasta `dist/RPsecRecorder.exe`.

---

## 🧪 Como Executar a Bateria de Testes

Para rodar a suíte completa de testes de aceitação E2E, integridade H.264 e robustez:
```powershell
.venv\Scripts\python tests/test_acceptance_e2e.py
```

Para rodar os testes unitários do motor e da interface:
```powershell
.venv\Scripts\python tests/test_recorder.py
.venv\Scripts\python -m unittest tests/test_ui.py
```

---

## 👥 Equipe de Agentes REA
- **PMO & Tech Lead (`pmo_lead`)**: Planejamento, arquitetura e governança.
- **Dev 1 - Core Engine (`dev1_engine`)**: Motor de captura MSS, codificação H.264 e sincronização de áudio.
- **Dev 2 - UI/UX (`dev2_ui_ux`)**: Interface CustomTkinter, diálogos de salvamento e atalho global F9.
- **QA & Reliability (`qa_tester`)**: Suíte de testes automatizados, confiabilidade e integridade de mídia.
