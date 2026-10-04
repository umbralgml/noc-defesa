# Arquitetura no servidor próprio (VPS)

Este documento descreve como o NOC roda numa VPS com tudo próprio: o jogo, o HTTPS, o banco do ranking, a API, o backup e as atualizações. Para executar a instalação com o Claude Code no servidor, siga o [VPS-CLAUDE.md](VPS-CLAUDE.md).

## Visão geral

```
                      Internet
                         │  443 (HTTPS)   80 (só redireciona)
                         ▼
┌──────────────────────── VPS (Ubuntu 24.04) ────────────────────────┐
│                                                                    │
│  nginx ─────────────┬─ /            arquivos do jogo               │
│  (TLS Let's Encrypt)│               /var/www/noc-defesa            │
│                     │               (HTML, JS, JSON, PWA)          │
│                     │                                              │
│                     └─ /rest/v1/ ─► PostgREST 127.0.0.1:3000       │
│                        (limite por IP)        │                    │
│                                               ▼                    │
│                                     PostgreSQL 127.0.0.1:5432      │
│                                     banco "noc"                    │
│                                     ranking · metricas · visões    │
│                                                                    │
│  timers: noc-defesa-update (15 min) · noc-backup (diário 03:30)    │
│          certbot (renovação do HTTPS)                              │
└────────────────────────────────────────────────────────────────────┘
          ▲                                          ▲
          │ git fetch a cada 15 min                  │ mesmo ranking
     GitHub (branch main) ─────► GitHub Pages ───────┘ (o jogo do Pages
                                                       também usa esta API)
```

- **Portas abertas na internet:** 22 (SSH), 80 e 443. PostgreSQL (5432) e PostgREST (3000) escutam só em `127.0.0.1`.
- **O progresso do jogador fica no navegador** (`localStorage`). O banco guarda só o ranking e as métricas anônimas. Se o banco cair, o jogo continua funcionando; só o ranking some até voltar.

## Componentes

| Componente | Papel | Onde |
|---|---|---|
| **nginx** | HTTPS, arquivos estáticos, gzip, cabeçalhos de segurança, proxy da API com limite por IP | `/etc/nginx/sites-available/noc-defesa.conf` (gerado pelo `deploy/install.sh`) + `/etc/nginx/snippets/noc-defesa-api.conf` + `/etc/nginx/conf.d/noc-defesa-api-zone.conf` |
| **Let's Encrypt (certbot)** | Certificado HTTPS e renovação automática | timer do certbot |
| **Jogo** | Site estático, sem build | `/var/www/noc-defesa` (clone do GitHub) |
| **PostgreSQL** | Banco `noc`: tabelas `ranking` e `metricas`, visões `ranking_top`, `ranking_equipes`, `metricas_resumo` | pacote do Ubuntu, serviço `postgresql` |
| **PostgREST** | Transforma o banco numa API REST, igual à do Supabase. O código do jogo não muda | `/usr/local/bin/postgrest`, `/etc/postgrest/noc.conf`, serviço `postgrest` |
| **Atualização** | Puxa a `main` do GitHub a cada 15 min e roda os passos extras | `noc-atualizar` + timer `noc-defesa-update` |
| **Migração do banco** | Se o `tools/ranking.sql` mudou, faz backup e aplica | `/usr/local/bin/noc-pos-atualizar` |
| **Backup** | `pg_dump` diário, 14 dias guardados | `/usr/local/bin/noc-backup`, timer `noc-backup`, `/var/backups/noc` |

Os arquivos de configuração ficam versionados em [`deploy/vps/`](../deploy/vps/), e o `deploy/vps/instalar-api.sh` instala tudo de uma vez.

## Banco de dados: PostgreSQL

**Recomendação: PostgreSQL.** É o banco certo para este jogo, por quatro motivos:

1. **Já é o que roda hoje.** O Supabase é PostgreSQL. O `tools/ranking.sql` (tabelas, limites, visões e permissões) roda sem mudar uma linha.
2. **Zero código novo no jogo.** O PostgREST oferece a mesma API REST que o Supabase usa por baixo. O jogo só troca a URL no `src/config.json`.
3. **A segurança fica no banco.** O papel público (`anon`) só insere e lê as visões. Os limites de pontuação, de nome e de LinkedIn são `check` no próprio banco, então nem uma API furada passa dados inválidos.
4. **Leve.** Ranking e métricas são poucas linhas por jogador. Uma VPS de 1 GB de RAM sobra.

| Alternativa | Por que não agora |
|---|---|
| SQLite + API escrita à mão | Simples, mas exigiria escrever e manter um backend (rotas, validação, permissões) que hoje o PostgREST entrega pronto. |
| MySQL/MariaDB | Não tem equivalente maduro ao PostgREST e exigiria reescrever o `ranking.sql` (visões com `distinct on`, permissões por coluna). |
| Continuar no Supabase | Funciona e é grátis, mas pausa projetos parados e deixa os dados fora do seu servidor. Pode ficar como reserva durante a migração. |

## API (PostgREST)

- Endereço público: `https://SEU-DOMINIO/rest/v1/` (o mesmo caminho do Supabase).
- O PostgREST entra no banco como `authenticator` e troca para `anon` em cada requisição. A senha é gerada na instalação e fica só em `/etc/postgrest/noc.conf` (modo 640). Não vai para o Git.
- O que o público pode fazer:

| Ação | Permitido |
|---|:-:|
| `POST /rest/v1/ranking` (nova pontuação) | sim |
| `GET /rest/v1/ranking_top` e `/ranking_equipes` | sim |
| `POST /rest/v1/metricas` (métrica anônima) | sim |
| Ler `ranking` cru, `metricas` ou `metricas_resumo` | não |
| `PATCH`, `PUT`, `DELETE` | não (o nginx recusa com 403, e o banco também não permite) |

- **Limites no nginx:**
  - leitura: 10 requisições/s por IP, com folga de 40;
  - gravação: 20 POST/min por IP, com folga de 10; acima disso, 429;
  - corpo da requisição: no máximo 8 KB.
- **CORS:** o PostgREST responde `Access-Control-Allow-Origin: *`, então o jogo do GitHub Pages também grava no mesmo ranking.
- O service worker (`sw.js`) nunca guarda `/rest/v1/` em cache: o ranking é sempre ao vivo.

## O jogo no servidor (PWA)

- O `deploy/install.sh` coloca o jogo em `/var/www/noc-defesa`, cria o site no nginx, emite o HTTPS e agenda a atualização.
- O jogo é instalável como app: o HTTPS e o `manifest.webmanifest` com caminhos relativos são o que o navegador exige. O botão **📲 INSTALAR APP** aparece sozinho.
- **HTML, JS e JSON** vão com `expires -1`: o navegador sempre confere se há versão nova. O service worker busca primeiro na rede, então a atualização chega no próximo carregamento, e o cache cobre o uso offline.
- Pastas `.git`, `deploy/` e `tools/` são bloqueadas (403).

## Atualizações e melhorias periódicas

```
você/Claude no seu PC ──PR──► GitHub main ──► GitHub Pages (minutos)
                                   │
                                   └──► VPS: noc-atualizar (até 15 min)
                                          ├─ git reset para a nova main
                                          └─ noc-pos-atualizar
                                               └─ ranking.sql mudou? backup + aplica + recarrega a API
```

- **Mudança de jogo** (fase, motor, visual): entra na `main` e chega sozinha. Nada a fazer no servidor.
- **Mudança no banco:** edite o `tools/ranking.sql`, sempre idempotente (`create ... if not exists`, `drop ... if exists`, `create or replace`). O `noc-pos-atualizar` faz backup e aplica.
- **Forçar agora:** `sudo noc-atualizar`.
- **Voltar uma versão:**
  1. pare o timer: `sudo systemctl stop noc-defesa-update.timer`;
  2. volte o código: `sudo git -C /var/www/noc-defesa reset --hard <commit>`;
  3. depois de corrigir na `main`, religue o timer.
- **Nunca edite arquivos em `/var/www/noc-defesa`**: a próxima atualização sobrescreve. Ajuste do servidor vai em `/etc/nginx/snippets/noc-defesa-*.conf`, que o instalador não toca.

## Backup e restauração

- **Automático:** todo dia às 03:30, em `/var/backups/noc/noc-AAAAMMDD-HHMMSS.dump`, guardando 14 dias. Também roda antes de cada migração do banco.
- **Manual:** `sudo noc-backup`.
- **Restaurar** (substitui o conteúdo atual do banco):
  ```bash
  sudo cat /var/backups/noc/noc-AAAAMMDD-HHMMSS.dump | sudo -u postgres pg_restore --clean --if-exists -d noc
  sudo -u postgres psql -d noc -c "notify pgrst, 'reload schema'"
  ```
- **Fora do servidor (recomendado):** copie `/var/backups/noc` para outro lugar de tempos em tempos, por exemplo com `rclone` para um storage ou com `scp` para o seu PC. Um backup que só existe na mesma VPS some junto com ela.

## Segurança do servidor

- SSH só com chave (`PasswordAuthentication no`), usuário próprio com `sudo` e `PermitRootLogin no`.
- `ufw` com 22, 80 e 443 abertas e o resto fechado. `fail2ban` no SSH. `unattended-upgrades` para as atualizações de segurança.
- Banco e API só em `127.0.0.1`. O instalador confere o `listen_addresses` do PostgreSQL e para se ele estiver aberto.
- Senhas só em arquivos do servidor com permissão restrita: `/etc/postgrest/noc.conf` (640) e, na migração, um `.pgpass` temporário (600) apagado no fim.
- `src/config.json` só tem a URL pública da API. Sem chave secreta nenhuma.

## Monitoramento

| O quê | Como |
|---|---|
| Serviços de pé | `systemctl status nginx postgresql postgrest` |
| Logs da API | `journalctl -u postgrest -f` |
| Logs do site | `/var/log/nginx/access.log` e `error.log` (o 429 aparece como "limiting requests") |
| Atualizações | `systemctl list-timers` e `journalctl -u noc-defesa-update` |
| Backups | `ls -lh /var/backups/noc` e `journalctl -u noc-backup` |
| De fora | um monitor gratuito (UptimeRobot, Better Stack) em `https://SEU-DOMINIO/` e `https://SEU-DOMINIO/rest/v1/ranking_top?limit=1` |
| Onde o pessoal trava | `sudo -u postgres psql -d noc -c "select * from metricas_resumo"` |

## Tamanho da VPS

| Recurso | Mínimo | Confortável |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disco | 20 GB SSD | 40 GB SSD |
| Sistema | Ubuntu 22.04 | **Ubuntu 24.04 LTS** |

O jogo é estático, e o banco recebe uma gravação por fase vencida. Centenas de jogadores simultâneos cabem com folga na configuração mínima.

## Migração do Supabase

1. Instale a VPS e a API (o banco nasce vazio).
2. Copie os dados das tabelas `ranking` e `metricas` do Supabase com `pg_dump --data-only` e restaure no banco `noc` (passo a passo no [VPS-CLAUDE.md](VPS-CLAUDE.md)).
3. Teste a API pública. Depois troque o `src/config.json` no GitHub:
   ```json
   { "ranking": { "url": "https://SEU-DOMINIO", "key": "" } }
   ```
4. Deixe o projeto do Supabase parado por algumas semanas como reserva e depois apague.
