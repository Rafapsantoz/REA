---
trigger: always_on
---

# Diretrizes de Sincronização Git Multi-Máquina

1. **Contexto:** O projeto é desenvolvido ativamente em duas máquinas (Máquina do Trabalho e Máquina Pessoal).
2. **Rotina de Entrada (ao sentar na máquina):**
   - Sempre executar `git pull origin main` antes de iniciar uma nova tarefa.
   - Se houver pendências locais não commitadas, fazer stash ou commit antes de puxar.
3. **Rotina de Saída (ao encerrar o período na máquina):**
   - Verificar `git status`.
   - Executar o build do projeto modificado (`cmd /c "npm --prefix rpsec_balcao run build"` ou teste em Python).
   - Commitar com mensagem clara e descritiva (`feat:`, `fix:`, `docs:`, `refactor:`).
   - Executar `git push origin main` para que a outra máquina receba o estado atualizado imediatamente.
4. **Segurança:** Nunca commitar arquivos `.env`, chaves de API particulares, senhas de banco ou dados sensíveis.
