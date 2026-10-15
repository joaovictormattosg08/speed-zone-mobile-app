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

No PC, defina `HOST=0.0.0.0` para a API e `EXPO_PUBLIC_API_URL=http://IP-DO-PC:3001` para o Expo. Os dois dispositivos devem acessar a mesma rede e a porta deve estar liberada. O endereço padrão `127.0.0.1` funciona apenas no próprio computador. Para builds nativos, gere uma development build com os plugins de SecureStore e ImagePicker.

Antes de publicar, hospede a API com HTTPS, configure `COOKIE_SECURE=true`, origens explícitas em `API_ALLOWED_ORIGINS` e políticas de privacidade/recuperação adequadas. Não exponha o banco local diretamente.

## Verificação

```powershell
npm run test:api
npx tsc --noEmit
npx expo lint
```

Os testes de API usam um banco temporário, verificam cadastro, login, isolamento entre contas, persistência da foto/garagem, validação e revogação de sessão.
