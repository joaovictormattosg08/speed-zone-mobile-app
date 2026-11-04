# Revisão funcional e de experiência — SpeedZone

## Conclusão

A base funcional local tem autenticação, catálogo, carrinho, pedidos demonstrativos, suporte, pontos e administração. Isso não equivale a uma loja pronta para produção. Pagamentos, transportadoras, emissão fiscal, recuperação de senha e notificações externas continuam sem integração.

Revisão feita no código das telas, navegação, contextos e serviços, com testes automatizados da API. Não foi uma homologação visual de todas as telas ou uma execução em Android/iOS. A API configurada em `.env.local` não respondeu ao teste de conectividade; os testes automatizados usam bancos temporários e servidores isolados.

## Problemas encontrados e corrigidos

| Problema | Efeito anterior | Correção |
| --- | --- | --- |
| Perfil editado pelo cliente não alterava a revisão administrativa | Um formulário antigo do administrador sobrescrevia nome/contato atualizado | Atualização transacional da revisão; teste de regressão reproduziu o erro antes da correção e exige conflito 409 |
| Catálogo começava com produtos estáticos e ignorava erros | Produtos de exemplo pareciam dados atuais quando a API falhava | Catálogo começa vazio, exibe carregamento/erro e permite tentar novamente |
| Peças removidas do catálogo sumiam visualmente do carrinho | O contador mantinha itens ocultos e o checkout podia omiti-los | Carrinho identifica as peças indisponíveis e permite removê-las; checkout impede confirmação parcial |
| Frete da página da peça tinha preços/prazos fixos diferentes | Estimativa divergente do carrinho para o mesmo CEP/subtotal | Usa a mesma função de cálculo do carrinho, inclusive quantidade e frete grátis |
| Troca de veículo na Home usava três carros de exemplo | A seleção não correspondia à garagem do usuário | Lista os carros cadastrados e salva o projeto ativo |
| Comprar novamente usava limite fixo de cinco peças | Resultado incorreto quando o estoque real era menor ou maior | Quantidade considera o estoque atual |
| Link de suporte em Pedidos mostrava aviso antigo | Atendimento existente no app ficava inacessível por esse atalho | Abre a Central de Suporte |
| Galeria podia manter índice de foto removida | A atualização do produto podia causar acesso a uma imagem inexistente | Usa a primeira foto disponível como alternativa |
| TypeScript incluía bundles exportados | Verificação lenta e erros de arquivos desaparecendo ao gerar uma nova build | Diretórios de exportação excluídos do TypeScript e ESLint |

## Conteúdo e hierarquia das telas

| Área | Avaliação | Ajuste aplicado / próximo passo |
| --- | --- | --- |
| Login | Opções sem integração competiam com Entrar | Removidas alternativas Google/Apple/biometria sem funcionamento; recuperação informa a limitação |
| Home | Hero longo, catálogo inteiro, calculadora e promessas comerciais acumulados | Texto curto, quatro destaques iniciais, catálogo completo por ação; calculadora e explicações recolhidas |
| Catálogo | Muitos filtros antes dos produtos | Busca e filtros preservados; para crescimento do catálogo, adotar lista virtualizada e paginação |
| Produto | Ficha extensa aberta e controle fictício de estoque | Ficha técnica recolhida; removido botão de alternar estoque; frete unificado |
| Carrinho | Controle de prévia vazio confundia o estado real | Removido “Ver Vazio”; atalho Garagem corrigido para Conta |
| Checkout | Etapas de entrega/pagamento/revisão já organizadas | Mantidas; bloqueio de catálogo indisponível/itens ocultos na confirmação |
| Conta | Ações sem implementação aumentavam a lista | Removidos atalhos de pagamentos e alertas que só exibiam indisponibilidade |
| Suporte | Canais “em breve”, banner, formulário e histórico na mesma tela | Removidos card de canais indisponíveis e banner; formulário expansível, aberto ao entrar por um pedido |
| Administração | Formulários e históricos extensos | Prontuário técnico, simulador de desconto e históricos secundários recolhidos; prévia do relato limitada na lista de chamados |
| Pedidos e pontos | Informações úteis, mas muitos cartões | Fluxos preservados; ainda merecem validação com dados volumosos e fontes ampliadas |

Não reduzi o tamanho das fontes para acomodar mais conteúdo. A redução vem da hierarquia, de menos ações sem função e de detalhes expansíveis.

## Pendências importantes

- **Produção:** integrar pagamento/estorno, envio/rastreio, nota fiscal, recuperação de conta e notificações; revisar textos comerciais e políticas antes da publicação.
- **Segurança de dependências:** o `npm audit` ainda aponta 29 ocorrências na árvore de dependências (2 baixas, 22 moderadas, 5 altas), inclusive ferramentas do Expo/ESLint. A checagem sem dependências de desenvolvimento apontou 16 ocorrências antes da tentativa de correção; o Expo inclui ferramentas na árvore de produção, portanto isso não mede sozinho a exposição do app. `npm audit fix` não resolveu os alertas. Entre as sugestões com `--force` estão mudar o Router para SDK 58 e rebaixar o Expo para SDK 51; não foram aplicadas. É necessário avaliar as cadeias `decode-uri-component/query-string`, `zod`, `glob/minimatch` e `deepmerge` e planejar atualização compatível.
- **Persistência:** carrinho e favoritos são de sessão; recarregar o app ou trocar de conta os reinicia.
- **Escala:** há listas em `ScrollView`, consultas administrativas que carregam todos os registros e polling periódico. Validar paginação/virtualização com muitos produtos, usuários e chamados.
- **Formulários:** faltam avisos consistentes de alterações não salvas ao voltar e validação visual de teclado/rodapé em aparelhos reais.
- **Acessibilidade:** conferir leitor de tela, texto ampliado, contraste e áreas de toque em Android/iOS. Estados expansíveis e carregamento receberam semântica acessível, mas isso não substitui testes em dispositivo.
- **Código legado:** `StoreSecondaryScreen` não é usado pelas rotas atuais e contém mensagens antigas; considerar removê-lo em uma limpeza separada.

## Como validar manualmente

1. Iniciar a API e o Expo; conferir que o endereço da API é acessível pelo navegador ou celular utilizado.
2. Entrar/criar conta, cadastrar dois carros e alternar o projeto na Home; conferir em Conta.
3. Comparar o frete da peça e do carrinho com mesmo CEP, preço e quantidade.
4. Adicionar uma peça, despublicá-la pelo administrador e verificar o aviso no carrinho e o bloqueio no checkout.
5. Abrir um chamado, responder pelo painel e conferir a conversa como cliente.
6. Abrir edição de usuário como administrador, alterar o perfil como cliente e confirmar que salvar o formulário antigo retorna conflito.
7. Conferir os detalhes expansíveis, rolagem, teclado e botões em telas de 360–430 px e com texto ampliado.

## Verificações executadas

- `npm run lint` e `npm run typecheck`: sem erros após os ajustes.
- Seis testes de integração da API passaram, incluindo a nova regressão de edição concorrente do perfil.
- Expo Doctor: 21/21 checks após atualizar os patches compatíveis do SDK 57.
- Exportação web compilada com sucesso.
- Não foi realizada homologação visual no navegador ou em aparelho físico nesta revisão.
