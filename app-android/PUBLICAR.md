# Publicar o NOC na Play Store

O app Android é o próprio jogo empacotado com Capacitor: tudo vai dentro do APK e roda sem internet (o ranking só funciona quando há conexão). O GitHub Actions compila a cada push na main (workflow "App Android").

## Atualizar o app depois

Mudou o jogo, fez merge na main, o workflow gera um AAB novo com o número do build maior e a versão do topo do changelog. Baixe o artefato noc-playstore-aab e envie em Play Console > Teste e lançamento > Produção (ou na faixa de teste) > Criar nova versão.

## Primeira publicação

1 - Testar no celular: no GitHub, abra Actions > App Android > o build mais recente > Artifacts, baixe noc-apk-teste, descompacte e instale o .apk no Android (permita instalar de fontes desconhecidas). Confira o botão voltar, o som e um turno completo em modo avião.

2 - Criar a chave de upload no seu computador Linux (guarde o arquivo e as senhas, sem elas não dá para enviar atualizações sem pedir troca de chave ao Google):
keytool -genkeypair -v -keystore noc-upload.jks -alias noc -keyalg RSA -keysize 2048 -validity 10000

3 - Gerar o conteúdo do segredo em base64:
base64 -w0 noc-upload.jks > noc-upload.b64

4 - Cadastrar os segredos no GitHub em github.com/umbralgml/noc-defesa > Settings > Secrets and variables > Actions > New repository secret, criando NOC_KEYSTORE_BASE64 (conteúdo do noc-upload.b64), NOC_KEYSTORE_PASS (senha do keystore), NOC_KEY_ALIAS (noc) e NOC_KEY_PASS (senha da chave; se não definiu outra, é a mesma do keystore).

5 - Rodar o build assinado: Actions > App Android > Run workflow (branch main). No fim, baixe o artefato noc-playstore-aab e descompacte o .aab.

6 - Criar a conta de desenvolvedor em play.google.com/console com a sua conta Google, pagar a taxa única de 25 dólares e concluir a verificação de identidade (documento e, para conta pessoal, verificação do telefone e de um aparelho Android pelo app Play Console).

7 - Criar o app em Play Console > Criar app: nome "NOC: Última Linha de Defesa", idioma Português (Brasil), tipo Jogo, gratuito.

8 - Preencher Painel > Configurar o app: política de privacidade com a URL https://umbralgml.github.io/noc-defesa/privacidade.html (publicada pelo GitHub Pages após o merge na main), acesso ao app (todo liberado, sem login), anúncios (não contém), classificação de conteúdo (questionário IARC, categoria jogo educativo, sem violência realista), público-alvo (13 anos ou mais evita as regras de apps infantis), segurança dos dados (coleta opcional: nome e LinkedIn do ranking com consentimento, dados de uso anônimos de desempenho nas fases; nada compartilhado com terceiros; dados criptografados em trânsito via HTTPS; usuário pode pedir exclusão por e-mail), categoria do app (Jogos > Educativo) e e-mail de contato.

9 - Montar a página da loja em Crescer > Presença na loja > Página principal: descrição curta (até 80 caracteres, ex.: "Defenda a rede contra o hacker Z3R0 e aprenda redes e segurança jogando."), descrição completa, ícone 512x512 (src/icons/icon-512.png), imagem de destaque 1024x500 e de 2 a 8 capturas de tela do celular.

10 - Ativar a Assinatura de apps do Google Play quando o Console pedir no primeiro envio (o Google guarda a chave final; a sua é só a de upload).

11 - Teste fechado obrigatório para conta pessoal nova: em Teste e lançamento > Teste fechado, crie uma faixa, envie o .aab, adicione uma lista com pelo menos 12 e-mails de testadores (contas Google que usam Android) e publique na faixa. Mande o link de participação para eles; os 12 precisam ficar inscritos por 14 dias seguidos. Se cair abaixo de 12, o prazo recomeça.

12 - Depois dos 14 dias: Painel > Solicitar acesso à produção, responder o questionário sobre o teste (quantos testaram, o que mudou com o feedback) e aguardar a análise (geralmente alguns dias).

13 - Liberado o acesso: Teste e lançamento > Produção > Criar nova versão, enviar o .aab mais recente, escrever as notas da versão (pode copiar os itens do changelog) e enviar para revisão. A primeira revisão pode levar até uma semana.
