# Subir o NOC na VPS com o Claude Code

Passo a passo para você preparar a VPS e deixar o Claude Code (Opus) instalar tudo, seguindo a arquitetura do [VPS.md](VPS.md). No fim, o servidor fica:

- com o jogo em HTTPS e instalável como app;
- com o ranking no seu próprio PostgreSQL;
- com backup diário;
- atualizando sozinho a partir do GitHub.

## Parte 1: o que você faz antes (10 minutos)

1. **VPS:** Ubuntu 24.04 LTS, 1 a 2 GB de RAM, 20 GB ou mais de disco. Anote o IP público.
2. **DNS:** no painel do domínio, crie (ou altere) o registro:

   | Tipo | Nome | Valor | TTL |
   |---|---|---|---|
   | A | `noc` | IP da VPS | 300 |

   Se o `noc.zioncore.com.br` aponta hoje para outro servidor, ele continua no ar até você trocar este registro. Se usar Cloudflare, deixe a nuvem **cinza** até o HTTPS sair.
3. **Firewall do provedor** (painel da VPS, se houver): libere as portas 22, 80 e 443.
4. **Usuário com sudo e chave SSH:** entre na VPS com o seu usuário (não use root no dia a dia).
5. **Sudo sem senha só durante a instalação.** O Claude Code não consegue digitar a senha do `sudo`. Libere temporariamente; o próprio roteiro remove no fim:
   ```bash
   echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/90-claude-setup
   sudo chmod 440 /etc/sudoers.d/90-claude-setup
   ```
6. **Sessão que não cai:** rode dentro do `tmux`, para a instalação seguir se a sua conexão SSH cair:
   ```bash
   sudo apt-get install -y tmux
   tmux new -s noc          # para voltar depois: tmux attach -t noc
   ```
7. **Abra o Claude Code com o Opus** numa pasta de trabalho:
   ```bash
   mkdir -p ~/noc-setup && cd ~/noc-setup
   claude --model opus
   ```
   Deixe as permissões no modo padrão: o Claude pede para você aprovar cada comando. Leia antes de aprovar.
8. **Cole o prompt da Parte 2**, trocando `noc.zioncore.com.br` e `seu@email.com` se for o caso.

### Se for migrar o ranking do Supabase

Tenha à mão a senha do banco do Supabase. Ela é usada só na Fase 4, e o Claude vai pedir:

- No painel do Supabase, clique em **Connect** (no topo do projeto) e copie a connection string do **Session pooler**. Ela começa com `postgresql://postgres.ytjnmbufaqpwbcxxaqrd:...@aws-...pooler.supabase.com:5432/postgres`.
- Se não lembra a senha: **Project Settings → Database → Reset database password**.

Essa senha dá acesso total ao banco do Supabase. Passe ao Claude só na hora da Fase 4. Depois da migração, troque a senha ou pause o projeto.

## Parte 2: o prompt

Copie tudo entre as linhas e cole no Claude Code do servidor.

---

```text
Você vai instalar e deixar rodando, nesta VPS, o jogo "NOC: Última Linha de Defesa"
(repositório público https://github.com/umbralgml/noc-defesa, branch main), com o ranking
num PostgreSQL próprio. Trabalhe em português.

DADOS
- Domínio: noc.zioncore.com.br
- E-mail para o Let's Encrypt: seu@email.com
- Pasta do jogo: /var/www/noc-defesa (criada pelo instalador)
- Pasta de trabalho e relatório: ~/noc-setup

ANTES DE TUDO
1. Baixe o repositório numa pasta temporária (git clone --depth 1 para ~/noc-setup/repo) e LEIA:
   docs/VPS.md (arquitetura, é a fonte da verdade), docs/VPS-CLAUDE.md (este roteiro),
   deploy/install.sh, deploy/vps/instalar-api.sh e os arquivos de deploy/vps/.
2. Use os scripts do repositório. Não reescreva por conta própria o que eles já fazem.
   Se algo nos scripts falhar ou não servir para este servidor, pare, explique e proponha a
   correção antes de improvisar.

REGRAS
- Só as portas 22, 80 e 443 abertas para a internet. PostgreSQL (5432) e PostgREST (3000)
  só em 127.0.0.1. Nunca mude isso.
- Não faça commit nem push em nenhum repositório. Não edite arquivos em /var/www/noc-defesa
  (a atualização automática sobrescreve). Ajustes de servidor vão em /etc.
- Senhas: nunca mostre no terminal, em logs, no relatório ou em arquivos com permissão aberta.
  Use arquivos com modo 600/640 e apague os temporários no fim.
- Pergunte antes de qualquer coisa destrutiva ou difícil de desfazer: apagar dados, remover
  pacotes ou sites que já existiam, mexer na configuração do SSH, ativar o firewall.
- Não se tranque fora do SSH: libere o OpenSSH no ufw ANTES de ativá-lo, e só desative login
  por senha depois que eu confirmar que entro com chave numa sessão nova.
- Depois de cada fase, mostre o resultado das verificações. Se uma verificação falhar,
  investigue a causa e me explique antes de seguir.

FASE 0 — RECONHECIMENTO (não mude nada ainda)
- Versão do sistema, arquitetura, RAM, disco livre e se há systemd.
- Quem escuta nas portas 80, 443, 5432 e 3000 (ss -tlnp). Se já houver Apache, Caddy, Docker,
  Traefik ou outro PostgreSQL, me conte antes de seguir.
- IP público (curl -4 -s https://ifconfig.me) e se o domínio já resolve para ele
  (getent hosts noc.zioncore.com.br). Se não resolver para este IP, pare e me avise:
  sem isso o HTTPS não sai.
- Me mostre um resumo e o plano das próximas fases. Espere o meu OK.

FASE 1 — BASE DO SERVIDOR
- apt update e upgrade; fuso America/Sao_Paulo (timedatectl).
- unattended-upgrades ligado para atualizações de segurança.
- ufw: allow OpenSSH, 80/tcp e 443/tcp; depois enable (confirme comigo antes do enable).
- fail2ban com a jail do sshd.
- SSH: me pergunte se já entro com chave. Se sim, proponha PasswordAuthentication no e
  PermitRootLogin no, e só aplique depois que eu testar o login numa sessão nova.
Verificação: ufw status, systemctl is-active fail2ban unattended-upgrades.

FASE 2 — O JOGO (site, HTTPS, PWA e atualização automática)
- Rode: sudo bash ~/noc-setup/repo/deploy/install.sh noc.zioncore.com.br seu@email.com
Verificações:
- curl -sI https://noc.zioncore.com.br/ responde 200, com certificado válido.
- https://noc.zioncore.com.br/manifest.webmanifest com content-type application/manifest+json.
- https://noc.zioncore.com.br/sw.js e /src/main.js respondem 200.
- https://noc.zioncore.com.br/tools/ranking.sql e /.git/HEAD respondem 403.
- http:// redireciona para https://.
- systemctl list-timers mostra noc-defesa-update; sudo noc-atualizar roda sem erro.
- O arquivo do site no nginx tem a linha "include /etc/nginx/snippets/noc-defesa-*.conf".

FASE 3 — BANCO E API DO RANKING (PostgreSQL + PostgREST)
- Rode: sudo bash /var/www/noc-defesa/deploy/vps/instalar-api.sh
Verificações:
- systemctl is-active postgresql postgrest nginx.
- ss -tlnp: 5432 e 3000 só em 127.0.0.1.
- curl -s 'https://noc.zioncore.com.br/rest/v1/ranking_top?limit=3' responde [] (ou a lista).
- curl -s 'https://noc.zioncore.com.br/rest/v1/ranking?select=player' dá "permission denied".
- curl -s -o /dev/null -w '%{http_code}' -X DELETE 'https://noc.zioncore.com.br/rest/v1/ranking'
  dá 403.
- Um POST de teste em /rest/v1/ranking com {"player":"<uuid aleatório>","name":"Teste Instalação",
  "board":"campanha","score":1,"stars":0} dá 201. Depois APAGUE essa linha como postgres
  (delete from ranking where name = 'Teste Instalação').
- Um POST com score 999999 é recusado (check constraint).
- ls /var/backups/noc tem um .dump; systemctl list-timers mostra noc-backup.
- /usr/local/bin/noc-pos-atualizar existe e é executável.

FASE 4 — MIGRAR O RANKING DO SUPABASE (pergunte se eu quero fazer agora)
- Peça a connection string do Session pooler do Supabase. Grave num ~/.pgpass temporário
  (modo 600) ou numa variável só da sessão. Nunca a mostre.
- Descubra a versão do PostgreSQL do Supabase (select version()). Se for maior que a do
  pg_dump local, instale o postgresql-client da mesma versão pelo repositório oficial do
  PostgreSQL (apt.postgresql.org), sem trocar o servidor local.
- pg_dump só dos dados: --data-only --table=public.ranking --table=public.metricas -Fc,
  salvo em /var/backups/noc/supabase-AAAAMMDD.dump (dono root, modo 600). Se a tabela
  metricas não existir lá, siga só com ranking.
- Restaure no banco local: cat arquivo | sudo -u postgres pg_restore --data-only -d noc
- Confira: as contagens de linhas e o top 10 de ranking_top batem com o Supabase.
- Apague o ~/.pgpass temporário e qualquer arquivo com a senha.

FASE 5 — APONTAR O JOGO PARA A API PRÓPRIA
- NÃO edite o servidor para isso. Me diga exatamente o conteúdo do src/config.json:
  { "ranking": { "url": "https://noc.zioncore.com.br", "key": "" } }
  Eu altero no GitHub (ou peço ao Claude no meu computador).
- Depois que eu avisar que mudou: sudo noc-atualizar e confira que
  https://noc.zioncore.com.br/src/config.json já mostra a nova url.
- Teste no navegador headless se tiver (ou me peça para testar no celular): o ranking da tela
  inicial carrega e uma fase vencida aparece no ranking_top.

FASE 6 — ENTREGA
- Rode um check final de tudo das fases 2 e 3 de novo.
- Escreva ~/noc-setup/RELATORIO.md com:
  - o que foi instalado, com versões;
  - os serviços e timers;
  - onde ficam as configurações, os logs e os backups;
  - como atualizar, voltar versão, restaurar backup e ver as métricas;
  - os pontos de atenção que você encontrou.
  Sem nenhuma senha no relatório.
- Sugira como copiar os backups para fora da VPS (rclone ou scp) e pergunte se eu quero
  configurar agora.
- Por último, me lembre e, com o meu OK, remova o sudo sem senha:
  sudo rm /etc/sudoers.d/90-claude-setup
```

---

## Parte 3: depois da instalação

- **Teste no celular:** abra `https://noc.zioncore.com.br`. Toque em **📲 INSTALAR APP**, jogue uma fase e veja seu nome no ranking.
- **Troque o `src/config.json` no GitHub** quando o Claude pedir (Fase 5). A partir daí, o GitHub Pages e a VPS usam o mesmo ranking, no seu banco.
- **Atualizações:** tudo que entra na `main` chega à VPS em até 15 minutos, inclusive mudanças no banco (`tools/ranking.sql`), com backup automático antes. Não precisa entrar no servidor.
- **Supabase:** depois de algumas semanas com tudo rodando, pause ou apague o projeto.

## Checklist rápido

- [ ] `https://noc.zioncore.com.br` abre com cadeado e o botão de instalar aparece
- [ ] `https://noc.zioncore.com.br/rest/v1/ranking_top?limit=3` responde
- [ ] `ss -tlnp` mostra 5432 e 3000 só em 127.0.0.1
- [ ] `systemctl list-timers` mostra `noc-defesa-update`, `noc-backup` e `certbot`
- [ ] `/var/backups/noc` tem backup do dia
- [ ] `src/config.json` no GitHub aponta para o domínio, com `"key": ""`
- [ ] `/etc/sudoers.d/90-claude-setup` removido
