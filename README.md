# NOC: Última Linha de Defesa

Jogo educativo de redes e segurança no navegador. São 03:12 da madrugada, o grupo **Z3R0** invadiu o telão do NOC e você é o analista de plantão: religue o rack, divida sub-redes, monte ACLs, filtre BGP e conduza a resposta a incidente antes que a rede caia.

**Jogue agora:** https://umbralgml.github.io/noc-defesa/

Funciona no celular e no desktop, sem cadastro. Dá para **instalar como app** (PWA): no Android e no PC pelo botão 📲 INSTALAR APP, no iPhone em Compartilhar → Adicionar à Tela de Início. Depois de instalado, roda até sem internet.

## O que você aprende

São 36 fases, do zero ao avançado: um Prólogo para quem nunca viu rede e 7 atos de dificuldade crescente.

| Parte | Nível | Tema | Fases |
|-------|-------|------|-------|
| Prólogo | iniciante | Primeiros passos | equipamentos e o que fazem, IP x porta x MAC, ping/gateway/DNS, primeiro terminal Linux (com tutorial) |
| 1 | básico | Camada física e endereçamento | cabos e transceivers, faixas privadas e CGNAT, sub-redes, achar a falha na topologia com ping e traceroute, portas de serviço |
| 2 | básico | Firewall e DDoS | política de firewall, ordem de regras, ACL contra reflexão NTP, SYN flood no Wireshark, mitigação de DDoS e a botnet ao vivo |
| 3 | intermediário | Linux no NOC | comandos de rede no Linux, serviço exposto (ss, ufw), resolvedor DNS aberto (tcpdump, dig), SSH sob ataque (journalctl, last), boas práticas |
| 4 | intermediário | Switching e BGP | VLAN hopping, uplink redundante e STP, filtro de cliente BGP, sequestro de prefixo e RPKI |
| 5 | intermediário | Resposta a incidente | fases do NIST SP 800-61, caça em logs, VLSM, rastro do C2 numa captura e o chefe final |
| 6 | avançado | IPv6, Wi-Fi e serviços | tipos de endereço IPv6, plano /48 → /64, Wi-Fi seguro, DHCP, DNS e NTP |
| 7 | avançado | Troubleshooting no terminal | investigar switch e roteador com comandos IOS (porta em shutdown, rota padrão apagada) e o contra-ataque final na borda |

O jogo foi feito para ensinar, não só para testar:

- **Aula rápida** no briefing de cada fase, com o conceito que você vai precisar. Ela também aparece no botão **?** durante a fase.
- **Explicação na hora** de cada jogada, certa ou errada: por que aquele IP é público, por que aquela regra vem primeiro, por que aquela opção do quiz não serve.
- **Revisão no fim da fase** com tudo o que você errou e a explicação de cada item.
- **Desafio diário:** 5 perguntas por dia, iguais para todo mundo, com cronômetro, sequência de dias e resultado para compartilhar. Dá para **desafiar um colega** com um link que leva as mesmas perguntas e o seu placar.
- **Z3R0 ativo:** a partir do nível intermediário, ele ataca durante a fase (glitch, embaralha, ataque relâmpago com contagem regressiva).
- **Treino dos seus erros:** cada erro vira uma pergunta de revisão no mapa; dois acertos seguidos tiram o item da lista.
- **Carreira e conquistas:** XP por fase, desafio e treino, cargos de Estagiário a Arquiteto de Redes e 23 conquistas.
- **Jeitos de jogar:** ligar cabos, arrastar fichas, quiz, terminal, **defesa ao vivo** (regras de firewall contra ondas de pacotes), **topologia viva** (ping animado para achar a falha) e **captura estilo Wireshark** (filtros de exibição).
- **Sala do NOC:** no mapa, o analista anda pela sala (toque ou setas) até o equipamento e abre os incidentes de lá.

## Rodar localmente

O jogo usa ES modules e carrega as fases por `fetch`, então precisa de um servidor HTTP. Abrir o `index.html` direto (`file://`) não funciona.

```bash
git clone https://github.com/umbralgml/noc-defesa.git
cd noc-defesa
python3 -m http.server 8000
# abra http://localhost:8000
```

Qualquer servidor estático serve (`npx serve`, extensão Live Server do VS Code etc.). Não há dependências nem etapa de build.

## Publicar no seu servidor

Um comando instala o jogo num Ubuntu/Debian com HTTPS e atualização automática a partir do GitHub:

```bash
curl -fsSL https://raw.githubusercontent.com/umbralgml/noc-defesa/main/deploy/install.sh \
  | sudo bash -s -- noc.seudominio.com.br seu@email.com
```

Passo a passo, DNS e solução de problemas em [docs/SERVIDOR.md](docs/SERVIDOR.md).

## Estrutura

```
index.html          telas do jogo (HTML) e carregamento do CSS/JS
manifest.webmanifest, sw.js   PWA: instalação como app e modo offline
src/style.css       todo o visual
src/main.js         ponto de entrada
src/changelog.json  histórico de atualizações mostrado na tela inicial
src/config.json     configuração do ranking (opcional, veja docs/RANKING.md)
src/engine/         motor do jogo em ES modules (cenas, áudio, tipos de fase, fluxo)
src/levels/         fases em JSON, um arquivo por ato
tools/              validador opcional das fases e SQL do ranking
deploy/install.sh   instalador para servidor próprio (nginx/Apache + HTTPS)
docs/CRIAR-FASE.md  guia do formato das fases
docs/RANKING.md     como ligar o ranking público (Supabase)
```

## Como contribuir

Contribuições são bem-vindas, principalmente **fases novas** e **correções técnicas** no conteúdo.

1. Faça um fork e crie um branch.
2. Para criar ou editar uma fase, siga o [guia de criação de fases](docs/CRIAR-FASE.md). Na maioria dos casos você só mexe em JSON.
3. Valide as fases (precisa de Node 18+) e, se tiver o Playwright, jogue a campanha inteira automaticamente:
   ```bash
   node tools/validar-fases.mjs
   node tools/testes/campanha.mjs
   ```
4. Rode o jogo localmente e jogue a fase do começo ao fim, errando de propósito para conferir as explicações.
5. Abra um pull request contando o que a fase ensina e de onde vem a referência técnica (RFC, documentação do fabricante, NIST etc.).

Regras importantes:

- **Não renomeie o título de uma fase existente.** O progresso salvo no navegador usa o título como chave, então renomear apaga as estrelas de quem já jogou.
- Textos em português do Brasil, frases curtas, tom direto de analista de plantão.
- Todo item precisa de explicação (`why`). O objetivo é ensinar.

## Licença

[MIT](LICENSE) © 2026 Marcos dos Anjos
