export type LegalDocument = 'terms' | 'privacy' | 'about';

export const legalDocuments = {
  terms: {
    title: 'Termos de Uso',
    description: 'Regras básicas para usar a SpeedZone',
    sections: [
      { title: '1. Sobre o serviço', text: 'A SpeedZone permite explorar peças automotivas, organizar sua garagem, registrar pedidos e acessar o atendimento. Esta versão é demonstrativa: os fluxos de compra não representam cobrança ou entrega real.' },
      { title: '2. Sua conta', text: 'Informe dados corretos, mantenha seu cadastro atualizado e proteja sua senha. Não compartilhe suas credenciais. Ao usar um dispositivo compartilhado, encerre a sessão em Sair da Conta.' },
      { title: '3. Uso responsável', text: 'Use o aplicativo de forma lícita e respeitosa. Não tente acessar contas de outras pessoas, explorar falhas, inserir conteúdo ofensivo ou interferir no funcionamento do serviço. Envie apenas fotos e informações que você tenha autorização para utilizar.' },
      { title: '4. Produtos e compatibilidade', text: 'Confira as especificações e a compatibilidade das peças com seu veículo. Informações do catálogo não substituem avaliação de um profissional qualificado. Instalações e modificações devem observar as normas de segurança e a legislação aplicável.' },
      { title: '5. Pedidos, trocas e atendimento', text: 'Pedidos, frete, pagamentos e benefícios exibidos nesta demonstração servem para testar a experiência do aplicativo. Para dúvidas ou problemas, use a Central de Suporte na sua conta. Em uma operação comercial, as condições de compra, entrega, cancelamento, troca e garantia deverão ser informadas antes da contratação, respeitando os direitos do consumidor.' },
      { title: '6. Conteúdo e atualizações', text: 'Respeite os direitos sobre marcas, imagens e textos apresentados no aplicativo. Funcionalidades e estes termos podem ser atualizados; consulte a data desta página. Nenhuma disposição destes termos afasta direitos previstos na legislação aplicável.' },
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    description: 'Entenda os dados usados pelo aplicativo',
    sections: [
      { title: '1. Dados que você informa', text: 'O aplicativo utiliza nome, sobrenome, e-mail e senha para a conta. Você também pode informar telefone, endereço, foto de perfil e dados dos seus veículos. Pedidos e chamados de suporte podem incluir informações e imagens enviadas por você.' },
      { title: '2. Para que os dados são usados', text: 'Essas informações permitem autenticar sua conta, exibir seu perfil e garagem, manter pedidos e benefícios e atender solicitações de suporte. Evite incluir documentos, dados de cartão ou outras informações sensíveis em fotos e mensagens.' },
      { title: '3. Armazenamento e sessão', text: 'Os dados da conta são enviados ao servidor configurado para esta instalação. A senha é armazenada como hash. O aplicativo também mantém dados de uso no dispositivo, como o carrinho, e utiliza mecanismos de sessão para reconhecer seu acesso. Sair da Conta encerra a sessão, mas não exclui o cadastro ou seu histórico.' },
      { title: '4. Acesso aos dados', text: 'As informações necessárias à operação podem ser acessadas por administradores e pela equipe de atendimento conforme suas permissões. Imagens de produtos carregadas de serviços externos envolvem conexão com esses serviços, que podem receber informações técnicas da requisição.' },
      { title: '5. Suas solicitações', text: 'Você pode editar seus dados pessoais e remover sua foto na área Conta. Para solicitar informações sobre seus dados, correção ou exclusão, abra um chamado na Central de Suporte. A exclusão não é automática; a equipe deverá analisar a solicitação e eventuais obrigações de conservação aplicáveis.' },
      { title: '6. Sobre esta versão', text: 'Este aviso descreve a versão demonstrativa atual. Antes da operação pública, deverão ser informados o responsável pelo tratamento, seu contato, as bases legais, os prazos de conservação e os fornecedores envolvidos no tratamento dos dados.' },
    ],
  },
  about: {
    title: 'Sobre a SpeedZone',
    description: 'Sua garagem e suas peças em um só lugar',
    sections: [
      { title: 'SpeedZone Motorsport', text: 'Um aplicativo para explorar o catálogo de peças, organizar os projetos da sua garagem e acompanhar pedidos e atendimento.' },
      { title: 'Versão demonstrativa', text: 'Esta é uma experiência em desenvolvimento. Pagamentos e entregas reais não estão disponíveis. Recursos, catálogo e benefícios podem mudar durante os testes.' },
      { title: 'Ajuda e contato', text: 'Entre na sua conta e acesse a Central de Suporte para enviar dúvidas sobre o aplicativo, relatar problemas ou solicitar atendimento sobre seus dados.' },
    ],
  },
} satisfies Record<LegalDocument, { title: string; description: string; sections: { title: string; text: string }[] }>;

export const legalUpdatedAt = '11 de novembro de 2026';
