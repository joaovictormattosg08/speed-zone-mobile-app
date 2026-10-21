export const supportCategories = [
  { id: 'installation', label: 'Problema Técnico / Instalação Mecânica' },
  { id: 'fitment', label: 'Dúvida sobre Compatibilidade / Fitment' },
  { id: 'order', label: 'Informação sobre Envio / Pedido' },
  { id: 'warranty', label: 'Garantia ou Devolução de Componente' },
  { id: 'other', label: 'Outros assuntos da Garagem' },
] as const;
export type SupportCategory = typeof supportCategories[number]['id'];
export type TicketDraft = { name: string; email: string; category: SupportCategory; vehicleId: string | null; description: string; attachment: string | null; orderId?: string };
export type SupportTicket = TicketDraft & { id: string; status: 'open' | 'closed'; createdAt: string; updatedAt: string; vehicle: string; hasAttachment: boolean; messages: { id: string; text: string; createdAt: string; author: 'pilot' }[] };
export const supportFaq = [
  { title: 'Como abrir uma solicitação de garantia?', text: 'Selecione Garantia ou Devolução no formulário, informe a peça e o pedido e anexe uma foto. As condições precisam ser verificadas na documentação do produto. Nesta versão, a solicitação é salva localmente; a análise da equipe ainda não está disponível.' },
  { title: 'Onde vejo o prazo da minha entrega?', text: 'Abra Pedidos e toque em Ver Detalhes. O frete e o prazo escolhidos no carrinho aparecem no pedido. Os prazos atuais são de simulação, sem transportadora conectada.' },
  { title: 'Quais dados ajudam na análise de compatibilidade?', text: 'Informe modelo, ano, motorização, modificações do veículo e o código da peça. Fotos da aplicação e a descrição do sintoma ajudam a contextualizar a solicitação. A confirmação técnica depende da análise de um preparador.' },
];
