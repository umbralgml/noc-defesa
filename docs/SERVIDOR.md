# Publicar no seu servidor (Ubuntu/Debian)

O jogo é só um site estático, sem banco e sem backend. O ranking fica no Supabase e funciona igual em qualquer endereço. O instalador coloca o jogo no seu domínio com HTTPS e o mantém atualizado a partir do GitHub, então o GitHub Pages e o seu servidor sempre mostram a mesma versão.

## Antes de começar

- Servidor **Ubuntu 20.04+** ou **Debian 11+**, com acesso `root` (ou `sudo`).
- Portas **80** e **443** liberadas no provedor (painel de firewall / security group da VPS).
- Um registro **DNS do tipo A** para o subdomínio:

  | Tipo | Nome | Valor |
  |------|------|-------|
  | A | `noc` | IP público do servidor |

  Crie no painel onde o domínio `zioncore.com.br` está hospedado (Registro.br, Cloudflare etc.). Para conferir se já propagou, rode no servidor:
  ```bash
  getent hosts noc.zioncore.com.br     # deve mostrar o IP do servidor
  ```
  Se usar Cloudflare, deixe a nuvem **cinza** (sem proxy) até o certificado ser emitido.

## Instalar (um comando)

```bash
curl -fsSL https://raw.githubusercontent.com/umbralgml/noc-defesa/main/deploy/install.sh \
  | sudo bash -s -- noc.zioncore.com.br seu@email.com
```

O e-mail é opcional; o Let's Encrypt usa para avisar sobre certificado vencendo. Em 1 ou 2 minutos o jogo está em **https://noc.zioncore.com.br**.

Prefere ler o script antes de rodar (recomendado)?

```bash
curl -fsSLO https://raw.githubusercontent.com/umbralgml/noc-defesa/main/deploy/install.sh
less install.sh
sudo bash install.sh noc.zioncore.com.br seu@email.com
```

### O que o instalador faz

1. Instala `git` e `curl` e, se não houver servidor web, o **nginx**.
2. **Respeita o que já existe.** Se a porta 80 já é do **nginx** ou do **Apache**, ele só acrescenta um site novo para o domínio, sem mexer nos outros. Se for outro programa (Caddy, Docker, Traefik...), ele para e explica como fazer manualmente.
3. Baixa o jogo do GitHub em `/var/www/noc-defesa`.
4. Cria o site com:
   - cabeçalhos de segurança;
   - compressão gzip;
   - cache certo para atualização imediata;
   - bloqueio de `.git`, `deploy/` e `tools/`.
5. Libera as portas 80 e 443 no `ufw`, se ele estiver ativo.
6. Confere se o DNS aponta para o servidor e emite o **HTTPS** com Let's Encrypt, com redirecionamento e renovação automática. Se o DNS ainda não estiver pronto, ele avisa e pula essa etapa. É só rodar de novo depois.
7. Agenda a **atualização automática** a cada 15 minutos (timer do systemd, ou cron).

Rodar o comando de novo é seguro: ele só atualiza o que precisa.

### Opções

| Opção | Para quê |
|-------|----------|
| `--sem-ssl` | Não emite certificado (testes, ou HTTPS feito por outro lugar). |
| `--sem-atualizacao` | Não agenda a atualização automática (você atualiza quando quiser). |
| `--branch NOME` | Usa outro branch do GitHub (padrão: `main`). |
| `--dir CAMINHO` | Outra pasta para o site (padrão: `/var/www/noc-defesa`). |
| `--remover` | Desinstala: site, pasta e atualização automática. O certificado fica. |

## Atualizar

É automático: tudo que entra na `main` do GitHub chega ao servidor em até 15 minutos. Para forçar na hora:

```bash
sudo noc-atualizar
```

Não edite arquivos direto em `/var/www/noc-defesa`. A atualização sobrescreve a pasta com o que está no GitHub.

## Jogar como app (PWA)

Com HTTPS ativo, o jogo pode ser instalado e funciona até sem internet. O ranking volta quando a conexão voltar.

- **Android (Chrome):** botão **📲 INSTALAR APP** na tela inicial do jogo, ou menu ⋮ → *Instalar app*.
- **Android (Samsung Internet):** menu ≡ → *Adicionar página a* → *Tela inicial*.
- **iPhone/iPad (Safari):** Compartilhar → *Adicionar à Tela de Início*. O botão do jogo mostra o passo a passo.
- **PC (Chrome/Edge):** botão **📲 INSTALAR APP**, ou o ícone de instalar na barra de endereço.

## Problemas comuns

| Sintoma | O que fazer |
|---------|-------------|
| "O domínio ainda não resolve" | Crie o registro A, espere propagar (minutos a algumas horas) e rode o instalador de novo. |
| "aponta para X, mas este servidor é Y" | DNS errado ou proxy da Cloudflare ligado. Corrija e rode de novo. |
| Certbot falha | A porta 80 precisa estar aberta para a internet (firewall do provedor). |
| "porta 80 ocupada por outro programa" | Aponte o proxy desse programa para a pasta `/var/www/noc-defesa`, que é só arquivo estático. |
| Ver se a atualização roda | `systemctl list-timers noc-defesa-update.timer` e `journalctl -u noc-defesa-update` |
| Logs do site | `/var/log/nginx/access.log` e `/var/log/nginx/error.log` (ou `/var/log/apache2/`) |
| Instalação não funciona | Precisa de HTTPS. O botão **📲 INSTALAR APP** aparece sempre que o jogo não está instalado: no Chrome/Edge abre o pedido nativo; nos outros navegadores mostra o passo a passo. Dentro do Instagram, LinkedIn ou WhatsApp é preciso abrir no Chrome/Safari primeiro. |

## Desinstalar

```bash
sudo bash /var/www/noc-defesa/deploy/install.sh noc.zioncore.com.br --remover
```

Isso não apaga o certificado. Para apagá-lo também, rode `sudo certbot delete --cert-name noc.zioncore.com.br`.
