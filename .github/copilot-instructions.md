# Instruções para Agentes de IA - Disparador Frutos do Açaí

## Visão Geral do Projeto

Aplicação Next.js 15 para gerenciar disparos automatizados de mensagens WhatsApp via WhatsApp Cloud API. O sistema integra com um backend externo hospedado em Railway (`https://frutosdoacai.up.railway.app`) e gerencia funis, etapas de vendas, conexões WhatsApp e agendamento de mensagens.

## Estrutura da Aplicação

### Arquitetura
- **Framework**: Next.js 15.5.4 com App Router (não Pages Router)
- **Estilo**: Tailwind CSS 4 com PostCSS
- **Validação**: Zod + React Hook Form com `@hookform/resolvers`
- **Autenticação**: Cookie-based usando `cookies-next`, token armazenado como JSON serializado
- **Estado**: React state nativo (sem Redux/Zustand)

### Organização de Rotas (App Router)
```
app/
├── page.js              # Dashboard principal (protegido)
├── form.js              # Formulário de criação de disparo (client component)
├── TemplatePopup.js     # Modal de seleção de templates
├── login/page.jsx       # Página de autenticação
├── conexoes/page.jsx    # Gerenciamento de conexões WhatsApp
├── disparos/page.jsx    # Listagem de disparos criados
└── layout.js            # Layout raiz com fontes Geist
```

**IMPORTANTE**: Este projeto usa App Router, não Pages Router. Server Components são o padrão. Use `"use client"` apenas quando necessário (formulários, hooks, eventos).

## Padrões de Código

### Autenticação e Proteção de Rotas

**Server Component Pattern** ([app/page.js](app/page.js)):
```javascript
// Verificação server-side com redirecionamento
const cookieStore = await cookies();
const token = cookieStore.get("auth_token");
if (!token) redirect("/login");

try {
  const user = JSON.parse(token?.value);
  if (!user?.senha) redirect("/login");
} catch {
  redirect("/login");
}
```

**Client Component Pattern** ([app/login/page.jsx](app/login/page.jsx)):
```javascript
// Login armazena objeto user serializado
setCookie("auth_token", JSON.stringify(user), {
  expires: new Date().setMonth(new Date().getMonth + 1)
});
```

### Integração com API Backend

Todas as chamadas apontam para `https://frutosdoacai.up.railway.app/webhook/`. Endpoints principais:

- `POST /webhook/login` - Autenticação
- `POST /webhook/etapas` - Lista etapas de um funil
- `POST /webhook/etapa_limites` - Contagem total de leads em etapa
- `POST /webhook/limite-atendente` - Contagem de leads por atendente específico
- `GET /webhook/conexoes` - Lista conexões WhatsApp
- `POST /webhook/conexoes/id` - Busca conexão por ID
- `GET /webhook/disparos` - Lista todos os disparos

### Estado e Formulários

**Padrão de State Management** ([app/form.js](app/form.js)):
```javascript
// Estrutura consistente para selects: { value, name }
const [funil, setFunil] = useState({ value: undefined, name: undefined });
const [etapa, setEtapa] = useState({ value: undefined, name: undefined });

// Controle de refs para evitar fetchs duplicados
const fetchedRef = useRef(false);
const fetchingRef = useRef(false);
```

**Validação com Zod** ([app/login/page.jsx](app/login/page.jsx)):
```javascript
const formSchema = z.object({
  email: z.string().min(1),
  senha: z.string().min(1),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(formSchema)
});
```

### Lógica de Negócio Específica

#### Filtragem de Etapas por Funil
[app/form.js](app/form.js#L76-L97) implementa `allowedStagesMap` - um whitelist hardcoded de etapas permitidas por funil:
```javascript
const allowedStagesMap = {
  "6133020c8ad95d0014dc8dcf": ["62d6b24856f6cd0016ec747d", "6133020c8ad95d0014dc8dd1"],
  "673f469047292e0013add37d": ["673f469047292e0013add37f", ...],
  // ...
};
```
**Ao modificar funis/etapas, sempre atualizar este mapa.**

#### Mapeamento de Atendentes
IDs e nomes fixos em [app/form.js](app/form.js) e [app/disparos/page.jsx](app/disparos/page.jsx):
```javascript
const atendenteMap = {
  "6130429a380edb00129c7c05": "Kelvin (adm@frutosdoacai.com)",
  "6751df556184e5001acd5873": "Lorrayne (atendimento@frutosdoacai.com)",
  // ...
};
```

#### Cálculo de Limites por Atendente
Quando atendentes são selecionados, [app/form.js](app/form.js#L176-L201) busca limites individuais e soma:
```javascript
useEffect(() => {
  if (selectedAtendentes.length > 0) {
    const promises = selectedAtendentes.map(id => getLimiteAtendente(id));
    const results = await Promise.all(promises);
    const sum = results.reduce((acc, cur) => acc + (Number(cur) || 0), 0);
    setLimites(sum);
  } else {
    getLimitesEtapas(); // Volta ao total geral
  }
}, [etapa, selectedAtendentes]);
```

## Desenvolvimento

### Comandos
- `npm run dev` - Desenvolvimento local (porta 3000)
- `npm run build` - Build de produção
- `npm start` - Servidor de produção

### Banco de Dados
Utiliza Prisma (`@prisma/client` e `prisma`), mas não há schema visível no workspace. O backend externo gerencia persistência. **Não há comandos de migração no frontend.**

### Credenciais Hardcoded
⚠️ **AVISO DE SEGURANÇA**: [app/form.js](app/form.js) contém tokens da API ChakraHQ hardcoded:
```javascript
const CHAKRA_API_TOKEN = "PQchPTcPWID96ZXfbpIg3MtjXilxoSRg4vTVSUx1Fg7iCccJVed5vGLiBkJ7ywC2noS3yHay8ZgYGHYJ0KgIeplsMdDy6Fw0ymCixEe3QuShG27SYYjZi0T8sQC7Fg6E6SB0XfJL4Ar5xRC2YwFgWsHTsDHqoVn5xkd211RUNw0Ob2CUYald5lxDzxiRXsgFEBfKmAkmfbmODIyGe3GBQkLJ7BCkNk8zHOcw4YhwzaAFy1xLODeHJnFa7Ofj5VE";
const WHATSAPP_API_VERSION = "v24.0";
```
**Mova para variáveis de ambiente (.env.local) antes de produção.**

### Estrutura de Atendentes
Atendentes são definidos localmente em [app/form.js](app/form.js) com estrutura:
```javascript
const atendentes = [
  {
    id: "6130429a380edb00129c7c05",
    nome: "Kelvin",
    email: "adm@frutosdoacai.com",
    waba_id: "103966842495940",  // WhatsApp Business Account ID
    telefone: "+5511999999999"
  },
  // ...
];
```
**TODO**: Substituir por requisição ao backend quando tabela estiver pronta.

### Busca de Templates Multi-WABA
[app/form.js](app/form.js) busca templates de TODOS os waba_ids simultaneamente:
- Endpoint: `https://api.chakrahq.com/v1/ext/plugin/whatsapp/api/v24.0/{waba_id}/message_templates?limit=100`
- Método: GET com `Authorization: Bearer {CHAKRA_API_TOKEN}`
- Templates duplicados são agrupados por ID/nome
- Cada template carrega arrays `atendente_ids`, `atendente_nomes`, `waba_ids`

### Validação de Templates por Atendente
Checkboxes de atendentes ficam desabilitados quando incompatíveis com template selecionado:
```javascript
const isCompatible = !template || 
  (template.atendente_ids || [template.atendente_id]).includes(atendente.id);
```
- Validação acontece antes do envio do formulário
- Seleção de atendentes é limpa automaticamente ao trocar template

## Convenções de UI

### Tailwind Classes
- Inputs: `border border-gray-300 w-full p-2 rounded-xl text-black`
- Botões primários: `bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-xl`
- Cards: `bg-white p-8 rounded-2xl shadow-md`
- Status badges: 
  - Ativo: `bg-yellow-500`
  - Pausado: `bg-red-500`
  - Finalizado: `bg-green-500`

### Componentes Reutilizáveis
- `TemplatePopup.js` - Modal com scroll infinito para templates (usa Intersection Observer)
- Estrutura: `<Popup trigger={trigger} modal nested>`

## Problemas Comuns

1. **Erro de hidratação**: Use `suppressHydrationWarning` no `<body>` ([app/layout.js](app/layout.js#L26))
2. **CORS com backend**: Backend Railway deve ter CORS configurado
3. **Formato de datas**: API retorna ISO strings, sempre formatar com `new Date().toLocaleString("pt-BR")`
4. **State vazio em conexões**: Backend retorna `500` quando sem dados ([app/conexoes/page.jsx](app/conexoes/page.jsx#L41-L48)) - tratar especificamente

## Fontes e Metadata

- Fonte principal: Geist (variável `--font-geist`)
- Fonte mono: Geist Mono (variável `--font-geist-mono`)
- Título da página: "Painel - Disparador Frutos do Açaí"
- Lang: `pt-br`

## Referências Rápidas

- Todas as páginas de dashboard têm função `LogOut()` idêntica
- Links de navegação: `/` (dashboard), `/conexoes`, `/disparos`, `/login`
- Sempre usar `<Link>` do Next.js para navegação interna
- Sempre usar `<Image>` do Next.js para imagens
