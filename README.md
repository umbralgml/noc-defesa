# NOC: Última Linha de Defesa

Jogo educativo de redes e segurança no navegador. São 03:12 da madrugada, o grupo **Z3R0** invadiu o telão do NOC e você é o analista de plantão: religue o rack, divida sub-redes, monte ACLs, filtre BGP e conduza a resposta a incidente antes que a rede caia.

**Jogue agora:** https://umbralgml.github.io/noc-defesa/

Funciona no celular e no desktop, sem instalar nada e sem cadastro.

## O que você aprende

São 15 fases em 4 atos:

| Ato | Tema | Fases |
|-----|------|-------|
| 1 | Camada física e endereçamento | cabos e transceivers, faixas privadas e CGNAT, sub-redes, portas de serviço |
| 2 | Firewall e DDoS | política de firewall, ordem de regras, ACL contra reflexão NTP, mitigação de DDoS |
| 3 | Switching e BGP | VLAN hopping, filtro de cliente BGP, sequestro de prefixo e RPKI |
| 4 | Resposta a incidente | fases do NIST SP 800-61, caça em logs, VLSM e o chefe final |

O jogo foi feito para ensinar, não só para testar:

- **Aula rápida** no briefing de cada fase, com o conceito que você vai precisar. Ela também aparece no botão **?** durante a fase.
- **Explicação na hora** de cada jogada, certa ou errada: por que aquele IP é público, por que aquela regra vem primeiro, por que aquela opção do quiz não serve.
- **Revisão no fim da fase** com tudo o que você errou e a explicação de cada item.

## Rodar localmente

O jogo usa ES modules e carrega as fases por `fetch`, então precisa de um servidor HTTP. Abrir o `index.html` direto (`file://`) não funciona.

```bash
git clone https://github.com/umbralgml/noc-defesa.git
cd noc-defesa
python3 -m http.server 8000
# abra http://localhost:8000
```

Qualquer servidor estático serve (`npx serve`, extensão Live Server do VS Code etc.). Não há dependências nem etapa de build.

## Estrutura

```
index.html          telas do jogo (HTML) e carregamento do CSS/JS
src/style.css       todo o visual
src/main.js         ponto de entrada
src/changelog.json  histórico de atualizações mostrado na tela inicial
src/engine/         motor do jogo em ES modules (cenas, áudio, tipos de fase, fluxo)
src/levels/         fases em JSON, um arquivo por ato
tools/              validador opcional das fases
docs/CRIAR-FASE.md  guia do formato das fases
```

## Como contribuir

Contribuições são bem-vindas, principalmente **fases novas** e **correções técnicas** no conteúdo.

1. Faça um fork e crie um branch.
2. Para criar ou editar uma fase, siga o [guia de criação de fases](docs/CRIAR-FASE.md). Na maioria dos casos você só mexe em JSON.
3. Valide as fases (precisa de Node 18+):
   ```bash
   node tools/validar-fases.mjs
   ```
4. Rode o jogo localmente e jogue a fase do começo ao fim, errando de propósito para conferir as explicações.
5. Abra um pull request contando o que a fase ensina e de onde vem a referência técnica (RFC, documentação do fabricante, NIST etc.).

Regras importantes:

- **Não renomeie o título de uma fase existente.** O progresso salvo no navegador usa o título como chave, então renomear apaga as estrelas de quem já jogou.
- Textos em português do Brasil, frases curtas, tom direto de analista de plantão.
- Todo item precisa de explicação (`why`). O objetivo é ensinar.

## Licença

[MIT](LICENSE) © 2026 Marcos dos Anjos
