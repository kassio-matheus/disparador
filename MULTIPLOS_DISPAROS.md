# 🚀 Sistema de Múltiplos Disparos - Documentação

## ✨ Novas Funcionalidades Implementadas

### 1. **Seleção de Modo de Criação**

Ao acessar a página de criar disparos, o usuário agora vê uma tela inicial elegante com duas opções:

- **📄 Disparo Único**: Modo tradicional para criar um disparo por vez
- **📋 Múltiplos Disparos** (RECOMENDADO): Crie quantos disparos quiser de uma vez

### 2. **Gerenciamento Visual de Disparos**

No modo múltiplo, uma nova interface permite:

#### Cards Interativos
- Visualização em grid de todos os disparos criados
- Cada card mostra:
  - Número do disparo
  - Funil selecionado
  - Etapa selecionada
  - Template escolhido
- Badge "EDITANDO" no card ativo
- Hover effects e transições suaves

#### Ações nos Cards
- **➕ Adicionar**: Botão para criar novo disparo vazio
- **📋 Duplicar**: Copia todas as configurações de um disparo existente
- **🗑️ Remover**: Exclui um disparo (mínimo de 1 disparo sempre mantido)
- **✏️ Editar**: Click no card para selecionar e editar

### 3. **Reutilização de Configurações**

- Botão "Duplicar" em cada card permite copiar instantaneamente todas as configurações:
  - Funil e etapa
  - Template de mensagem
  - Atendentes selecionados
  - Limites configurados
  - Fracionamento
  - Horários de envio

### 4. **Envio Sequencial com Delay**

Nova seção com checkbox para ativar envio sequencial:

- ⏱️ **Delay configurável**: De 1 a 300 segundos entre cada disparo
- 📊 **Cálculo automático**: Tempo total estimado exibido em tempo real
- 🎯 **Controle fino**: Evita sobrecarga da API e problemas de rate limiting

**Exemplo:**
- 5 disparos com delay de 30 segundos = 2 minutos de tempo total

### 5. **Pré-visualização Estética**

Antes de enviar, um modal de preview exibe:

#### Informações Gerais
- 📊 Total de disparos
- 🔄 Modo de envio (Sequencial/Paralelo)
- ⏱️ Tempo total estimado (se sequencial)

#### Detalhes de Cada Disparo
- Número identificador
- Funil e etapa
- Momento de envio (Agora/Agendado)
- Template selecionado
- Atendentes (badges coloridos)
- Limites configurados
- Status de fracionamento

#### Avisos e Validações
- Alerta visual se envio sequencial ativo
- Informações sobre intervalos
- Tempo total de execução

### 6. **Validações Inteligentes**

- ✅ Impede preview/envio se algum disparo estiver incompleto
- ✅ Validação individual de cada disparo antes do envio
- ✅ Feedback detalhado: quantos sucessos e quantos erros
- ✅ Não permite remover o único disparo restante

## 🎨 Design e UX

### Cores e Estilo
- **Gradientes modernos**: Fuchsia, Purple, Emerald, Teal
- **Animações suaves**: Fade-in, scale, hover effects
- **Badges informativos**: Status, alertas, contadores
- **Ícones SVG**: Interface intuitiva e moderna

### Responsividade
- Grid adaptativo: 1 coluna (mobile) → 2 colunas (tablet) → 3 colunas (desktop)
- Cards dimensionados automaticamente
- Scroll suave em listas longas

## 🔄 Fluxo de Uso

### Modo Único (Tradicional)
1. Selecionar "Disparo Único"
2. Preencher formulário
3. Clicar em "Enviar disparo"
4. Confirmação e redirecionamento

### Modo Múltiplo (Novo)
1. Selecionar "Múltiplos Disparos"
2. Preencher primeiro disparo
3. **Opcional**: Duplicar para reutilizar configurações
4. **Opcional**: Adicionar mais disparos vazios
5. Editar cada disparo clicando no card
6. **Opcional**: Ativar envio sequencial e configurar delay
7. Clicar em "Pré-visualizar Disparos"
8. Revisar todos os detalhes no modal
9. Confirmar e enviar
10. Feedback de sucessos/erros
11. Redirecionamento automático se tudo OK

## 📋 Componentes Criados

### `ModeSelection.js`
Modal inicial para escolha do modo de criação
- Design atraente com gradientes
- Cards interativos
- Dicas contextuais
- Animações de entrada

### `DisparosPreview.js`
Modal de pré-visualização completa
- Lista scrollável de disparos
- Cards informativos com todos os detalhes
- Estatísticas de envio
- Botões de confirmação/cancelamento

### Modificações em `form.js`
- Estados para modo múltiplo
- Funções de gerenciamento
- Sincronização automática entre formulário e disparos
- Função de envio múltiplo com controle de delay
- Interface de cards e controles
- Lógica de envio sequencial/paralelo

## 🛠️ Tecnologias Utilizadas

- **React Hooks**: useState, useEffect, useRef
- **Next.js 15**: App Router, Client Components
- **Tailwind CSS 4**: Utility classes, gradientes, animações
- **JavaScript ES6+**: Async/await, spread operators, arrow functions

## ⚙️ Configurações Técnicas

### Envio Múltiplo
```javascript
// Paralelo (padrão)
- Todos os disparos enviados simultaneamente
- Mais rápido
- Recomendado para poucos disparos

// Sequencial
- Um disparo por vez com delay
- Evita rate limiting
- Recomendado para muitos disparos
```

### Estrutura de Dados
```javascript
{
  id: timestamp,
  funil: { value, name },
  etapa: { value, name },
  momento: { value, name },
  agendamento: ISO string,
  quantidade: number,
  limites: number,
  modoLimite: "geral" | "individual",
  limitesIndividuais: {},
  template: object,
  selectedAtendentes: [],
  fracionamentoAtivo: boolean,
  // ... outras configurações
}
```

## 🎯 Benefícios

1. **Produtividade**: Crie múltiplos disparos em minutos
2. **Consistência**: Reutilize configurações testadas
3. **Controle**: Visualize tudo antes de enviar
4. **Segurança**: Validações impedem erros comuns
5. **Flexibilidade**: Escolha entre velocidade (paralelo) ou segurança (sequencial)
6. **UX Premium**: Interface moderna e intuitiva

## 📝 Notas Importantes

- O modo selecionado não é persistido (reset ao recarregar página)
- Cada disparo é independente e pode ter configurações diferentes
- O envio sequencial respeita o delay configurado
- Erros em disparos individuais não impedem os demais
- Feedback detalhado ao final do processo

## 🚀 Melhorias Futuras Possíveis

- [ ] Salvar rascunhos de múltiplos disparos
- [ ] Importar/exportar configurações
- [ ] Templates de conjuntos de disparos
- [ ] Agendamento diferenciado por disparo
- [ ] Dashboard de progresso em tempo real
- [ ] Histórico de disparos múltiplos
- [ ] Análise de performance (tempo real vs estimado)

---

**Desenvolvido com ❤️ para Frutos do Açaí**
