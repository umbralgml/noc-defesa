# Como criar uma fase

As fases ficam em `src/levels/`, um arquivo JSON por ato. Na maioria dos casos você só mexe nesses arquivos, sem tocar em JavaScript.

```
src/levels/
  index.json    lista dos atos, na ordem do mapa
  ato1.json     { "tag": "ATO 1", "name": "Camada física e endereçamento", "levels": [ ... ] }
  ato2.json
  ...
```

- A **ordem no mapa** é a ordem dos arquivos no `index.json` e, dentro de cada arquivo, a ordem do array `levels`.
- Uma fase só é **desbloqueada** quando a anterior, na ordem geral, tem pelo menos 1 estrela.
- Para criar um **ato novo**, crie `atoN.json` com `tag`, `name`, `diff`, `story` e `levels` e acrescente o nome do arquivo em `index.json`.

### Campos do ato

| Campo | Formato | Para que serve |
|-------|---------|----------------|
| `tag` | texto | Rótulo no mapa (`PRÓLOGO`, `ATO 3`). |
| `name` | texto | Nome do ato. |
| `diff` | `iniciante`, `básico`, `intermediário` ou `avançado` | Selo no mapa. Iniciante e básico ganham dica automática depois do 2º erro. A dificuldade só pode subir ao longo da campanha (o validador avisa). |
| `story` | lista de `{ "who": "z" \| "me" \| "chefe", "t": "HTML" }` | Cena com o Z3R0, o analista e o chefe do NOC, mostrada uma vez antes da primeira fase do ato. |

**Pense em quem está começando.** O Prólogo assume zero conhecimento: analogias, nenhuma pressão de tempo e um tutorial guiado. Conteúdo novo entra no ato do nível certo; se for básico demais para o ato, vai para um ato anterior.

Depois de editar, rode o validador e jogue a fase:

```bash
node tools/validar-fases.mjs
python3 -m http.server 8000   # e abra http://localhost:8000
```

## Campos comuns a todos os tipos

| Campo | Obrigatório | Formato | Para que serve |
|-------|:-:|---------|----------------|
| `title` | sim | texto | Nome da fase. **Precisa ser único e não pode mudar depois de publicado**: o progresso salvo usa o título como chave. |
| `tag` | sim | texto | Rótulo curto em maiúsculas no mapa (`SUB-REDES`, `BGP`, `QUIZ`). |
| `type` | sim | `wire`, `drop`, `quiz`, `term`, `defense`, `topo` ou `pcap` | Tipo de fase (veja abaixo). |
| `mode` | só em `drop` | `buckets` ou `slots` | Variante da fase `drop`. |
| `loc` | sim | `rack`, `desk`, `firewall`, `war`, `server` | Cenário animado e texto do botão "IR PARA...". |
| `cap` | sim | texto | Legenda digitada enquanto o analista anda até o local. |
| `goal` | sim | HTML | Missão, mostrada no briefing (e no topo da fase `wire`). |
| `intro` | não | HTML | Enunciado no topo da fase (`drop`, `term`, `defense`, `topo`, `pcap`). |
| `miniboss` | não | `true` | Chefe intermediário: telão do Z3R0, música de chefe e animação de derrota, sem encerrar a campanha. Use com `loc: "war"`. |
| `z` | sim | HTML | Fala do Z3R0 no briefing. |
| `me` | sim | HTML | Resposta do analista no briefing. |
| `lesson` | recomendado | lista de HTML | **Aula rápida**: 3 a 6 tópicos com o conceito necessário para a fase. Aparece no briefing e no botão **?**. |
| `tip` | sim | texto | Dica técnica do botão **?** e da tela de derrota. |
| `learn` | sim | texto | Resumo "O QUE VOCÊ DEFENDEU" na tela de vitória. |

Em campos HTML use só marcação simples, como `<b>`. Em `tip` e `learn` não use `<b>`, porque ele vira título dentro da caixa. Os campos `t`, `s`, `why`, `q` e as opções do quiz são exibidos como texto puro.

### O campo `why`: ensinar em cada jogada

Quase todo item jogável aceita um `why`, que aparece no painel de explicação logo depois da jogada. Os erros também vão para a lista **PARA REVISAR** no fim da fase. Escreva o `why` como explicação do próprio item: diga **o que ele é** e **por que vai onde vai**. Assim o mesmo texto serve tanto para o acerto quanto para o erro.

- Bom: `"172.32 passou do fim do /12, que termina em 172.31: é público."`
- Ruim: `"Errado!"`, `"Esse é público."`

O validador avisa quando falta `why` ou `lesson`.

---

## Tipo `wire`: ligar pares

O jogador liga cada item da esquerda ao par da direita, arrastando o cabo ou tocando nos dois lados. O par certo é o que tem o **mesmo `id`**. A coluna da direita é embaralhada.

| Campo | Formato |
|-------|---------|
| `left` | lista de `{ "id", "t", "s", "m"?, "why" }` |
| `right` | lista de `{ "id", "t", "s", "ico"?, "why" }` |
| `heads` | opcional, `["TÍTULO ESQUERDA", "TÍTULO DIREITA"]` |
| `legend` | opcional, `true` mostra a legenda de cores dos cabos |
| `loose` | opcional, `true` desenha cabos soltos no rack da cena |
| `tutorial` | opcional, `true` destaca o primeiro par com uma mão animada até o primeiro acerto (use na primeira fase do jogo) |

- `t` é o nome e `s` o subtítulo (pode ser `""`).
- `m` é o tipo de cabo, que define a cor: `sm` (monomodo), `mm` (multimodo), `dac`, `cu` (Cat6), `pon` (GPON). Sem `m`, o cabo fica verde.
- `ico` é o ícone da porta de destino: `sfp`, `rj45` ou `sc`.
- O `why` da **esquerda** aparece no acerto. O `why` da **direita** aparece quando alguém liga um item errado nela, então ele deve explicar o que aquela porta espera.

```json
{
  "title": "Protocolos de roteamento",
  "tag": "ROTEAMENTO",
  "type": "wire",
  "loc": "desk",
  "cap": "Abrindo a tabela de rotas...",
  "heads": ["PROTOCOLO", "COMO ESCOLHE O CAMINHO"],
  "goal": "Ligue cada protocolo ao critério que ele usa para escolher o caminho.",
  "z": "Misturei seus protocolos. Boa sorte com a convergência.",
  "me": "Cada um tem seu jeito de escolher caminho.",
  "lesson": [
    "<b>IGP</b> roteia dentro da sua rede. <b>EGP</b> roteia entre redes de donos diferentes.",
    "<b>Estado de enlace</b> (OSPF, IS-IS): cada roteador conhece o mapa inteiro e calcula o menor caminho.",
    "<b>Vetor de distância</b> (RIP): cada roteador só sabe o que o vizinho contou e conta saltos."
  ],
  "tip": "OSPF usa custo. BGP usa atributos como o AS-path. RIP conta saltos.",
  "learn": "OSPF é IGP de estado de enlace, RIP é vetor de distância e BGP é o protocolo entre redes da internet.",
  "left": [
    { "id": "a", "t": "OSPF", "s": "IGP", "why": "OSPF é estado de enlace: escolhe o caminho de menor custo." },
    { "id": "b", "t": "BGP", "s": "EGP", "why": "BGP troca rotas entre AS e decide por atributos como o AS-path." },
    { "id": "c", "t": "RIP", "s": "IGP", "why": "RIP é vetor de distância: escolhe o caminho com menos saltos, no máximo 15." }
  ],
  "right": [
    { "id": "a", "t": "Menor custo", "s": "Dijkstra", "why": "Menor custo calculado com Dijkstra é o critério do OSPF." },
    { "id": "b", "t": "Menor AS-path", "s": "Entre AS", "why": "AS-path é um atributo do BGP." },
    { "id": "c", "t": "Menos saltos", "s": "Contagem de hops", "why": "Contar saltos é o critério do RIP." }
  ]
}
```

---

## Tipo `drop` + `buckets`: classificar

As fichas aparecem no banco de baixo, e o jogador arrasta cada uma para a categoria certa.

| Campo | Formato |
|-------|---------|
| `buckets` | lista de `{ "label", "c", "a" }` |
| `label` | nome da categoria (HTML) |
| `c` | cor da categoria (`#00e0a8` verde, `#ff4d6d` vermelho, `#ffd166` amarelo, `#4dd2ff` azul, `#ff7ad9` rosa) |
| `a` | itens da categoria: `"texto"` ou `{ "t": "texto", "why": "explicação" }` |

Os itens de todas as categorias são embaralhados juntos. Um texto não pode aparecer em duas categorias.

```json
{
  "title": "Camadas do OSI",
  "tag": "CLASSIFICAÇÃO",
  "type": "drop",
  "mode": "buckets",
  "loc": "desk",
  "cap": "Revisando o modelo OSI...",
  "goal": "Arraste cada equipamento ou protocolo para a camada em que ele atua.",
  "intro": "Separe o que trabalha na <b>camada 2</b> do que trabalha na <b>camada 3</b>.",
  "z": "Aposto que você nem lembra o que é camada 2.",
  "me": "MAC é 2, IP é 3.",
  "lesson": [
    "<b>Camada 2</b> (enlace) entrega quadros dentro do mesmo segmento, usando endereço MAC.",
    "<b>Camada 3</b> (rede) leva pacotes entre redes diferentes, usando endereço IP."
  ],
  "tip": "Se decide por MAC, é camada 2. Se decide por IP, é camada 3.",
  "learn": "Switch L2 e ARP são camada 2. Roteador e ICMP são camada 3.",
  "buckets": [
    { "label": "CAMADA 2", "c": "#4dd2ff", "a": [
      { "t": "Switch L2", "why": "Encaminha quadros pela tabela de endereços MAC." },
      { "t": "ARP", "why": "Descobre o MAC de um IP dentro do segmento local." }
    ] },
    { "label": "CAMADA 3", "c": "#ffd166", "a": [
      { "t": "Roteador", "why": "Encaminha pacotes entre redes pela tabela de rotas IP." },
      { "t": "ICMP", "why": "Mensagens de controle do IP, como o ping." }
    ] }
  ]
}
```

---

## Tipo `drop` + `slots`: preencher lacunas

O jogador arrasta fichas para lacunas dentro de um template HTML. Serve para CLI, tabelas e ordenação.

| Campo | Formato |
|-------|---------|
| `html` | template HTML; cada lacuna é escrita como `[id]` |
| `zones` | `{ "id": ["valor aceito", ...] }`, uma entrada por lacuna |
| `chips` | fichas do banco: `"texto"` ou `{ "t": "texto", "v": "valor", "why": "explicação" }` |
| `explain` | opcional, `{ "id": "explicação" }` mostrada ao acertar aquela lacuna |
| `wide` | opcional, `true` deixa as lacunas largas (bom para frases, como nas fases de ordenação) |

- O valor de uma ficha é `v`. Sem `v`, o valor é o próprio `t`. Use `v` quando o texto for longo (regras de ACL, fases de um processo).
- Uma lacuna pode aceitar mais de um valor. Quando dois itens podem ficar em qualquer ordem, as duas lacunas aceitam os dois (veja "Primeiro match" no `ato2.json`).
- Fichas que não entram em nenhuma lacuna são **distratoras**. Toda distratora precisa de `why` explicando por que está errada.
- No acerto aparece `explain[lacuna]` e, se não existir, o `why` da ficha. No erro aparece o `why` da ficha.
- Os textos das fichas precisam ser únicos.

Classes CSS prontas para o template: `cli` (terminal; `<span class="c">!</span>` para comentário), `kv` (linha rótulo/valor), `grid3` (tabela de 3 colunas; use `<div class="h">` nos cabeçalhos) e `ord` (lista numerada, com `<span class="n">1</span>`).

```json
{
  "title": "Endereço na interface",
  "tag": "CLI",
  "type": "drop",
  "mode": "slots",
  "loc": "rack",
  "cap": "Conectando no console do roteador...",
  "goal": "Configure o gateway da LAN 192.168.1.0/24 na interface Gi0/0 e ligue a porta.",
  "intro": "O gateway da LAN <b>192.168.1.0/24</b> deve ser o <b>primeiro endereço útil</b>.",
  "z": "Desliguei a interface da LAN. Ninguém sai para a internet.",
  "me": "IP, máscara e no shutdown.",
  "lesson": [
    "Sintaxe Cisco: <b>ip address endereço máscara</b>. A máscara vai por extenso, não em /24.",
    "O primeiro endereço de uma /24 (.0) é a rede e o último (.255) é o broadcast. Nenhum dos dois pode ir numa interface.",
    "Interface de roteador Cisco vem desligada: <b>no shutdown</b> liga a porta."
  ],
  "tip": "Primeiro endereço útil da 192.168.1.0/24 é o .1. /24 = 255.255.255.0.",
  "learn": "ip address 192.168.1.1 255.255.255.0 e no shutdown deixam o gateway da LAN no ar.",
  "html": "<div class=\"cli\">interface Gi0/0<br>&nbsp;ip address [a] [b]<br>&nbsp;[c]</div>",
  "zones": { "a": ["192.168.1.1"], "b": ["255.255.255.0"], "c": ["no shutdown"] },
  "explain": {
    "a": ".1 é o primeiro endereço útil da /24, escolha comum para o gateway.",
    "b": "/24 por extenso é 255.255.255.0.",
    "c": "no shutdown liga a interface."
  },
  "chips": [
    { "t": "192.168.1.1", "why": "Primeiro endereço útil da 192.168.1.0/24." },
    { "t": "192.168.1.0", "why": "É o endereço de rede. Não pode ser usado em interface." },
    { "t": "255.255.255.0", "why": "Máscara da /24." },
    { "t": "255.255.255.255", "why": "Máscara /32: a interface ficaria sem rede, só com o próprio IP." },
    { "t": "no shutdown", "why": "Liga a interface." },
    { "t": "shutdown", "why": "shutdown desliga a interface, o contrário do que você quer." }
  ]
}
```

---

## Tipo `quiz`: perguntas

Perguntas de múltipla escolha. As opções são embaralhadas na tela.

| Campo | Formato |
|-------|---------|
| `qs` | lista de `{ "q", "o", "a", "why" }` |
| `q` | a pergunta |
| `o` | opções: `"texto"` ou `{ "t": "texto", "why": "por que está errada" }` |
| `a` | índice da opção correta em `o` (começa em 0) |
| `why` | explicação da resposta certa, mostrada sempre |
| `dailyFrom` | opcional, `AAAA-MM-DD`: as perguntas só entram no sorteio do desafio diário a partir dessa data (use o dia seguinte ao da publicação, para não mudar o desafio do dia) |
| `boss` | opcional, `true` transforma em chefe: barra de vida do Z3R0, precisa acertar 70% e cada erro custa 20% |
| `time` | obrigatório com `boss`: segundos por pergunta |

Quando o jogador erra, aparece o `why` da pergunta e, embaixo, **"Sobre a sua resposta"** com o `why` da opção escolhida. Toda opção errada deve ter um `why`.

```json
{
  "title": "Protocolos seguros",
  "tag": "QUIZ",
  "type": "quiz",
  "loc": "war",
  "cap": "Auditoria de protocolos inseguros...",
  "goal": "Troque cada protocolo inseguro pela versão segura.",
  "z": "Adoro senha passando em texto puro.",
  "me": "Tudo criptografado a partir de hoje.",
  "lesson": [
    "Protocolos antigos (Telnet, FTP, HTTP) mandam tudo em <b>texto puro</b>, inclusive senhas.",
    "Cada um tem um substituto com criptografia: SSH, SFTP, HTTPS."
  ],
  "tip": "Procure a versão que roda sobre SSH ou TLS.",
  "learn": "Telnet vira SSH, FTP vira SFTP, HTTP vira HTTPS, SNMPv1/v2c vira SNMPv3.",
  "qs": [
    {
      "q": "Qual protocolo substitui o Telnet para acesso remoto?",
      "o": [
        "SSH",
        { "t": "FTP", "why": "FTP transfere arquivos e também manda a senha em texto puro." },
        { "t": "RDP", "why": "RDP é área de trabalho gráfica do Windows, não substituto do Telnet em equipamentos de rede." },
        { "t": "SNMP", "why": "SNMP serve para monitoramento, não para acesso interativo." }
      ],
      "a": 0,
      "why": "SSH criptografa a sessão inteira, incluindo a autenticação."
    }
  ]
}
```

---

## Tipo `term`: troubleshooting no terminal

O jogador investiga um equipamento num terminal: digita comandos (aceita os apelidos de `alias`) ou toca nos comandos sugeridos. Depois de rodar **2 comandos diferentes**, liberam os passos de diagnóstico e correção (múltipla escolha). Errar um passo custa 15% de integridade, explica o porquê e deixa tentar de novo.

| Campo | Formato |
|-------|---------|
| `host` | nome do equipamento no prompt (`SW-CORE` vira `SW-CORE#`) |
| `prompt` | opcional, prompt completo, para terminais Linux: `"admin@web01:~$"` ou `"root@bastion:~#"` |
| `intro` | HTML com o sintoma e o contexto |
| `cmds` | lista de `{ "c", "out", "why", "alias"? }`: comando, saída exata, o que ele mostra e formas curtas aceitas |
| `steps` | lista de passos no formato do quiz (`q`, `o`, `a`, `why`) e, opcionalmente, `run` e `out`: o comando e a saída que aparecem no terminal quando o passo é acertado (a correção sendo aplicada) |

- `"?"` lista os comandos e `"clear"` limpa a tela; comando fora da lista mostra erro de terminal, sem perder vida.
- A saída é mostrada exatamente como está (`\n` quebra linha, espaços alinham tabelas). Copie de um equipamento real sempre que puder.
- O `why` de cada comando aparece no painel na primeira vez que ele roda: é a aula do comando.

```json
{
  "title": "Porta em err-disabled",
  "tag": "TERMINAL",
  "type": "term",
  "loc": "rack",
  "host": "SW-ACESSO",
  "cap": "Plugando o console no switch de acesso...",
  "goal": "Descubra por que a impressora do RH sumiu e devolva a porta.",
  "intro": "A impressora do RH na <b>Gi1/0/7</b> parou. Investigue o <b>SW-ACESSO</b>.",
  "z": "Pluguei um notebook na porta da impressora. Seu switch fez o resto.",
  "me": "Port-security. Vamos ver o log.",
  "lesson": [
    "<b>err-disabled</b> é uma porta desligada por proteção, como o <b>port-security</b> ao ver um MAC não autorizado.",
    "Para voltar: <b>shutdown</b> e <b>no shutdown</b> na interface, depois de remover a causa."
  ],
  "tip": "show interfaces status mostra err-disabled; show logging diz o motivo.",
  "learn": "Port-security desligou a porta ao ver um MAC estranho. Tirar o equipamento intruso e dar shutdown/no shutdown devolve a porta.",
  "cmds": [
    { "c": "show interfaces status", "alias": ["sh int status"], "out": "Port      Status       Vlan\nGi1/0/7   err-disabled 30", "why": "err-disabled = porta desligada por uma proteção do switch." },
    { "c": "show logging", "alias": ["sh log"], "out": "%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address 3c22.fb11.0a7e on port GigabitEthernet1/0/7.", "why": "O log diz qual proteção agiu e por quê." }
  ],
  "steps": [
    {
      "q": "Por que a porta caiu?", "a": 0,
      "o": ["Port-security viu um MAC não autorizado", { "t": "Cabo com defeito", "why": "Cabo ruim aparece como notconnect, não err-disabled." }],
      "why": "A violação de port-security colocou a porta em err-disabled."
    },
    {
      "q": "Depois de tirar o notebook intruso, como devolver a porta?", "a": 0,
      "o": ["shutdown e no shutdown na interface", { "t": "reload no switch", "why": "Derruba todo mundo para resolver uma porta." }],
      "why": "Desligar e ligar a interface tira o estado err-disabled.",
      "run": "interface Gi1/0/7\n shutdown\n no shutdown", "out": "%LINK-3-UPDOWN: Interface GigabitEthernet1/0/7, changed state to up"
    }
  ]
}
```

---

## Tipo `defense`: defesa em tempo real

Os pacotes chegam em ondas e atravessam uma pista até o servidor. O jogador liga e desliga regras de firewall a qualquer momento; cada pacote é avaliado quando cruza a linha laranja. Ataque bloqueado é acerto. Ataque que passa, ou cliente legítimo bloqueado (**falso positivo**), custa integridade e explica o porquê. O Z3R0 não faz eventos surpresa aqui: a fase já é tempo real.

| Campo | Formato |
|-------|---------|
| `rules` | lista de `{ "id", "t", "match", "good"?, "why" }`. `match` casa por igualdade de campos do pacote; `src` aceita prefixo `/8`, `/16` ou `/24`. `good: true` marca as regras certas (o validador e o teste usam). O `why` aparece na primeira vez que a regra é ligada. |
| `waves` | lista de `{ "msg"?, "gap"?, "travel"?, "packets" }`. `gap` = ms entre pacotes (padrão 1500), `travel` = ms para atravessar a pista (padrão 5200). |
| `packets` | `{ "src", "proto", "port"?, "sport"?, "bad"?, "why" }`. `port` é a porta de **destino**, `sport` a de **origem**. O rótulo na pista é `origem PROTO sport→port`. |
| `reveal` | `true` pinta ataque de vermelho e cliente de azul desde o início (use no nível básico). Sem ele, a cor só aparece depois da decisão. |
| `server` | texto embaixo do servidor na pista (`LOJA 177.10.0.5`). |
| `start` | ms antes da primeira onda (padrão 2500). |
| `dmg` | dano por erro (padrão 10). |

O validador confere que todo ataque é barrado por alguma regra `good`, que nenhuma regra `good` barra cliente legítimo e avisa quando uma armadilha (regra sem `good`) não pega nenhum cliente, porque aí ela não ensina o falso positivo.

```json
"rules": [
  { "id": "ntp", "t": "Bloquear UDP com origem 123 (NTP)", "match": { "proto": "udp", "sport": 123 }, "good": true, "why": "Para a reflexão NTP." },
  { "id": "https", "t": "Bloquear TCP/443 (HTTPS)", "match": { "proto": "tcp", "port": 443 }, "why": "Armadilha: é a porta da loja." }
],
"waves": [
  { "msg": "Primeira onda.", "packets": [
    { "src": "91.200.12.4", "proto": "udp", "port": 51000, "sport": 123, "bad": true, "why": "Resposta NTP que ninguém pediu: reflexão." },
    { "src": "189.40.12.7", "proto": "tcp", "port": 443, "why": "Cliente comprando na loja." }
  ] }
]
```

---

## Tipo `topo`: topologia viva

Um diagrama da rede. No modo **PING** o jogador toca num equipamento e vê o pacote andar pelos enlaces a partir de `from`: ou volta, ou morre no ponto da falha. Depois de **2 pings** libera o modo **APONTAR FALHA**: tocar no equipamento ou no cabo com problema. Errar custa 15% e a explicação sai dos próprios testes ("um ping passou por aqui e voltou..."). Acertando, seguem os `steps` (opcionais, no formato do `term`) e a vitória.

| Campo | Formato |
|-------|---------|
| `from` | id do nó de onde saem os pings |
| `nodes` | `{ "id", "t", "ip"?, "kind", "x", "y", "why" }`. `kind`: `pc`, `sw`, `rt`, `fw`, `srv`, `net`, `ap`. Coordenadas numa área de 360 × 230 (deixe ~30 de margem). O `why` (o papel do equipamento) aparece no primeiro ping até ele. |
| `links` | `{ "a", "b", "t"?, "off"?, "why"? }`. `off: true` desenha tracejado e não encaminha (enlace reserva desligado). O `why` explica por que **não** é a falha. |
| `fault` | o nó ou o enlace com defeito. Enlace é `"a-b"` com os ids em **ordem alfabética** (`"rt-swdc"`). |
| `accept` | opcional, respostas aceitas quando os testes não distinguem (o cabo ou o switch da ponta). Precisa incluir o `fault`. |
| `faultName`, `faultWhy` | a resposta certa em texto curto (vai para o treino) e a explicação. |
| `trace` | `false` esconde o traceroute; sem ele, o jogador só vê responde ou não responde (use do intermediário em diante). Switches (`sw`, `ap`) não aparecem no traceroute, como na vida real. |
| `steps` | opcional, perguntas depois de achar a falha (`q`, `o`, `a`, `why`, `run`?, `out`?). |

O caminho é o mais curto em saltos, ignorando enlaces `off`. O validador exige destinos que respondem e destinos que falham, para o jogador ter o que comparar.

---

## Tipo `pcap`: análise de captura

Uma captura no estilo Wireshark. O jogador filtra com filtros de exibição (chips prontos ou digitados) e classifica cada pacote como **NORMAL** ou **SUSPEITO**, um a um ou **todos os visíveis** de uma vez. Filtro largo demais pega cliente legítimo junto, e cada pacote errado custa 10%.

| Campo | Formato |
|-------|---------|
| `packets` | `{ "src", "dst", "proto", "info", "sport"?, "dport"?, "flags"?, "method"?, "qname"?, "len"?, "bad"?, "why" }`. `proto` como no Wireshark (`TCP`, `UDP`, `DNS`, `HTTP`, `TLS`, `NTP`, `ICMP`); `flags` como `"SYN"` ou `"SYN,ACK"`. |
| `filters` | `{ "f", "why" }`: chips de filtro. O `why` aparece na primeira vez que o filtro é aplicado. |

Filtros aceitos (subconjunto do Wireshark, em `src/engine/netlib.js`): protocolos (`tcp`, `udp`, `icmp`, `dns`, `http`, `tls`, `ntp`, `ssh`), `ip.src`, `ip.dst`, `ip.addr` (aceitam prefixo `/8`, `/16`, `/24`), `tcp.port`, `udp.port`, `tcp.srcport`, `tcp.dstport`, `udp.srcport`, `udp.dstport`, `tcp.flags.syn`, `tcp.flags.ack`, `tcp.flags.rst`, `http.request`, `http.request.method`, `dns.qry.name`, `frame.len`. Operadores `== != > < >= <=` e `contains`, combinados com `&&`, `||`, `!` (ou `and`, `or`, `not`) e parênteses. O validador compila cada chip e avisa se ele não mostra nenhum pacote.

---

## Checklist antes do pull request

- [ ] `node tools/validar-fases.mjs` sem erros nem avisos.
- [ ] Título novo e único. Nenhum título existente foi renomeado.
- [ ] `lesson` ensina o necessário para jogar sem precisar pesquisar.
- [ ] Todo item tem `why`, e todo `why` explica o item em vez de só dizer "certo" ou "errado".
- [ ] Joguei a fase inteira, errei de propósito e li as explicações e a revisão.
- [ ] Conteúdo técnico conferido numa fonte (RFC, fabricante, NIST).
