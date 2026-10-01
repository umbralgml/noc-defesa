# Ranking público (Supabase)

O ranking é opcional. Enquanto `src/config.json` estiver com `url` e `key` vazios, os botões de ranking ficam escondidos e o jogo funciona normalmente.

O jogo grava e lê o ranking direto do navegador pela API REST do [Supabase](https://supabase.com), sem SDK e sem servidor próprio. O plano gratuito atende bem.

## O que aparece no ranking

- **Campanha:** a melhor soma de pontos de todas as fases de cada jogador, com as estrelas.
- **Desafio de hoje:** a pontuação do desafio diário do dia (horário de Brasília).

Ao iniciar o primeiro turno (ou o primeiro desafio diário), o jogo pergunta nome e LinkedIn, **ambos opcionais**:

- **Em branco (ou "PULAR"):** o jogador entra no ranking como `Analista #XXXX`, um apelido derivado do id anônimo do aparelho. Nenhum dado pessoal é enviado.
- **Com nome e/ou LinkedIn:** só aparecem no ranking público se a caixa de consentimento estiver marcada. Sem ela, o jogo envia o apelido anônimo.

O perfil pode ser trocado a qualquer momento ("trocar" na tela inicial, "editar perfil" no ranking). O ranking mostra sempre o nome mais recente de cada jogador. Cada aparelho recebe um id anônimo que separa os jogadores e nunca aparece na tela.

O top 10 aparece na tela inicial (acima das atualizações) e o ranking completo abre pelo botão 🏆.

## Configurar (uma vez, uns 10 minutos)

1. Crie uma conta em https://supabase.com e um projeto novo. Na região, escolha **South America (São Paulo)**.
2. No projeto, abra **SQL Editor**, cole o conteúdo inteiro de [`tools/ranking.sql`](../tools/ranking.sql) e clique em **Run**. Pode rodar de novo sem problema.
3. Em **Project Settings → API Keys** (ou **Data API**), copie:
   - a **Project URL** (`https://xxxx.supabase.co`);
   - a **publishable key** (`sb_publishable_...`). Em projetos antigos, use a **anon key**.
4. Preencha `src/config.json` e faça o commit:
   ```json
   {
     "ranking": {
       "url": "https://xxxx.supabase.co",
       "key": "sb_publishable_..."
     }
   }
   ```

Essa chave é pública por design: ela vai para o navegador de todo jogador. **Nunca** coloque aqui a `secret key` nem a `service_role`.

## O que o navegador pode e não pode fazer

O `tools/ranking.sql` deixa o papel público (`anon`) com o mínimo:

| Ação | Permitido |
|------|:-:|
| Inserir uma pontuação (nome, LinkedIn, quadro, pontos, estrelas) | sim |
| Ler a visão `ranking_top` (melhor resultado de cada jogador, sem o id) | sim |
| Ler a tabela crua, alterar ou apagar linhas | não |
| Marcar uma linha como escondida | não |

O banco também recusa:
- nomes fora de 2 a 24 caracteres;
- LinkedIn fora do formato `https://www.linkedin.com/in/...`;
- pontuações acima do teto possível (50.000 na campanha e 3.000 no desafio).

O painel do Supabase pode mostrar o aviso "Security Definer View" para `ranking_top`. É intencional: a visão lê a tabela com permissão do dono para que o navegador não precise (nem possa) ler a tabela crua.

## Limites honestos

- **Trapaça:** a pontuação é calculada no navegador, então alguém com conhecimento técnico consegue enviar um número falso dentro do teto. O ranking é para diversão, não para prêmio.
- **Plano gratuito:** o Supabase pausa projetos gratuitos parados há uma semana. Se o ranking parar de carregar, reative o projeto no painel. O jogo continua funcionando, só o ranking mostra "Não consegui carregar".

## Moderação e pedidos de remoção (LGPD)

- **Esconder alguém:** em **Table Editor → ranking**, marque `hidden = true` em qualquer linha do jogador. Ele some do ranking inteiro.
- **Apagar de vez:** no mesmo lugar, apague as linhas do jogador. Elas compartilham o mesmo valor de `player`.
- **Pedido de remoção:** o formulário do jogo indica as issues do GitHub como canal. Para achar as linhas, filtre por `name` e confira o `player` antes de apagar.

O texto do consentimento e o link para pedir remoção ficam em `src/engine/rank.js` (`joinForm`).
