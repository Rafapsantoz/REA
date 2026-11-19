import { Corretor } from './types';

export const DEFAULT_CARGOS: string[] = [
  "Responsável Técnico & Diretor",
  "Corretor de Imóveis",
  "Corretora Especialista em Locação",
  "Coordenador Comercial",
  "Corretor Comercial & Rural",
  "Avaliador Perito Imobiliário"
];

export const INITIAL_CORRETORES: Corretor[] = [
  {
    id: "cor_1",
    nome: "Manoel Jerônimo",
    creci: "278536-F",
    email: "manoel.jeronimo@imobiliariajeronimo.com.br",
    telefone: "(19) 99303-0194",
    cpf: "142.890.318-44",
    cargo: "Responsável Técnico & Diretor",
    comissaoPadrao: 100,
    comissaoADefinir: false,
    status: "ativo",
    dataCadastro: "10/01/2020",
    totalContratos: 14,
    totalImoveis: 28,
    bio: "Mais de 15 anos de atuação no mercado imobiliário regional de Mococa e Vale do Rio Pardo."
  },
  {
    id: "cor_2",
    nome: "Carla Mendes",
    creci: "215432-F",
    email: "carla.mendes@imobiliariajeronimo.com.br",
    telefone: "(19) 98877-3344",
    cpf: "289.441.788-12",
    cargo: "Corretora Especialista em Locação",
    comissaoPadrao: 50,
    comissaoADefinir: true,
    status: "ativo",
    dataCadastro: "15/03/2023",
    totalContratos: 8,
    totalImoveis: 16,
    bio: "Focada em atendimento humanizado, triagem ágil de cadastros e vistorias digitais detalhadas."
  },
  {
    id: "cor_3",
    nome: "Rodrigo Toledo",
    creci: "248910-F",
    email: "rodrigo.toledo@imobiliariajeronimo.com.br",
    telefone: "(19) 99123-5566",
    cpf: "355.672.908-51",
    cargo: "Corretor Comercial & Rural",
    comissaoPadrao: 50,
    comissaoADefinir: true,
    status: "ativo",
    dataCadastro: "05/08/2024",
    totalContratos: 5,
    totalImoveis: 12,
    bio: "Especialista em contratos comerciais e propriedades rurais com ampla carteira de investidores."
  }
];
