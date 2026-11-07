# ⚡ RPsec Link — Diretrizes de Engenharia & Arquitetura

> **Subprojeto:** RPsec Link (Acesso Remoto Ultraleve & Alternativa ao AnyDesk/TeamViewer)  
> **Squad Responsável:** `dev1_engine`, `qa_tester`, CTO Marcus.

---

## 🎯 Propósito do Produto
Prover acesso remoto e controle de tela para máquinas Windows sem telas de bloqueio comercial, sem limites de sessão, com latência mínima (< 50ms) e consumo irrisório de hardware (< 35MB de RAM), operando via interface web HTML5 (zero instalação na máquina cliente).

---

## ⚙️ Diretrizes Técnicas

1. **Captura via Win32 GDI:**
   - O thread deve sempre estar anexado ao desktop ativo do usuário (`OpenInputDesktop` + `SetThreadDesktop`) para permitir captura em segundo plano ou durante sessões remotas.
   - Reutilização estrita de HDCs (`CreateCompatibleDC`), HBITMAPs e buffers de memória para evitar vazamento de memória e chamadas excessivas ao SO.
2. **Compressão em Tempo Real:**
   - Uso de compressão JPEG em C++ via OpenCV (`cv2.imencode`) para atingir de 20 a 30 FPS estáveis.
3. **Simulação de Input Seguro:**
   - Conversão de coordenadas normalizadas (0.0 a 1.0) recebidas do Canvas web para as coordenadas nativas da tela (`width` x `height`).
   - Suporte a Unicode nativo (`KEYEVENTF_UNICODE`) para prevenir desconfiguração de layout de teclado entre as máquinas.
4. **Sem Dependência de Servidores Centrais:**
   - Operação P2P direta via WebSocket. Na rede local, acesso via IP direto; fora da rede local, compatível com Tailscale, ZeroTier ou Cloudflare Tunnel.
