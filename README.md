# SpeedZone

Aplicativo Expo SDK 57 / React Native com Expo Router. Use Node.js 24 ou superior e npm.

## Usar no computador

Na pasta do projeto, abra dois terminais:

```powershell
# Terminal 1: contas, sessões, fotos e garagem
npm run api
```

```powershell
# Terminal 2: aplicativo no navegador
npm run web
```

Abra o endereço mostrado pelo Expo (normalmente http://localhost:8081). Selecione **Novo Piloto**, crie a conta e entre em **Conta**. Use **Escolher foto** para enviar um arquivo do computador (PNG, JPEG ou WebP, até 5 MB). Foto, dados pessoais, endereço e até três projetos são salvos automaticamente na API. É necessário manter a API em execução para entrar ou editar o perfil.

## Armazenamento e autenticação

- SQLite em `server/data/speedzone.sqlite`, ignorado pelo Git. Preserve essa pasta para manter suas contas. Nenhuma conta de demonstração é criada.
- Senhas derivadas com scrypt e salt individual; sessões aleatórias com apenas o hash no banco.
- Navegador: cookie HttpOnly/SameSite=Lax; “Lembrar dispositivo” mantém a sessão por até 30 dias. Sem essa opção, o cookie dura a sessão do navegador e a sessão do servidor expira em 24 horas.
- Android/iOS: token em memória ou Expo SecureStore quando “Lembrar dispositivo” está ativo.
- Sair revoga a sessão. Rotas internas exigem login. Carrinho e favoritos ainda são temporários e reiniciam ao trocar de conta ou recarregar.
- Esta implementação roda localmente. E-mail de recuperação, login social, biometria, pagamentos, pontos e notificações ainda não estão conectados. Não há verificação de e-mail ou sincronização na nuvem.

## Testar em um celular

### Emulador Android no mesmo PC

Para o Android Emulator, adicione `EXPO_PUBLIC_ANDROID_API_URL=http://10.0.2.2:3001` ao `.env.local`. Esse endereço acessa o computador hospedeiro pela rede virtual do emulador, sem alterar o endereço usado na web. Recarregue completamente o app após a alteração. Para voltar a usar um Android físico, remova essa variável ou defina nela o IP de rede do PC.

### Aparelho físico

O comando `npm run api` também lê `.env.local` (arquivo local ignorado pelo Git). Para acessar pelo celular, configure nesse arquivo:

```dotenv
EXPO_PUBLIC_API_URL=http://IP-DO-PC:3001
HOST=0.0.0.0
API_ALLOWED_ORIGINS=http://IP-DO-PC:8081
```

Substitua `IP-DO-PC` pelo IPv4 atual da conexão de rede. Reinicie a API e recarregue completamente o aplicativo no Expo Go após mudar o endereço. No navegador do celular, abra `http://IP-DO-PC:3001/health`: deve aparecer `{"ok":true}`. Se não abrir, confira a rede, isolamento entre dispositivos e a permissão do Node.js no firewall do Windows. O túnel do Expo não encaminha a API da porta 3001.

No PC, defina `HOST=0.0.0.0` para a API e `EXPO_PUBLIC_API_URL=http://IP-DO-PC:3001` para o Expo. Os dois dispositivos devem acessar a mesma rede e a porta deve estar liberada. O endereço padrão `127.0.0.1` funciona apenas no próprio computador. Para builds nativos, gere uma development build com os plugins de SecureStore e ImagePicker.

Antes de publicar, hospede a API com HTTPS, configure `COOKIE_SECURE=true`, origens explícitas em `API_ALLOWED_ORIGINS` e políticas de privacidade/recuperação adequadas. Não exponha o banco local diretamente.

## Verificação

A aba **Pedidos** mostra as simulações concluídas no carrinho, persistidas por conta no SQLite. Os valores são recalculados pela API a partir do catálogo de demonstração de `server/orders.mjs`; mantenha esse catálogo alinhado aos produtos do app durante esta fase. O identificador da finalização evita duplicações ao repetir uma tentativa. Não há cobrança, emissão de nota fiscal ou rastreamento real. **Ver demonstração** exibe exemplos de entrega/cancelamento apenas na interface, sem gravá-los na conta. A busca aceita código, SKU e nome da peça, com filtros por status e ordenação por data.

Após alterações no código da API, reinicie o terminal de `npm run api` para carregar as novas rotas.

No carrinho, **Calcular Frete e Prazo** aceita um CEP de 8 dígitos e oferece entrega Econômica ou Express. Esta é uma simulação local por faixa de CEP, sem consulta da existência do endereço ou cotação de transportadora. O total atualiza com a escolha; mudar o CEP exige nova seleção. A API exige a entrega e recalcula o preço, ignorando valores enviados pelo cliente. A modalidade, CEP, prazo ilustrativo e valor são salvos no pedido. A gratuidade a partir de R$ 6.500 considera o subtotal antes dos descontos.

```powershell
npm run test:api
npx tsc --noEmit
npx expo lint
```

Os testes de API usam um banco temporário, verificam cadastro, login, isolamento entre contas, persistência da foto/garagem, validação e revogação de sessão.
