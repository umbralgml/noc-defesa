# CLAUDE.md

Guia para trabalhar neste repositório.

## O projeto

"NOC: Última Linha de Defesa" é um jogo **educativo** de redes e segurança, em português do Brasil, que roda no navegador (celular primeiro). O jogador é o analista de plantão contra o hacker Z3R0 ao longo de 15 fases em 4 atos. É publicado no GitHub Pages: https://umbralgml.github.io/noc-defesa/

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

O validador sai com código 1 se houver erro estrutural e lista avisos de conteúdo didático faltando. Não existe suíte de testes automatizados; para mudanças no motor, jogue as fases afetadas no navegador (ou dirija com Playwright), incluindo erros de propósito.

## Arquitetura

```
index.html            marcação das 3 telas (#title, #map, #game), modal, #fx; carrega src/style.css e src/main.js
src/style.css         todo o CSS (tokens em :root; seções por tela/componente)
src/main.js           entrada: cena do título, botões do título, init dos motores, loadLevels()
src/levels/
  index.json          { "acts": ["ato1.json", ...] } na ordem do mapa
  atoN.json           { "tag", "name", "levels": [ ... ] }
src/engine/
  util.js             $, shuffle, fmt, center, buzz, esc (sem dependências)
  state.js            S (estado da partida), LEVELS, ACTS, save, K, unlocked, resetProgress
  levels.js           loadLevels(): fetch dos JSON; cada fase recebe .act = índice do ato
  scene.js            SVG das cenas por `loc`, herói animado, avatares, MEDIA (cabos) e ícones
  audio.js            Web Audio: au() (desbloqueia no 1º gesto), sfx, music(), setMute()
  ui.js               telas, modal, toast, partículas, HP/pontos, good()/damage(),
                      explain() (painel #coach), lessonHTML(), reviewHTML(), flow
  game.js             mapa, briefing, startLevel/intro, win/fail, botão de dica; ENGINES por type
  wire.js             tipo "wire" (ligar pares)
  drop.js             tipo "drop" (modes "buckets" e "slots")
  quiz.js             tipo "quiz" (e chefe com "boss")
tools/validar-fases.mjs
docs/CRIAR-FASE.md    formato completo de cada tipo de fase, com exemplos
```

### Grafo de dependências (sem ciclos)

`util` ← `scene`, `audio`, `state` ← `ui` ← `wire`, `drop`, `quiz` ← `game` ← `main`

Os motores de fase **não importam `game.js`**. Para terminar a fase eles chamam `flow.win()` / `flow.fail(msg)`, ganchos de `ui.js` que o `game.js` preenche em `initGame()`. Mantenha assim para não criar import circular.

### Ciclo de uma fase

1. `brief(i)` abre o modal com Z3R0, analista, `lesson` e `goal`.
2. `startLevel(i)` zera `S` (hp, err, score, combo, miss), monta a cena e anima o herói até `HX[loc]`.
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
- **CSS:** cores pelos tokens de `:root` (`--acc`, `--bad`, `--warn`, `--z`, `--panel`...). Fontes: Orbitron para rótulos, JetBrains Mono para dados técnicos, system-ui para texto corrido.
