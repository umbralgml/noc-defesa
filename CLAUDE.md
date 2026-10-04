# CLAUDE.md

Guia para trabalhar neste repositório.

## O projeto

"NOC: Última Linha de Defesa" é um jogo **educativo** de redes e segurança, em português do Brasil, que roda no navegador (celular primeiro). O jogador é o analista de plantão contra o hacker Z3R0 ao longo de 46 fases: um Prólogo para iniciantes, a Formação N1 e 7 atos de dificuldade crescente (inclui um ato de Linux). É publicado no GitHub Pages: https://umbralgml.github.io/noc-defesa/

O objetivo principal é **ensinar**. Diversão é o veículo. Toda mudança de conteúdo precisa manter isto: aula antes (`lesson`), explicação a cada jogada (`why`/`explain`) e revisão dos erros no fim.

## Restrições que não mudam

- **Sem build e sem framework.** HTML, CSS e JavaScript puro com ES modules nativos. O GitHub Pages serve o repositório como está. Não adicione bundler, TypeScript, npm dependencies nem `package.json` obrigatório.
- **Sem dependências externas em runtime**, além das fontes do Google Fonts no `index.html`. Áudio é sintetizado com Web Audio e gráficos são SVG gerado em código.
- **O progresso salvo usa o título da fase como chave** (`localStorage` `noc_prog` e `noc_best`, ver `K()` em `state.js`). Nunca renomeie o `title` de uma fase publicada sem migrar o progresso.
- Precisa de servidor HTTP para rodar (módulos e `fetch` não funcionam em `file://`).

## Rodar e validar

```bash
python3 -m http.server 8000             # jogo em http://localhost:8000
node tools/validar-fases.mjs            # valida todos os JSON de fase (Node 18+)
```

O validador sai com código 1 se houver erro estrutural e lista avisos de conteúdo didático faltando.

Teste de ponta a ponta (opcional, precisa do Playwright: `npm i -g playwright`):

```bash
node tools/testes/campanha.mjs     # joga todas as fases num Chromium; código 1 se algo travar ou der erro no console
```

Rode depois de qualquer mudança no motor ou em fases. Tipo de fase novo precisa de roteiro nesse teste.

## Arquitetura

```
index.html            marcação das 3 telas (#title com aside de novidades, #map, #game), modal, #fx; carrega src/style.css e src/main.js
src/style.css         todo o CSS (tokens em :root; seções por tela/componente)
manifest.webmanifest  PWA (nome, ícones em src/icons/, cores); caminhos relativos para funcionar em /noc-defesa/ e na raiz
sw.js                 service worker: rede primeiro com cache de reserva (offline); lista CORE com todos os módulos
deploy/install.sh     instalador para Ubuntu/Debian (nginx ou Apache existente, Let's Encrypt, atualização a cada 15 min)
deploy/vps/           API própria do ranking: instalar-api.sh (PostgreSQL + PostgREST + nginx /rest/v1/ + backup), roles.sql, configs
src/main.js           entrada: cena do título, botões do título, init dos motores, loadLevels(), loadNews()
src/changelog.json    { "versions": [ { "v", "date", "title", "items" } ] }, mais recente primeiro
src/config.json       { "ranking": { "url", "key" } }: Supabase (url + key publishable) ou API própria na VPS (só url, key vazia); url vazia = ranking desligado
src/levels/
  index.json          { "acts": ["ato1.json", ...] } na ordem do mapa
  prologo.json, formacao.json, atoN.json, linux.json   { "tag", "name", "diff", "story", "levels": [ ... ] }
src/engine/
  util.js             $, shuffle, fmt, center, buzz, esc, store (localStorage com JSON); sem dependências
  state.js            S (estado da partida; S.lv = fase atual), LEVELS, ACTS, save, K, unlocked, resetProgress, progress
  levels.js           loadLevels(): fetch dos JSON; cada fase recebe .act = índice do ato
  scene.js            SVG das cenas por `loc`, herói animado, avatares, MEDIA (cabos) e ícones
  audio.js            Web Audio: au() (desbloqueia no 1º gesto), sfx, music(), setMute()
  ui.js               telas, modal, toast, partículas, HP/pontos, good()/damage(),
                      explain() (painel #coach), lessonHTML(), reviewHTML(), flow
  game.js             mapa, briefing, play(L)/intro, win/fail, botão de dica, askReset(); ENGINES por type
  daily.js            desafio diário: sorteio com a data como semente, sequência, compartilhar, duelo
  gen.js              geradores de pergunta: GEN (desafio diário, não mexer sem querer mudar o dia) e ACAD (Academia); sem DOM
  glossary.js         GLOSS: termo, apelidos e definição; findGloss(texto)
  study.js            aula em cartões com a pergunta "check" no briefing; sala de estudo (biblioteca de aulas + glossário)
  academy.js          Academia de exercícios: temas com perguntas geradas, sem perder integridade (quiz com `free`), domínio = 10 seguidas
  rank.js             ranking opcional via REST do Supabase (sem SDK): perfil, consentimento, envio e leitura
  pwa.js              registra o sw.js e controla o botão "INSTALAR APP" (pedido nativo ou instruções do iPhone)
  news.js             linha do tempo de atualizações da tela inicial; selo NOVO até o jogador iniciar o turno
  wire.js             tipo "wire" (ligar pares)
  drop.js             tipo "drop" (modes "buckets" e "slots")
  quiz.js             tipo "quiz" (e chefe com "boss")
  term.js             tipo "term": terminal simulado (comandos com saída fixa, alias, diagnóstico em passos)
  steps.js            perguntas de diagnóstico em passos, comuns ao "term" e ao "topo"
  defense.js          tipo "defense": pacotes em ondas, regras de firewall ligadas em tempo real
  topo.js             tipo "topo": diagrama da rede, ping animado, apontar a falha
  pcap.js             tipo "pcap": captura estilo Wireshark, filtros de exibição, classificar pacotes
  netlib.js           lógica de rede pura (casamento de regra, caminho na topologia, compilador de filtro); o validador também importa
  z3r0.js             eventos do Z3R0 durante a fase (glitch, embaralhar, ataque relâmpago), na medida do `diff` do ato
  bank.js             banco de erros (localStorage noc_bank) em formato de quiz; sem dependências de tela
  train.js            treino dos seus erros: quiz com os itens do banco; 2 acertos seguidos tiram o item
  career.js           XP e cargos (Estagiário → Arquiteto de Redes)
  ach.js              conquistas (lista ACH), faixa no topo (#achv), vitrine; stat() para contadores
  prefs.js            visual do analista (camisa/cabelo/pele/acessório em variáveis CSS do HERO) e acessibilidade (classes hc, big, calm no <html>)
  cert.js             certificado PNG por ato concluído (canvas), baixar ou compartilhar
  room.js             sala do NOC no topo do mapa: herói anda (toque/setas), câmera acompanha, estação abre os incidentes do `loc`
tools/validar-fases.mjs
docs/CRIAR-FASE.md    formato completo de cada tipo de fase, com exemplos
```

### Grafo de dependências (sem ciclos)

`util` ← `scene`, `audio`, `state` ← `ui` ← `rank` ← `wire`, `drop`, `quiz`, `steps` ← `term`, `topo`, `defense`, `pcap` (+ `netlib`) ← `game` ← `daily`, `room` ← `main` (e `util` ← `news`, `pwa`, `prefs` ← `main`; `rank` ← `cert` ← `game`)

Os motores de fase **não importam `game.js`**. Para terminar a fase eles chamam `flow.win()` / `flow.fail(msg)`, ganchos de `ui.js` que o `game.js` preenche em `initGame()`. Do mesmo jeito, `flow.map()` (cartão do desafio no mapa) é preenchido pelo `daily.js`, `flow.room()` (placas da sala) pelo `room.js` e `hooks.joined` do `rank.js` também. Mantenha assim para não criar import circular.

### Fases fora do mapa

`play(L, nome)` roda qualquer objeto de fase. Se `L` não está em `LEVELS` (`S.cur = -1`), nada é salvo em `noc_prog`. Com `L.onWin(res)`, a fase trata o próprio fim (`res = { score, hp, bonus, total }`). É assim que o desafio diário funciona. O quiz mostra cronômetro sempre que `L.time` existir e registra `S.qlog` (acerto por pergunta) e `S.left` (segundos que sobraram nos acertos).

### Ciclo de uma fase

1. `brief(i)` abre o modal com Z3R0, analista, `lesson` e `goal`.
2. `startLevel(i)` → `play(L)` zera `S` (hp, err, score, combo, miss), monta a cena e anima o herói até `HX[loc]`.
3. `finishIntro()` chama `ENGINES[L.type](L)`, que desenha `#stage` (e `#bank` em `drop`).
4. Cada jogada chama `good()` ou `damage(n)` e `explain(ok, rótulo, why)`. Erros entram em `S.miss`.
5. Quando `S.placed >= S.need` (ou o quiz termina), `flow.win()`: estrelas por `S.err` (0 = 3, até 2 = 2, senão 1), bônus = hp × 5, salva e mostra `learn` + `reviewHTML()`.
6. `S.hp <= 0` chama `flow.fail()`, que mostra `tip` + revisão.

### Adicionar um tipo de fase novo

Crie `src/engine/<tipo>.js` exportando `render<Tipo>(L)` (e `reset<Tipo>()` / `init<Tipo>()` se tiver listeners ou estado de arrasto), registre em `ENGINES` e em `cleanup()` no `game.js`, chame o init em `main.js`, acrescente a validação em `tools/validar-fases.mjs` e documente em `docs/CRIAR-FASE.md`.

## Convenções

- **Idioma:** tudo que o jogador vê é pt-BR. Comentários de código também em pt-BR, curtos. Nomes de variáveis e funções seguem o estilo existente (curto, em inglês: `L`, `S`, `sel`, `renderDrop`).
- **Estilo do JS:** compacto, igual ao código existente. `const $ = id => ...`, funções pequenas, template strings para HTML, `;` no fim, aspas simples, 2 espaços. Sem classes, sem bibliotecas.
- **Texto do jogador:** conteúdo vindo do JSON em campos de texto (`t`, `s`, `why`, `q`, opções) vai por `textContent`. Só os campos documentados como HTML (`goal`, `intro`, `z`, `me`, `lesson`, `tip`, `learn`, `html`, `label`) vão por `innerHTML`.
- **Tom do conteúdo:** frases curtas e diretas, voz de analista de plantão. O Z3R0 provoca, o analista responde com o conceito. Explicações dizem o que o item é e por que vai onde vai, nunca só "certo" ou "errado".
- **Precisão técnica:** o jogo ensina, então o conteúdo precisa estar certo. Confira em RFC, documentação de fabricante ou NIST. Cuidado com pegadinhas de faixa (/12, /10), porta de origem x destino e maxLength de ROA.
- **Mobile primeiro:** layout máximo de 720px, toque e arrasto com Pointer Events, sem hover obrigatório. Teste em ~390px de largura.
- **Fases novas** entram só pelo JSON sempre que possível. Rode o validador sem erros nem avisos antes de commitar.
- **Changelog:** toda mudança que o jogador percebe ganha uma entrada no topo de `src/changelog.json` (versão `1.x`, data `AAAA-MM-DD`, título divertido curto e 3 a 5 itens em linguagem de jogador). Ela aparece na tela inicial com o selo NOVO (`localStorage` `noc_seen_ver`).
- **Desafio diário:** o sorteio depende da data (fuso de Brasília) e do conteúdo de `LEVELS` e `GEN` (em `gen.js`). Gerador novo para a Academia vai em `ACAD`, nunca em `GEN`. Mudar os geradores ou os quizzes muda as perguntas do dia para todo mundo; quiz novo entra com `"dailyFrom": "<amanhã>"` para não mexer no desafio em curso. Todo gerador devolve `why` na pergunta e em cada opção errada.
- **Duelo:** o link `?d=AAAA-MM-DD&p=pts&g=10111&n=nome` reabre as perguntas daquela data (`readChallenge()` valida tudo e limpa a URL). Só conta como desafio oficial se for de hoje e o jogador ainda não tiver jogado. Mudar quizzes ou geradores muda as perguntas de datas passadas também; duelos antigos podem divergir.
- **Sala do NOC:** estações em `STATIONS` (`scene.js`) por `loc`; um `loc` novo precisa de estação lá e de desenho em `sceneSVG`.
- **Ranking:** a chave em `src/config.json` é a publishable/anon (pública). Nunca commite a secret/service_role. Permissões e moderação em `tools/ranking.sql` e `docs/RANKING.md`. O perfil é pedido no primeiro turno (`ensureProfile`); sem nome, o jogador aparece como `Analista #XXXX` (`anonName()`). Nome e LinkedIn só saem do aparelho com consentimento marcado (`publicName()`/`publicLinkedin()`); sem ele, envia o apelido anônimo.
- **Aula e checagem:** o briefing mostra a `lesson` em cartões e, no fim, a pergunta `check` (sem custo; +5 XP no primeiro acerto). Fase iniciante/básico sem `check` gera aviso no validador. Negritos das aulas que batem com o glossário viram tocáveis (`linkGloss()` em `ui.js`); termo novo entra em `glossary.js`.
- **Treino sem pressão:** em iniciante/básico o briefing oferece jogar com `S.practice`: o erro conta e explica, mas `damage()` não tira integridade, a dica aparece no 1º erro e nada é salvo.
- **Modo difícil:** liberado no briefing da fase com 3 estrelas. `S.hard` dobra o dano (`damage()`) e soma um evento do Z3R0. Vencer sem erro grava o título em `noc_gold` (estrela de ouro, destrava a camisa dourada).
- **Acessibilidade:** todo elemento jogável precisa funcionar com Tab + Enter/espaço. Animação nova deve respeitar a classe `calm` (o CSS já zera animações; pacotes que se movem por transição ficam de fora).
- **Métricas:** `metric('win'|'fail')` em `rank.js` envia só dados anônimos da fase, e só se o jogador não desligou no perfil (`noc_metricas`).
- **PWA/offline:** módulo novo em `src/engine/` ou ato novo em `src/levels/` precisa entrar na lista `CORE` do `sw.js` (o validador acusa). Todos os caminhos são relativos (`./`), porque o jogo roda em `/noc-defesa/` no GitHub Pages e na raiz do domínio próprio.
- **Deploy:** o GitHub Pages publica a `main`; o servidor próprio (`docs/SERVIDOR.md`, arquitetura completa em `docs/VPS.md`) puxa a `main` a cada 15 minutos e roda o `noc-pos-atualizar` (aplica o `tools/ranking.sql` se ele mudou, com backup antes). Não há outro passo de publicação.
- **Banco do ranking:** `tools/ranking.sql` precisa ser idempotente (roda de novo a cada mudança, no Supabase e na VPS). O cliente fala com a API REST (PostgREST/Supabase) em `/rest/v1/`; o `sw.js` nunca guarda esse caminho em cache.
- **Fase nova no meio da campanha:** marque com `"novo": true`. Ela ganha o selo NOVA no mapa e fica liberada para quem já tem estrela em alguma fase depois dela (`unlocked()` em `state.js`), então ninguém trava no meio do caminho.
- **Dificuldade gradativa:** o jogo é para quem nunca viu rede até quem trabalha num NOC. Cada ato tem `diff` (iniciante → avançado, só sobe). Iniciante/básico: analogias, sem cronômetro, dica automática no 2º erro (`hint()` em `ui.js`). Pressão (tempo, eventos do Z3R0) só a partir de intermediário. A primeira fase tem `"tutorial": true`.
- **Linux:** muita coisa de rede roda em Linux, então há um ato próprio e o Prólogo já apresenta o terminal (`ip a`, `ping`). Fases `term` com `prompt` Linux. Saídas de comando realistas (copie de um sistema de verdade).
- **História:** `story` no ato, mostrada uma vez (`noc_story`) com o chefe do NOC (`AV_CHEFE`), o analista e o Z3R0.
- **Eventos do Z3R0:** nunca em iniciante/básico, tutorial, desafio diário, treino ou com `localStorage.noc_teste` (usado pelo teste automático). Falhar no ataque relâmpago tira integridade mas não conta como erro (não tira estrela).
- **Treino:** todo erro de jogada grava no banco (`bankAdd`/`bankWhy`). Tipo de fase novo precisa gravar os erros dele também.
- **XP e conquistas:** `addXP()` e `unlock(id)`; mostre o ganho com `xpHTML()`. Conquista nova entra na lista `ACH` de `ach.js` com o gatilho no lugar certo. "Zerar progresso" não apaga XP nem conquistas.
- **CSS:** cores pelos tokens de `:root` (`--acc`, `--bad`, `--warn`, `--z`, `--panel`...). Fontes: Orbitron para rótulos, JetBrains Mono para dados técnicos, system-ui para texto corrido.
