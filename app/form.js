"use client";

import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import TemplatesPopup from "./TemplatePopup";
import Link from "next/link";
import Image from "next/image";
import DisparosPreview from "./DisparosPreview";

// Função para formatar data no fuso horário de Cuiabá (America/Cuiaba - UTC-4)
const formatarDataCuiaba = (data) => {
  if (!data) return "";
  return new Date(data).toLocaleString("pt-BR", {
    timeZone: "America/Cuiaba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function Form() {
  const router = useRouter();

  // Modo de criação: "single" ou "multiple"
  const [creationMode, setCreationMode] = useState(null);
  const [showModeSelection, setShowModeSelection] = useState(true);

  // Array de disparos para modo múltiplo
  const [disparos, setDisparos] = useState([]);
  const [activeDisparoIndex, setActiveDisparoIndex] = useState(0);

  // Estados para drag-and-drop
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Flag para evitar loop infinito ao carregar dados do disparo
  const isLoadingDisparoData = useRef(false);

  // Configurações de envio sequencial
  const [envioSequencial, setEnvioSequencial] = useState(false);
  const [delayEnvio, setDelayEnvio] = useState(5); // em segundos
  const [delayDias, setDelayDias] = useState(0);
  const [delayHoras, setDelayHoras] = useState(0);
  const [delayMinutos, setDelayMinutos] = useState(0);
  const [delaySegundos, setDelaySegundos] = useState(5);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  const [funil, setFunil] = useState({
    value: undefined,
    name: undefined,
  });

  const [etapas, setEtapas] = useState([]);
  const [etapa, setEtapa] = useState({
    value: undefined,
    name: undefined,
  });

  const [momento, setMomento] = useState({
    value: undefined,
    name: undefined,
  });

  const [agendamento, setAgendamento] = useState(undefined);

  const [quantidade, setQuantidade] = useState(0);

  const [limites, setLimites] = useState(0);
  const [modoLimite, setModoLimite] = useState("geral"); // "geral" ou "individual"
  const [limitesIndividuais, setLimitesIndividuais] = useState({}); // { atendente_id: limite }

  const [templates, setTemplates] = useState([]);
  const [templatePopup, setTemplatePopup] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const loader = useRef(null);
  const [template, setTemplate] = useState(undefined);
  const [hasName, setHasName] = useState(false);

  // evita re-buscar ao voltar para a página se já buscado nesta instância
  const fetchedRef = useRef(false);
  // evita fetchs paralelos
  const fetchingRef = useRef(false);

  // filtragem por atendentes
  const [selectedAtendentes, setSelectedAtendentes] = useState([]);
  const [atendentes, setAtendentes] = useState([]);
  const [loadingAtendentes, setLoadingAtendentes] = useState(true);
  // opcional: cache local de contagens por atendente
  const [atendenteCounts, setAtendenteCounts] = useState({});

  const dateInputRef = useRef(null);
  const [showDatepicker, setShowDatepicker] = useState(false);

  // Estados para fracionamento de disparo
  const [fracionamentoAtivo, setFracionamentoAtivo] = useState(false);
  const [leadsPorLote, setLeadsPorLote] = useState("");
  const [pausaDias, setPausaDias] = useState("");
  const [pausaHoras, setPausaHoras] = useState("");
  const [pausaMinutos, setPausaMinutos] = useState("");
  const [pausaSegundos, setPausaSegundos] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");

  // useEffect para desabilitar fracionamento quando limites < 5
  useEffect(() => {
    if (limites < 5 && fracionamentoAtivo) {
      setFracionamentoAtivo(false);
      setLeadsPorLote("");
      setPausaHoras("");
      setPausaMinutos("");
      setPausaSegundos("");
    }
  }, [limites]);

  // useEffect para resetar agendamento quando envio sequencial for ativado
  useEffect(() => {
    if (creationMode === "multiple" && envioSequencial && agendamento) {
      setAgendamento(undefined);
    }
  }, [envioSequencial, creationMode]);

  // useEffect para sincronizar delayEnvio (total em segundos)
  useEffect(() => {
    const total =
      Number(delayDias || 0) * 86400 +
      Number(delayHoras || 0) * 3600 +
      Number(delayMinutos || 0) * 60 +
      Number(delaySegundos || 0);
    setDelayEnvio(total > 0 ? total : 1); // Garante pelo menos 1s se envio sequencial estiver ativo
  }, [delayDias, delayHoras, delayMinutos, delaySegundos]);

  // Configuração da API Facebook Graph API - TODO: mover para variáveis de ambiente (.env.local)
  const WHATSAPP_API_VERSION = "v24.0";

  // Lista de atendentes com seus respectivos waba_ids
  // TODO: Substituir por requisição ao backend quando tabela estiver pronta
  // Buscar atendentes do backend
  async function getAtendentes() {
    try {
      setLoadingAtendentes(true);
      const response = await fetch(
        "https://frutosdoacai.up.railway.app/webhook/atendentes"
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar atendentes");
      }

      const data = await response.json();

      // Para cada atendente com waba_id, buscar o telefone da conexão
      const formattedAtendentes = await Promise.all(
        data.map(async (atendente) => {
          let telefone = "";
          let token = "";

          // Se o atendente tem waba_id, buscar telefone da conexão
          if (atendente.waba_id) {
            try {
              const conexaoResponse = await fetch(
                "https://frutosdoacai.up.railway.app/webhook/conexoes/waba_id",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ waba_id: atendente.waba_id }),
                }
              );

              if (conexaoResponse.ok) {
                const conexaoData = await conexaoResponse.json();
                telefone = conexaoData.telefone || "";
                token = conexaoData.token || "";
              }
            } catch (error) {
              console.error(
                `Erro ao buscar telefone para waba_id ${atendente.waba_id}:`,
                error
              );
            }
          }

          return {
            id: atendente.atendente_id,
            nome: atendente.nome,
            email: atendente.email,
            waba_id: atendente.waba_id,
            telefone: telefone,
            token: token,
          };
        })
      );

      setAtendentes(formattedAtendentes);
    } catch (error) {
      console.error("Erro ao buscar atendentes:", error);
      // Em caso de erro, manter array vazio
      setAtendentes([]);
    } finally {
      setLoadingAtendentes(false);
    }
  }

  // Buscar atendentes ao montar o componente
  useEffect(() => {
    getAtendentes();
  }, []);

  async function LogOut() {
    await deleteCookie("auth_token");
    router.push("/login");
  }

  // ========== FUNÇÕES DE GERENCIAMENTO DE MÚLTIPLOS DISPAROS ==========

  const iniciarCriacaoUnica = () => {
    setCreationMode("single");
    setShowModeSelection(false);
  };

  const iniciarCriacaoMultipla = () => {
    setCreationMode("multiple");
    setShowModeSelection(false);

    // Capturar estado atual do formulário
    const estadoAtual = {
      id: Date.now(),
      funil,
      etapas,
      etapa,
      momento,
      agendamento,
      quantidade,
      limites,
      modoLimite,
      limitesIndividuais,
      template,
      selectedAtendentes,
      fracionamentoAtivo,
      leadsPorLote,
      pausaMinutos,
      pausaSegundos,
      pausaDias,
      pausaHoras,
      horaInicio,
      horaFim,
      hasName,
      atendenteCounts,
    };
    setDisparos([estadoAtual]);
    setActiveDisparoIndex(0);
  };

  const adicionarNovoDisparo = () => {
    const novoDisparo = {
      id: Date.now(),
      funil: { value: undefined, name: undefined },
      etapa: { value: undefined, name: undefined },
      etapas: [],
      momento: { value: undefined, name: undefined },
      agendamento: undefined,
      quantidade: 0,
      limites: 0,
      modoLimite: "geral",
      limitesIndividuais: {},
      template: undefined,
      selectedAtendentes: [],
      fracionamentoAtivo: false,
      leadsPorLote: 50,
      pausaMinutos: 0,
      pausaSegundos: 5,
      pausaDias: 0,
      pausaHoras: 0,
      horaInicio: "",
      horaFim: "",
      hasName: false,
      atendenteCounts: {},
    };
    setDisparos([...disparos, novoDisparo]);
    setActiveDisparoIndex(disparos.length);
  };

  const duplicarDisparo = (index) => {
    const disparoOriginal = disparos[index];
    const novoDisparo = {
      ...disparoOriginal,
      id: Date.now(),
      etapas: [...(disparoOriginal.etapas || [])],
    };
    const novosDisparos = [...disparos];
    novosDisparos.splice(index + 1, 0, novoDisparo);
    setDisparos(novosDisparos);
    setActiveDisparoIndex(index + 1);
  };

  const removerDisparo = (index) => {
    if (disparos.length === 1) {
      alert("É necessário ter pelo menos um disparo!");
      return;
    }
    const novosDisparos = disparos.filter((_, i) => i !== index);
    setDisparos(novosDisparos);
    if (activeDisparoIndex >= novosDisparos.length) {
      setActiveDisparoIndex(novosDisparos.length - 1);
    }
  };

  const moverDisparoParaCima = (index) => {
    if (index === 0) return; // Já está no topo
    const novosDisparos = [...disparos];
    [novosDisparos[index - 1], novosDisparos[index]] = [
      novosDisparos[index],
      novosDisparos[index - 1],
    ];
    setDisparos(novosDisparos);
    setActiveDisparoIndex(index - 1);
  };

  const moverDisparoParaBaixo = (index) => {
    if (index === disparos.length - 1) return; // Já está no final
    const novosDisparos = [...disparos];
    [novosDisparos[index], novosDisparos[index + 1]] = [
      novosDisparos[index + 1],
      novosDisparos[index],
    ];
    setDisparos(novosDisparos);
    setActiveDisparoIndex(index + 1);
  };

  // ========== FUNÇÕES DE DRAG-AND-DROP ==========

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget);
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    // Só limpa se realmente saiu do elemento
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const novosDisparos = [...disparos];
    const [itemArrastado] = novosDisparos.splice(draggedIndex, 1);
    novosDisparos.splice(dropIndex, 0, itemArrastado);

    setDisparos(novosDisparos);

    // Atualizar índice ativo
    if (activeDisparoIndex === draggedIndex) {
      setActiveDisparoIndex(dropIndex);
    } else if (
      draggedIndex < activeDisparoIndex &&
      dropIndex >= activeDisparoIndex
    ) {
      setActiveDisparoIndex(activeDisparoIndex - 1);
    } else if (
      draggedIndex > activeDisparoIndex &&
      dropIndex <= activeDisparoIndex
    ) {
      setActiveDisparoIndex(activeDisparoIndex + 1);
    }

    setDragOverIndex(null);
  };

  // ========== FUNÇÃO DE ENVIO DE MÚLTIPLOS DISPAROS ==========

  const enviarMultiplosDisparos = async () => {
    const payloads = [];

    for (let i = 0; i < disparos.length; i++) {
      const disparo = disparos[i];

      // Validações para cada disparo
      if (
        !disparo.funil?.value ||
        !disparo.etapa?.value ||
        !disparo.momento?.value ||
        !disparo.template
      ) {
        alert(
          `Disparo ${
            i + 1
          } está incompleto. Por favor, preencha todos os campos obrigatórios.`
        );
        return;
      }

      // Montar payload do disparo individual
      const etapaFinal = getEtapaFinal(
        disparo.funil.value,
        disparo.etapa.value
      );

      payloads.push({
        funil: { ...disparo.funil },
        etapa: { ...disparo.etapa },
        etapa_final: etapaFinal,
        agendamento: disparo.agendamento
          ? new Date(disparo.agendamento).toISOString()
          : null,
        quantidade:
          disparo.modoLimite === "geral"
            ? disparo.quantidade === ""
              ? 0
              : Number(disparo.quantidade)
            : 0,
        limites: disparo.limites,
        modo_limite: disparo.modoLimite,
        limites_individuais:
          disparo.modoLimite === "individual" ? disparo.limitesIndividuais : {},
        template: disparo.template,
        selectedAtendentes: disparo.selectedAtendentes.slice(),
        atendenteCounts: disparo.atendenteCounts || {},
        hasName: Boolean(disparo.hasName),
        fracionamento: disparo.fracionamentoAtivo
          ? {
              ativo: true,
              leads_por_lote: Number(disparo.leadsPorLote),
              pausa_segundos:
                Number(disparo.pausaDias || 0) * 86400 +
                Number(disparo.pausaHoras || 0) * 3600 +
                Number(disparo.pausaMinutos || 0) * 60 +
                Number(disparo.pausaSegundos || 0),
              hora_inicio: disparo.horaInicio || "",
              hora_fim: disparo.horaFim || "",
            }
          : { ativo: false },
      });
    }

    const payloadFinal = {
      disparos: payloads,
      quantidade: disparos.length,
      sequencial: {
        ativo: envioSequencial,
        delay: delayEnvio,
      },
    };

    try {
      setLoading(true);
      const response = await fetch(
        "https://frutosdoacai.up.railway.app/webhook/disparo/multiplos",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadFinal),
        }
      );

      if (response.ok) {
        alert(
          `✅ Todos os ${disparos.length} disparos foram enviados com sucesso!`
        );
        router.push("/disparos");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(
          `❌ Erro ao enviar os disparos: ${
            errorData.error || "O servidor retornou um erro."
          }`
        );
      }
    } catch (err) {
      console.error("❌ Erro ao enviar múltiplos disparos:", err);
      alert("❌ Ocorreu um erro de rede ao tentar enviar os disparos.");
    } finally {
      setLoading(false);
    }
  };

  const atualizarDisparoAtivo = (campo, valor) => {
    if (creationMode === "multiple") {
      const novosDisparos = [...disparos];
      novosDisparos[activeDisparoIndex] = {
        ...novosDisparos[activeDisparoIndex],
        [campo]: valor,
      };
      setDisparos(novosDisparos);
    }
  };

  const getCurrentDisparoData = () => {
    if (creationMode === "multiple" && disparos[activeDisparoIndex]) {
      return disparos[activeDisparoIndex];
    }
    return {
      funil,
      etapas,
      etapa,
      momento,
      agendamento,
      quantidade,
      limites,
      modoLimite,
      limitesIndividuais,
      template,
      selectedAtendentes,
      fracionamentoAtivo,
      leadsPorLote,
      pausaMinutos,
      pausaSegundos,
      pausaDias,
      pausaHoras,
      horaInicio,
      horaFim,
      hasName,
    };
  };

  async function getEtapas() {
    // map de funil -> etapas permitidas
    const allowedStagesMap = {
      "6133020c8ad95d0014dc8dcf": [
        "62d6b24856f6cd0016ec747d",
        "6133020c8ad95d0014dc8dd1",
      ],
      "673f469047292e0013add37d": [
        "673f469047292e0013add37f",
        "673f469047292e0013add381",
        "6751e88e5066b100267f8f08",
      ],
      "673f475152664e001aca526d": [
        "673f475152664e001aca526f",
        "673f475152664e001aca5271",
        "673f5d1c9de8d50027092bd4",
      ],
      "673f5d7ed19d0500276a0f59": [
        "673f5d7ed19d0500276a0f5b",
        "673f5d7ed19d0500276a0f5d",
        "673f5d7ed19d0500276a0f5f",
        "673f5db30eb48c00130c8393",
      ],
    };

    const response = await fetch(
      "https://frutosdoacai.up.railway.app/webhook/etapas",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: funil.value,
        }),
      }
    );

    const data = await response.json();

    if (data && Array.isArray(data.deal_stages)) {
      const allowed = allowedStagesMap[funil.value];
      // normaliza id em _id, id ou se o item já for string
      const filtered = allowed
        ? data.deal_stages.filter((s) => {
            const id = s?._id || s?.id || s;
            return allowed.includes(id);
          })
        : data.deal_stages;
      setEtapas(filtered);
    } else {
      setEtapas([]);
    }
  }

  async function getLimitesEtapas() {
    const response = await fetch(
      "https://frutosdoacai.up.railway.app/webhook/etapa_limites",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: etapa.value,
        }),
      }
    );

    const data = await response.json();

    if (data) {
      setLimites(data.total);
    }
  }

  // busca limite para um atendente específico (retorna número)
  async function getLimiteAtendente(userId) {
    if (!etapa?.value) return 0;
    try {
      const response = await fetch(
        "https://frutosdoacai.up.railway.app/webhook/limite-atendente",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            etapa_id: etapa.value,
          }),
        }
      );

      const data = await response.json();
      // Ajuste conforme o shape real da resposta (aqui uso data.total)
      return data?.total ? Number(data.total) : 0;
    } catch (err) {
      console.error("Erro getLimiteAtendente:", err);
      return 0;
    }
  }

  // Buscar contagens de todos os atendentes quando etapa mudar
  useEffect(() => {
    if (!etapa?.value) {
      setAtendenteCounts({});
      return;
    }

    let mounted = true;
    (async () => {
      try {
        // Buscar contagem para TODOS os atendentes
        const promises = atendentes.map((atendente) =>
          getLimiteAtendente(atendente.id)
        );
        const results = await Promise.all(promises);
        if (!mounted) return;

        // Criar mapa de contagens
        const newCache = {};
        atendentes.forEach((atendente, idx) => {
          newCache[atendente.id] = results[idx];
        });
        setAtendenteCounts(newCache);
      } catch (err) {
        console.error("Erro ao buscar contagens de atendentes:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [etapa]);

  // Atualizar limites quando seleção de atendentes mudar
  useEffect(() => {
    if (!etapa?.value) return;

    // Se nenhum atendente selecionado, limites = 0
    if (!selectedAtendentes || selectedAtendentes.length === 0) {
      setLimites(0);
      return;
    }

    // Somar contagens dos atendentes selecionados
    const sum = selectedAtendentes.reduce((acc, id) => {
      return acc + (Number(atendenteCounts[id]) || 0);
    }, 0);
    setLimites(sum);
  }, [selectedAtendentes, atendenteCounts, etapa]);

  // Resetar limites individuais quando modo mudar para geral
  useEffect(() => {
    if (modoLimite === "geral") {
      setLimitesIndividuais({});
    }
  }, [modoLimite]);

  // Inicializar limites individuais quando mudar para modo individual
  useEffect(() => {
    if (modoLimite === "individual" && selectedAtendentes.length > 0) {
      const novosLimites = {};
      selectedAtendentes.forEach((id) => {
        if (!limitesIndividuais[id]) {
          novosLimites[id] = 0;
        } else {
          novosLimites[id] = limitesIndividuais[id];
        }
      });
      setLimitesIndividuais(novosLimites);
    }
  }, [selectedAtendentes, modoLimite]);

  useEffect(() => {
    if (funil?.value) {
      getEtapas();
    }
  }, [funil]);

  useEffect(() => {
    if (etapa?.value) {
      setQuantidade(0);
      setLimites(0);
      getLimitesEtapas();
    }
  }, [etapa]);

  async function getTemplates(cursor = null) {
    if (loading || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    // Limpa templates apenas na primeira busca (sem cursor)
    if (!cursor) {
      setTemplates([]);
    }

    try {
      const allTemplates = [];
      const errors = [];
      let globalNextCursor = null;

      // Filtrar apenas atendentes que possuem waba_id válido
      const atendentesComWaba = atendentes.filter(
        (atendente) => atendente.waba_id && atendente.waba_id.trim() !== ""
      );

      // Buscar templates de todos os waba_ids dos atendentes
      await Promise.all(
        atendentesComWaba.map(async (atendente) => {
          try {
            let url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${atendente.waba_id}/message_templates`;

            // Adicionar cursor se fornecido (para paginação)
            if (cursor) {
              url += `?after=${cursor}`;
            }

            const response = await fetch(url, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${atendente.token}`,
                "Content-Type": "application/json",
              },
            });

            if (!response.ok) {
              throw new Error(
                `Erro ${response.status} ao buscar templates de ${atendente.nome}`
              );
            }

            const data = await response.json();

            if (data?.data && Array.isArray(data.data)) {
              // Marcar cada template com o waba_id e atendente de origem
              const templatesWithOwner = data.data.map((tmpl) => ({
                ...tmpl,
                waba_id: atendente.waba_id,
                atendente_id: atendente.id,
                atendente_nome: atendente.nome,
              }));
              allTemplates.push(...templatesWithOwner);
            }

            // Capturar cursor de paginação se disponível
            if (data?.paging?.cursors?.after && !globalNextCursor) {
              globalNextCursor = data.paging.cursors.after;
            }
          } catch (error) {
            console.error(
              `Erro ao buscar templates de ${atendente.nome}:`,
              error
            );
            errors.push({ atendente: atendente.nome, error: error.message });
          }
        })
      );

      // Agrupar templates por nome (mesmo template pode estar em múltiplos waba_ids)
      const templatesMap = new Map();

      // Adicionar templates existentes ao mapa se estiver paginando
      if (cursor && templates.length > 0) {
        templates.forEach((tmpl) => {
          const key = tmpl.name; // Usar apenas nome como chave
          templatesMap.set(key, { ...tmpl });
        });
      }

      allTemplates.forEach((tmpl) => {
        const key = tmpl.name; // Usar apenas nome como chave
        if (templatesMap.has(key)) {
          const existing = templatesMap.get(key);
          // Adicionar waba_id, atendente e status aos arrays
          if (!existing.waba_ids) {
            existing.waba_ids = [existing.waba_id];
            existing.atendente_ids = [existing.atendente_id];
            existing.atendente_nomes = [existing.atendente_nome];
            existing.statuses = [existing.status]; // Preservar status por conexão
          }
          existing.waba_ids.push(tmpl.waba_id);
          existing.atendente_ids.push(tmpl.atendente_id);
          existing.atendente_nomes.push(tmpl.atendente_nome);
          existing.statuses.push(tmpl.status); // Adicionar status desta conexão
        } else {
          templatesMap.set(key, { ...tmpl });
        }
      });

      const uniqueTemplates = Array.from(templatesMap.values());
      setTemplates(uniqueTemplates);
      setNextCursor(globalNextCursor); // Atualizar cursor para próxima página

      if (errors.length > 0) {
        console.warn("Alguns templates não puderam ser carregados:", errors);
      }
    } catch (error) {
      console.error("Erro ao buscar templates:", error);
      alert(
        "Erro ao carregar templates. Verifique a conexão e tente novamente."
      );
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }

  // Scroll infinito — detecta quando o usuário chega ao fim da lista
  useEffect(() => {
    if (!loader.current) return;

    if (templates.length !== 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && nextCursor) {
            getTemplates(nextCursor);
          }
        },
        { threshold: 1.0 }
      );

      observer.observe(loader.current);
      return () => observer.disconnect();
    }
  }, [nextCursor]);

  // Busca inicial — executa ao abrir o popup de templates
  useEffect(() => {
    if (templatePopup && !fetchedRef.current) {
      fetchedRef.current = true;
      getTemplates();
    }
  }, [templatePopup]);

  // Limpar atendentes selecionados quando template mudar
  useEffect(() => {
    if (template) {
      // Filtrar apenas atendentes compatíveis com o template
      const compatibleAtendentes = template.atendente_ids || [
        template.atendente_id,
      ];
      setSelectedAtendentes((prev) =>
        prev.filter((id) => compatibleAtendentes.includes(id))
      );
    }
  }, [template]);

  // ========== SINCRONIZAÇÃO COM MODO MÚLTIPLO ==========

  // Quando mudar o disparo ativo, atualizar os campos do formulário
  useEffect(() => {
    if (creationMode === "multiple" && disparos[activeDisparoIndex]) {
      isLoadingDisparoData.current = true;
      const disparo = disparos[activeDisparoIndex];
      setFunil(disparo.funil);
      setEtapas(disparo.etapas || []);
      setEtapa(disparo.etapa);
      setMomento(disparo.momento);
      setAgendamento(disparo.agendamento);
      setQuantidade(disparo.quantidade);
      setLimites(disparo.limites);
      setModoLimite(disparo.modoLimite);
      setLimitesIndividuais(disparo.limitesIndividuais);
      setTemplate(disparo.template);
      setSelectedAtendentes(disparo.selectedAtendentes);
      setFracionamentoAtivo(disparo.fracionamentoAtivo);
      setLeadsPorLote(disparo.leadsPorLote);
      setPausaMinutos(disparo.pausaMinutos);
      setPausaSegundos(disparo.pausaSegundos);
      setPausaDias(disparo.pausaDias);
      setPausaHoras(disparo.pausaHoras);
      setHoraInicio(disparo.horaInicio);
      setHoraFim(disparo.horaFim);
      setHasName(disparo.hasName || false);
      setAtendenteCounts(disparo.atendenteCounts || {});
      // Aguarda próximo render para liberar
      setTimeout(() => {
        isLoadingDisparoData.current = false;
      }, 0);
    }
  }, [creationMode, activeDisparoIndex]);

  // Quando qualquer campo mudar no modo múltiplo, atualizar o disparo ativo
  useEffect(() => {
    // Não executar se estiver carregando dados
    if (isLoadingDisparoData.current) return;

    if (creationMode === "multiple" && disparos[activeDisparoIndex]) {
      const novosDisparos = [...disparos];
      novosDisparos[activeDisparoIndex] = {
        ...novosDisparos[activeDisparoIndex],
        funil,
        etapas,
        etapa,
        momento,
        agendamento,
        quantidade,
        limites,
        modoLimite,
        limitesIndividuais,
        template,
        selectedAtendentes,
        fracionamentoAtivo,
        leadsPorLote,
        pausaMinutos,
        pausaSegundos,
        pausaDias,
        pausaHoras,
        horaInicio,
        horaFim,
        hasName,
        atendenteCounts,
      };
      if (JSON.stringify(novosDisparos) !== JSON.stringify(disparos)) {
        setDisparos(novosDisparos);
      }
    }
  }, [
    funil,
    etapas,
    etapa,
    momento,
    agendamento,
    quantidade,
    limites,
    modoLimite,
    limitesIndividuais,
    template,
    selectedAtendentes,
    fracionamentoAtivo,
    leadsPorLote,
    pausaMinutos,
    pausaSegundos,
    pausaDias,
    pausaHoras,
    horaInicio,
    horaFim,
    hasName,
    atendenteCounts,
  ]);

  // mapeia funil + etapa para etapa_final
  function getEtapaFinal(funilId, etapaId) {
    const map = {
      "6133020c8ad95d0014dc8dcf": {
        "62d6b24856f6cd0016ec747d": "674f9208032c5f0013d767a0",
        "6133020c8ad95d0014dc8dd1": "6133020c8ad95d0014dc8dd2",
      },
      "673f469047292e0013add37d": {
        "673f469047292e0013add37f": "673f469047292e0013add380",
        "673f469047292e0013add381": "6751e8a20ebc9a0013a46a2c",
        "6751e88e5066b100267f8f08": "673f5b5a784d8e001e401ebc",
      },
      "673f475152664e001aca526d": {
        "673f475152664e001aca526f": "673f475152664e001aca5270",
        "673f475152664e001aca5271": "673f475152664e001aca5272",
        "673f5d1c9de8d50027092bd4": "673f475152664e001aca5273",
      },
      "673f5d7ed19d0500276a0f59": {
        "673f5d7ed19d0500276a0f5b": "673f5d7ed19d0500276a0f5c",
        "673f5d7ed19d0500276a0f5d": "673f5d7ed19d0500276a0f5c",
        "673f5d7ed19d0500276a0f5f": "673f5d7ed19d0500276a0f5c",
        "673f5db30eb48c00130c8393": "673f5d7ed19d0500276a0f5c",
      },
    };

    return map[funilId]?.[etapaId] || null;
  }

  // detecta se o template contém o placeholder {{nome}}
  function templateHasName(tpl) {
    if (!tpl) return false;
    const regex = /{{\s*nome\s*}}/i;
    const toCheck = [];

    // campos comuns onde o texto do template pode aparecer
    if (typeof tpl.body === "string") toCheck.push(tpl.body);
    if (typeof tpl.text === "string") toCheck.push(tpl.text);
    if (typeof tpl.message === "string") toCheck.push(tpl.message);
    if (tpl.body && typeof tpl.body.text === "string")
      toCheck.push(tpl.body.text);

    // estrutura do Graph API: components array
    if (Array.isArray(tpl.components)) {
      tpl.components.forEach((c) => {
        if (typeof c.text === "string") toCheck.push(c.text);
        if (Array.isArray(c.parameters)) {
          c.parameters.forEach((p) => {
            if (typeof p.text === "string") toCheck.push(p.text);
          });
        }
      });
    }

    return toCheck.some((s) => regex.test(s));
  }

  // sempre que o template mudar, detecta se precisa enviar hasName
  useEffect(() => {
    setHasName(templateHasName(template));
  }, [template]);

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validações de campos obrigatórios básicos
    if (!funil.value) {
      alert("Selecione um funil!");
      return;
    }

    if (!etapa.value) {
      alert("Selecione uma etapa!");
      return;
    }

    if (!momento.value) {
      alert("Selecione o momento do disparo!");
      return;
    }

    if (!template) {
      alert("Selecione um template de mensagem!");
      return;
    }

    if (!selectedAtendentes || selectedAtendentes.length === 0) {
      alert("Selecione pelo menos um atendente para realizar o disparo!");
      return;
    }

    // Validar limites individuais se modo individual estiver ativo
    if (modoLimite === "individual") {
      // Validar que os limites individuais não excedem o máximo disponível
      for (const atendenteId of selectedAtendentes) {
        const limite = Number(limitesIndividuais[atendenteId] || 0);
        const maxDisponivel = Number(atendenteCounts[atendenteId] || 0);

        if (limite > maxDisponivel) {
          const atendente = atendentes.find((a) => a.id === atendenteId);
          alert(
            `O limite definido para ${atendente?.nome} (${limite}) excede o máximo disponível (${maxDisponivel}).`
          );
          return;
        }
      }
    }

    // Validar quantidade no modo geral
    if (modoLimite === "geral" && quantidade && Number(quantidade) > limites) {
      alert(
        `A quantidade solicitada (${quantidade}) excede o limite disponível (${limites}).`
      );
      return;
    }

    // Validar fracionamento se ativo
    if (fracionamentoAtivo) {
      if (!leadsPorLote || leadsPorLote === "" || Number(leadsPorLote) <= 0) {
        alert(
          "O campo 'Leads por Lote' é obrigatório quando o fracionamento está ativo!"
        );
        return;
      }

      if (Number(leadsPorLote) < 5) {
        alert("A quantidade mínima de leads por lote é 5!");
        return;
      }

      if (Number(leadsPorLote) % 5 !== 0) {
        alert("A quantidade de leads por lote deve ser um múltiplo de 5!");
        return;
      }

      const tempoTotal =
        Number(pausaHoras || 0) * 3600 +
        Number(pausaMinutos || 0) * 60 +
        Number(pausaSegundos || 0);
      if (tempoTotal <= 0) {
        alert(
          "O campo 'Tempo de Pausa' é obrigatório quando o fracionamento está ativo! Defina ao menos horas, minutos ou segundos."
        );
        return;
      }

      const totalLeads =
        modoLimite === "geral"
          ? quantidade === "" || quantidade === "0" || quantidade === 0
            ? limites
            : Number(quantidade)
          : (() => {
              let total = 0;
              selectedAtendentes.forEach((id) => {
                const limite = Number(limitesIndividuais[id] || 0);
                const maxDisponivel = Number(atendenteCounts[id] || 0);
                total += limite === 0 ? maxDisponivel : limite;
              });
              return total;
            })();

      if (Number(leadsPorLote) > totalLeads) {
        alert(
          `A quantidade de leads por lote (${leadsPorLote}) não pode ser maior que o total de leads (${totalLeads}).`
        );
        return;
      }
    }

    // Validar que atendentes selecionados são compatíveis com o template
    const compatibleAtendentes = template.atendente_ids || [
      template.atendente_id,
    ];
    const invalidAtendentes = selectedAtendentes.filter(
      (id) => !compatibleAtendentes.includes(id)
    );

    if (invalidAtendentes.length > 0) {
      alert(
        "Alguns atendentes selecionados não têm acesso a este template. Por favor, revise sua seleção."
      );
      return;
    }

    // calcula etapa_final baseado em funil + etapa
    const etapaFinal = getEtapaFinal(funil.value, etapa.value);

    // Monta payload com todos os dados coletados
    const payload = {
      funil: { ...funil }, // { value, name }
      etapa: { ...etapa },
      etapa_final: etapaFinal,
      agendamento: agendamento ? new Date(agendamento).toISOString() : null,
      quantidade:
        modoLimite === "geral"
          ? quantidade === ""
            ? 0
            : Number(quantidade)
          : 0,
      limites,
      modo_limite: modoLimite, // "geral" ou "individual"
      limites_individuais:
        modoLimite === "individual" ? limitesIndividuais : {},
      template: template,
      selectedAtendentes: selectedAtendentes.slice(),
      atendenteCounts: { ...atendenteCounts },
      hasName: Boolean(hasName),
      fracionamento: fracionamentoAtivo
        ? {
            ativo: true,
            leads_por_lote: Number(leadsPorLote),
            pausa_segundos:
              Number(pausaDias || 0) * 86400 +
              Number(pausaHoras || 0) * 3600 +
              Number(pausaMinutos || 0) * 60 +
              Number(pausaSegundos || 0),
            hora_inicio: horaInicio || "",
            hora_fim: horaFim || "",
          }
        : {
            ativo: false,
          },
    };

    try {
      // Envie para sua API (ajuste a URL se necessário)
      const res = await fetch(
        "https://frutosdoacai.up.railway.app/webhook/disparo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("Erro ao criar disparo:", errText);
        alert("Erro ao criar disparo. Veja console para mais detalhes.");
        return;
      }

      // Sucesso — redireciona para lista de disparos
      alert("Disparo criado com sucesso.");
      router.push("/disparos");
    } catch (err) {
      console.error("Erro onSubmit:", err);
      alert("Erro ao criar disparo. Veja console para mais detalhes.");
    }
  };

  // Validação de campos obrigatórios para habilitar botões
  const camposValidos =
    creationMode === "single"
      ? Boolean(
          funil?.value &&
            etapa?.value &&
            template &&
            momento?.value &&
            selectedAtendentes.length > 0 &&
            quantidade !== "" &&
            (quantidade > 0 || (quantidade === 0 && limites > 0))
        )
      : Boolean(
          disparos.length > 0 &&
            disparos.every(
              (d) =>
                d.funil?.value &&
                d.etapa?.value &&
                d.template &&
                d.momento?.value &&
                d.selectedAtendentes?.length > 0 &&
                d.quantidade !== "" &&
                (d.quantidade > 0 || (d.quantidade === 0 && d.limites > 0))
            )
        );

  return (
    <>
      {/* Modal de Preview */}
      {showPreview && creationMode === "multiple" && (
        <DisparosPreview
          disparos={disparos}
          onClose={() => setShowPreview(false)}
          onConfirm={async () => {
            setShowPreview(false);
            await enviarMultiplosDisparos();
          }}
          envioSequencial={envioSequencial}
          delayEnvio={delayEnvio}
          moverParaCima={moverDisparoParaCima}
          moverParaBaixo={moverDisparoParaBaixo}
          atendenteMap={{
            "6130429a380edb00129c7c05": "Kelvin (adm@frutosdoacai.com)",
            "6751df556184e5001acd5873":
              "Lorrayne (atendimento@frutosdoacai.com)",
            "629611ef13b3740019256b6b":
              "Fernanda (comercial-04@frutosdoacai.com)",
            "6296149e46e44c001cb3b2ba":
              "Andreza (comercial-02@frutosdoacai.com)",
            "67472a610c315c001a4e9f2e": "Iara (comercial-09@frutosdoacai.com)",
            "629611e213b3740019256b63":
              "Rayssa (comercial-05@frutosdoacai.com)",
            "61330051bef59f00203e9bbe":
              "Pamella (comercial-01@frutosdoacai.com)",
          }}
        />
      )}

      <main className="min-h-screen items-center content-center bg-slate-100">
        <div className="absolute top-6 left-6 gap-2 w-full flex items-center justify-start">
          <div className="w-12 h-12 rounded-xl bg-fuchsia-700 relative">
            <Image
              className="rounded-xl"
              alt="Logo"
              src="/Logo.png"
              fill
              priority
            />
          </div>

          <Link
            href="/"
            className="w-32 p-1 pl-2 pr-2 rounded-xl bg-fuchsia-900 text-white font-semibold hover:opacity-50 cursor-pointer"
          >
            Criar disparos
          </Link>

          <Link
            href="/disparos"
            className="text-center w-36 p-1 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
          >
            Disparos
          </Link>

          <Link
            href="/conexoes"
            className="text-center w-36 p-1 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
          >
            Conexões
          </Link>

          <Link
            href="/templates"
            className="text-center w-36 p-1 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
          >
            Templates
          </Link>

          <Link
            href="/atendentes"
            className="text-center w-36 p-1 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
          >
            Atendentes
          </Link>

          <a
            target="_blank"
            href="https://app.chakrahq.com/chats"
            className="text-center w-36 p-1 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
          >
            Conversas
          </a>
        </div>

        <button
          onClick={LogOut}
          className="absolute top-6 right-6 w-36 p-1 rounded-xl bg-none border border-red-300 text-red-700 font-medium hover:opacity-50 cursor-pointer"
        >
          Desconectar
        </button>

        {/* Seleção de Modo (Inline) */}
        {showModeSelection && (
          <div className="max-w-4xl mx-auto mb-8 px-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl shadow-2xl p-8 sm:p-12 border border-gray-200">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-fuchsia-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
                  Criar Disparos
                </h2>
                <p className="text-base sm:text-lg text-gray-600">
                  Escolha como deseja criar seus disparos
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Disparo Único */}
                <button
                  onClick={iniciarCriacaoUnica}
                  className="group relative bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                >
                  <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-left mt-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                      Disparo Único
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      Crie um disparo individual com configurações específicas
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Selecionar</span>
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </button>

                {/* Múltiplos Disparos */}
                <button
                  onClick={iniciarCriacaoMultipla}
                  className="group relative bg-white hover:bg-gradient-to-br hover:from-fuchsia-50 hover:to-purple-50 rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-fuchsia-400 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                >
                  <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-fuchsia-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div className="text-left mt-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                      Múltiplos Disparos
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      Crie vários disparos de uma vez e gerencie em lote
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-fuchsia-600 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Selecionar</span>
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gerenciamento de Múltiplos Disparos */}
        {creationMode === "multiple" && (
          <div className="max-w-6xl mx-auto mb-8 mt-24 px-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-fuchsia-600 to-purple-600 p-3 rounded-xl">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z M4 7h16M4 11h16"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Gerenciar Disparos
                    </h2>
                    <p className="text-sm text-gray-500">
                      {disparos.length} disparo{disparos.length > 1 ? "s" : ""}{" "}
                      criado{disparos.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={adicionarNovoDisparo}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Adicionar Disparo
                </button>
              </div>

              {/* Cards dos Disparos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {disparos.map((disparo, index) => (
                  <div
                    key={disparo.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => setActiveDisparoIndex(index)}
                    className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 cursor-move ${
                      draggedIndex === index
                        ? "opacity-50 scale-95"
                        : dragOverIndex === index
                        ? "border-green-500 bg-green-50 scale-105 shadow-2xl ring-4 ring-green-300"
                        : activeDisparoIndex === index
                        ? "border-fuchsia-500 bg-gradient-to-br from-fuchsia-50 to-purple-50 shadow-xl scale-[1.02] ring-4 ring-fuchsia-200"
                        : "border-gray-200 bg-white hover:border-fuchsia-300 hover:shadow-lg hover:scale-[1.01]"
                    }`}
                    title="Arraste para reordenar"
                  >
                    {/* Ícone de Arrastar */}
                    <div className="absolute -right-2 sm:-right-3 bg-gradient-to-br from-gray-400 to-gray-600 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg z-10">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                    </div>
                    {/* Número do Disparo */}
                    <div
                      className={`absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base text-white shadow-lg ${
                        activeDisparoIndex === index
                          ? "bg-gradient-to-br from-fuchsia-600 to-purple-600 animate-pulse"
                          : "bg-gradient-to-br from-gray-500 to-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Badge de Ativo */}
                    {activeDisparoIndex === index && (
                      <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3">
                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></span>
                          <span className="hidden sm:inline">EDITANDO</span>
                          <span className="sm:hidden">✏️</span>
                        </span>
                      </div>
                    )}

                    {/* Conteúdo do Card */}
                    <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          Funil
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-gray-800 truncate mt-1">
                          {disparo.funil?.name || "❌ Não selecionado"}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-[10px] sm:text-xs text-blue-600 font-semibold uppercase tracking-wide flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          Etapa
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-blue-800 truncate mt-1">
                          {disparo.etapa?.name || "❌ Não selecionada"}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2">
                        <p className="text-[10px] sm:text-xs text-purple-600 font-semibold uppercase tracking-wide flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            />
                          </svg>
                          Template
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-purple-800 truncate mt-1">
                          {disparo.template?.name || "❌ Não selecionado"}
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="mt-3 sm:mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicarDisparo(index);
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 text-blue-700 text-[10px] sm:text-xs font-bold py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2 shadow-sm hover:shadow-md"
                        title="Duplicar este disparo"
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="hidden sm:inline">Duplicar</span>
                        <span className="sm:hidden">📋</span>
                      </button>
                      {disparos.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removerDisparo(index);
                          }}
                          className="bg-gradient-to-r from-red-100 to-rose-100 hover:from-red-200 hover:to-rose-200 text-red-700 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
                          title="Remover este disparo"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Opções de Envio Sequencial */}
              {disparos.length > 1 && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        id="envioSequencial"
                        checked={envioSequencial}
                        onChange={(e) => setEnvioSequencial(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-purple-600 shadow-inner group-hover:shadow-md"></div>
                    </label>
                    <div className="flex-1">
                      <label
                        htmlFor="envioSequencial"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <svg
                          className="w-6 h-6 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-lg font-bold text-indigo-900">
                          Enviar Disparos em Sequência
                        </span>
                      </label>
                      <p className="text-sm text-indigo-700 mt-1 ml-8">
                        Ative para enviar os disparos um após o outro com
                        intervalo de tempo entre eles
                      </p>

                      {envioSequencial && (
                        <div className="mt-4 ml-8 bg-white rounded-xl p-6 border border-indigo-200 shadow-sm">
                          <label className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-600 p-1 rounded-md">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </span>
                            Intervalo entre cada disparo
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-indigo-500 uppercase ml-1">
                                Dias
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={delayDias}
                                onChange={(e) =>
                                  setDelayDias(
                                    Math.max(0, Number(e.target.value))
                                  )
                                }
                                className="w-full border-2 border-indigo-100 rounded-xl px-4 py-2 text-indigo-900 font-bold text-center focus:border-indigo-500 focus:outline-none transition-all"
                                placeholder="0"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-indigo-500 uppercase ml-1">
                                Horas
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="23"
                                value={delayHoras}
                                onChange={(e) =>
                                  setDelayHoras(
                                    Math.max(
                                      0,
                                      Math.min(23, Number(e.target.value))
                                    )
                                  )
                                }
                                className="w-full border-2 border-indigo-100 rounded-xl px-4 py-2 text-indigo-900 font-bold text-center focus:border-indigo-500 focus:outline-none transition-all"
                                placeholder="0"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-indigo-500 uppercase ml-1">
                                Minutos
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={delayMinutos}
                                onChange={(e) =>
                                  setDelayMinutos(
                                    Math.max(
                                      0,
                                      Math.min(59, Number(e.target.value))
                                    )
                                  )
                                }
                                className="w-full border-2 border-indigo-100 rounded-xl px-4 py-2 text-indigo-900 font-bold text-center focus:border-indigo-500 focus:outline-none transition-all"
                                placeholder="0"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-indigo-500 uppercase ml-1">
                                Segundos
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={delaySegundos}
                                onChange={(e) =>
                                  setDelaySegundos(
                                    Math.max(
                                      0,
                                      Math.min(59, Number(e.target.value))
                                    )
                                  )
                                }
                                className="w-full border-2 border-indigo-100 rounded-xl px-4 py-2 text-indigo-900 font-bold text-center focus:border-indigo-500 focus:outline-none transition-all"
                                placeholder="5"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Preview */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  disabled={disparos.some(
                    (d) =>
                      !d.funil?.value ||
                      !d.etapa?.value ||
                      !d.template ||
                      !d.momento?.value ||
                      !d.selectedAtendentes ||
                      d.selectedAtendentes.length === 0
                  )}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                    disparos.some(
                      (d) =>
                        !d.funil?.value ||
                        !d.etapa?.value ||
                        !d.template ||
                        !d.momento?.value ||
                        !d.selectedAtendentes ||
                        d.selectedAtendentes.length === 0
                    )
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {disparos.length === 1
                    ? "Pré-visualizar e enviar o disparo"
                    : `Pré-visualizar e enviar os ${disparos.length} disparos`}
                </button>
              </div>
            </div>
          </div>
        )}

        {!showModeSelection && creationMode && (
          <form
            onSubmit={onSubmit}
            className="flex items-start gap-10 justify-center px-4 mb-8 max-w-6xl mx-auto"
          >
            <section className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-2xl space-y-6 max-h-[80vh] overflow-y-auto">
              <h1 className="text-2xl font-semibold text-left text-black">
                {creationMode === "multiple"
                  ? `Editando Disparo #${activeDisparoIndex + 1}`
                  : "Criar disparo"}
              </h1>

              <div className="grid w-full gap-1">
                <label className="block text-lg font-semibold text-gray-600">
                  Selecione o funil de contatos{" "}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  value={funil?.value || ""}
                  onChange={(e) => {
                    if (e.target.value === "6133020c8ad95d0014dc8dcf") {
                      setFunil({
                        name: "Fechamento",
                        value: "6133020c8ad95d0014dc8dcf",
                      });
                    } else if (e.target.value === "673f469047292e0013add37d") {
                      setFunil({
                        name: "Disparador - Tirar Pedido - Base Ativa",
                        value: "673f469047292e0013add37d",
                      });
                    } else if (e.target.value === "673f475152664e001aca526d") {
                      setFunil({
                        name: "Disparador - Busca Ativa",
                        value: "673f475152664e001aca526d",
                      });
                    } else if (e.target.value === "673f5d7ed19d0500276a0f59") {
                      setFunil({
                        name: "Disparador - Campanha 1",
                        value: "673f5d7ed19d0500276a0f59",
                      });
                    } else {
                      setFunil(e.target.value);
                    }

                    setEtapas([]);
                  }}
                  className="w-full p-3 text-base border border-gray-300 rounded-xl text-black bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="">Clique aqui para selecionar</option>
                  <option value="6133020c8ad95d0014dc8dcf">Fechamento</option>
                  <option value="673f469047292e0013add37d">
                    Disparador - Tirar Pedido - Base Ativa
                  </option>
                  <option value="673f475152664e001aca526d">
                    Disparador - Busca Ativa
                  </option>
                  <option value="673f5d7ed19d0500276a0f59">
                    Disparador - Campanha 1
                  </option>
                </select>
              </div>

              {funil?.value &&
                (etapas && etapas?.length !== 0 ? (
                  <div className="grid w-full gap-1">
                    <label className="block font-medium text-gray-500">
                      Selecione a etapa do funil{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <select
                      value={etapa?.value || ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          setEtapa({
                            value: e.target.value,
                            name:
                              etapas.find((i) => i.id === e.target.value)
                                .name || "Não identificado",
                          });
                        } else {
                          setEtapa({
                            value: undefined,
                            name: undefined,
                          });
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-xl text-black bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    >
                      <option value="">Clique aqui para selecionar</option>

                      {etapas.map((etapa) => (
                        <option key={etapa._id} value={etapa._id}>
                          {etapa.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid w-full gap-1">
                    <label className="block font-medium text-gray-500">
                      Selecione a etapa do funil{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <select className="w-full p-2 border border-gray-300 rounded-xl text-black bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
                      <option value="">Carregando...</option>
                    </select>
                  </div>
                ))}

              {funil?.value && etapas.length !== 0 && (
                <div className="grid w-full gap-1">
                  <label className="block font-medium text-gray-500">
                    Momento de envio <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={momento?.value || ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        if (e.target.value === "agendado") {
                          setMomento({
                            value: e.target.value,
                            name: "Agendado",
                          });
                        } else if (e.target.value === "agora") {
                          setMomento({
                            value: e.target.value,
                            name: "Enviar agora",
                          });
                        } else {
                          setMomento({
                            value: e.target.value,
                            name: "Não identificado",
                          });
                        }
                      } else {
                        setMomento({
                          value: undefined,
                          name: undefined,
                        });
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-xl text-black bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  >
                    <option value="">Clique aqui para selecionar</option>
                    {!(creationMode === "multiple" && envioSequencial) && (
                      <option value="agendado">Agendar disparo</option>
                    )}
                    <option value="agora">Enviar agora</option>
                  </select>
                </div>
              )}

              {/* Se momento for agendado, botão para abrir seletor de data/hora */}
              {funil?.value &&
                etapas.length !== 0 &&
                momento?.value === "agendado" &&
                !(creationMode === "multiple" && envioSequencial) && (
                  <div className="grid w-full gap-1">
                    <label className="block font-medium text-gray-500">
                      Data e hora do envio{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDatepicker((s) => !s);
                          // abrir o picker ao mostrar
                          setTimeout(
                            () => dateInputRef.current?.showPicker?.(),
                            50
                          );
                          // foco no input (alguns browsers abrirão o calendário)
                          setTimeout(
                            () => dateInputRef.current?.focus?.(),
                            100
                          );
                        }}
                        className="w-full p-3 text-base bg-fuchsia-100 border border-fuchsia-200 text-black font-medium rounded-xl cursor-pointer hover:opacity-90"
                      >
                        {!agendamento
                          ? "Selecionar data e hora"
                          : `Alterar: ${formatarDataCuiaba(agendamento)}`}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAgendamento(undefined);
                          setShowDatepicker(false);
                        }}
                        className="p-3 text-base rounded-xl bg-red-100 text-red-600"
                      >
                        Limpar
                      </button>
                    </div>

                    {/* input datetime-local — pode ficar visível ou oculto conforme showDatepicker */}
                    <input
                      ref={dateInputRef}
                      type="datetime-local"
                      className={`mt-2 border border-gray-300 w-full p-3 text-base rounded-xl text-black bg-white ${
                        showDatepicker ? "" : "hidden"
                      }`}
                      value={agendamento ?? ""}
                      onChange={(e) => setAgendamento(e.target.value)}
                    />

                    <p className="text-base text-gray-600 font-medium">
                      Selecionado:{" "}
                      {agendamento ? formatarDataCuiaba(agendamento) : "Nenhum"}
                    </p>
                  </div>
                )}

              {/* Aviso quando agendamento está desabilitado por envio sequencial */}
              {momento?.value === "agendado" &&
                creationMode === "multiple" &&
                envioSequencial && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="text-sm text-yellow-800">
                        <strong>Agendamento desabilitado:</strong> Quando o
                        envio sequencial está ativo, apenas o envio instantâneo
                        é permitido.
                      </div>
                    </div>
                  </div>
                )}

              {funil?.value && etapas.length !== 0 && (
                <div className="grid w-full gap-1">
                  <TemplatesPopup
                    templatePopup={templatePopup}
                    setTemplatePopup={setTemplatePopup}
                    templates={templates}
                    nextCursor={nextCursor}
                    loading={loading}
                    loader={loader}
                    setTemplate={setTemplate}
                    atendentes={atendentes}
                  />

                  <label className="block font-medium text-gray-500">
                    Template de envio <span className="text-red-500">*</span>
                  </label>

                  {template && (
                    <button
                      type="button"
                      className="relative w-full p-3 text-base bg-fuchsia-50 mb-2 text-black font-medium rounded-xl"
                    >
                      {template.name}

                      <span
                        onClick={() => setTemplate(undefined)}
                        className="absolute right-3 text-red-500 font-semibold text-xl cursor-pointer"
                      >
                        x
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => setTemplatePopup(true)}
                    type="button"
                    className="w-full p-3 text-base bg-fuchsia-100 border border-fuchsia-200 text-black font-medium rounded-xl cursor-pointer hover:opacity-50"
                  >
                    {!template
                      ? "Selecionar o template de envio"
                      : "Selecionar outro template de envio"}
                  </button>
                </div>
              )}

              {etapa?.name && (
                <div className="grid w-full gap-1">
                  <label className="block font-medium text-gray-500">
                    Filtragem por atendentes{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  {atendentes.map((atendente) => {
                    const isSelected = selectedAtendentes.includes(
                      atendente.id
                    );

                    // Verificar se atendente tem conexão ativa (waba_id)
                    const hasConnection = Boolean(atendente.waba_id);

                    // Verificar se o template está aprovado para o waba_id deste atendente
                    let templateApprovedForAtendente = true;
                    let templateStatusMessage = "";

                    if (template && atendente.waba_id) {
                      // Verificar se o waba_id está na lista de waba_ids do template
                      const wabaIds = template.waba_ids || [template.waba_id];
                      const wabaIndex = wabaIds.indexOf(atendente.waba_id);

                      if (wabaIndex === -1) {
                        // waba_id não encontrado na lista
                        templateApprovedForAtendente = false;
                        templateStatusMessage =
                          "Template não disponível nesta conexão";
                      } else {
                        // Verificar status específico para este waba_id
                        const statuses = template.statuses || [template.status];
                        const statusForWaba = statuses[wabaIndex];

                        if (statusForWaba !== "APPROVED") {
                          templateApprovedForAtendente = false;
                          templateStatusMessage =
                            statusForWaba === "PENDING"
                              ? "Template pendente de aprovação nesta conexão"
                              : statusForWaba === "REJECTED"
                              ? "Template rejeitado nesta conexão"
                              : "Template não aprovado nesta conexão";
                        }
                      }
                    }

                    // Verificar se atendente tem acesso ao template selecionado (ID do atendente)
                    const isCompatible =
                      !template ||
                      (
                        template.atendente_ids || [template.atendente_id]
                      ).includes(atendente.id);

                    // Verificar se atendente tem leads disponíveis
                    const leadsDisponiveis =
                      Number(atendenteCounts[atendente.id]) || 0;
                    const hasLeads = leadsDisponiveis > 0;

                    // Atendente só pode ser selecionado se:
                    // 1. Tiver conexão
                    // 2. For compatível com template (ID)
                    // 3. Template estiver aprovado para seu waba_id
                    // 4. Tiver pelo menos 1 lead disponível
                    const canSelect =
                      hasConnection &&
                      isCompatible &&
                      templateApprovedForAtendente &&
                      hasLeads;

                    return (
                      <label
                        key={atendente.id}
                        className={`flex items-center gap-2 ${
                          canSelect
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-50"
                        }`}
                        title={
                          !hasConnection
                            ? `${atendente.nome} não possui conexão ativa`
                            : !hasLeads
                            ? `${atendente.nome} não possui leads disponíveis nesta etapa`
                            : !templateApprovedForAtendente
                            ? templateStatusMessage
                            : !isCompatible
                            ? `${atendente.nome} não tem acesso ao template selecionado`
                            : `${atendente.nome} - ${atendente.email}`
                        }
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!canSelect}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedAtendentes((prev) =>
                                prev.filter((id) => id !== atendente.id)
                              );
                            } else {
                              setSelectedAtendentes((prev) => [
                                ...prev,
                                atendente.id,
                              ]);
                            }
                          }}
                          className="w-5 h-5"
                        />
                        <span className="text-black font-medium text-base">
                          {atendente.nome} ({atendente.email}
                          {atendente.telefone && ` - ${atendente.telefone}`})
                          {atendenteCounts[atendente.id] !== undefined && (
                            <span className="text-fuchsia-700 text-sm ml-2">
                              - {atendenteCounts[atendente.id]} leads
                            </span>
                          )}
                          {!hasConnection && (
                            <span className="text-red-500 text-xs ml-2 font-semibold">
                              ⚠️ Sem conexão ativa
                            </span>
                          )}
                          {hasConnection && !hasLeads && (
                            <span className="text-red-500 text-xs ml-2 font-semibold">
                              ⚠️ Sem leads disponíveis
                            </span>
                          )}
                          {hasConnection && !templateApprovedForAtendente && (
                            <span className="text-red-500 text-xs ml-2 font-semibold">
                              ⚠️ Template não disponível nesta conexão
                            </span>
                          )}
                          {hasConnection &&
                            templateApprovedForAtendente &&
                            !isCompatible && (
                              <span className="text-red-500 text-xs ml-2">
                                ⚠️ Incompatível com template
                              </span>
                            )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Toggle entre Limite Geral e Limite por Atendente */}
              {funil?.value &&
                etapas.length !== 0 &&
                selectedAtendentes.length > 0 && (
                  <div className="grid w-full gap-3">
                    <label className="block font-medium text-gray-500">
                      Modo de Limite de Envio{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="flex gap-3 items-center bg-slate-50 p-4 rounded-xl border border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setModoLimite("geral");
                          setLimitesIndividuais({});
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
                          modoLimite === "geral"
                            ? "bg-fuchsia-700 text-white shadow-md"
                            : "bg-white text-gray-600 border border-gray-300 hover:border-fuchsia-400"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span className="text-sm">Limite Geral</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoLimite("individual")}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
                          modoLimite === "individual"
                            ? "bg-fuchsia-700 text-white shadow-md"
                            : "bg-white text-gray-600 border border-gray-300 hover:border-fuchsia-400"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span className="text-sm">Limite por Atendente</span>
                        </div>
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 -mt-2">
                      {modoLimite === "geral"
                        ? "Defina um único limite de envio para todos os atendentes selecionados."
                        : "Defina um limite de envio individual para cada atendente selecionado."}
                    </p>
                  </div>
                )}

              {/* Inputs de Limite Individual por Atendente */}
              {funil?.value &&
                etapas.length !== 0 &&
                modoLimite === "individual" &&
                selectedAtendentes.length > 0 && (
                  <div className="grid w-full gap-3">
                    <label className="block font-medium text-gray-500">
                      Limites Individuais{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center gap-2 -mt-2">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        <strong>Dica:</strong> Digite <strong>0</strong> para
                        enviar para <strong>todos</strong> os leads do atendente
                      </span>
                    </p>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-gray-200 max-h-80 overflow-y-auto">
                      {selectedAtendentes.map((atendenteId) => {
                        const atendente = atendentes.find(
                          (a) => a.id === atendenteId
                        );
                        if (!atendente) return null;

                        const maxLeads = atendenteCounts[atendenteId] || 0;
                        const currentLimit =
                          limitesIndividuais[atendenteId] || 0;

                        return (
                          <div
                            key={atendenteId}
                            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">
                                {atendente.nome}
                              </span>
                              <span className="text-xs text-fuchsia-700 font-medium bg-fuchsia-50 px-2 py-1 rounded">
                                {maxLeads} leads disponíveis
                              </span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              max={maxLeads}
                              value={currentLimit}
                              onChange={(e) => {
                                const val = e.target.value;
                                const numVal = Number(val);
                                if (
                                  val === "" ||
                                  (numVal >= 0 && numVal <= maxLeads)
                                ) {
                                  setLimitesIndividuais((prev) => ({
                                    ...prev,
                                    [atendenteId]: val === "" ? 0 : numVal,
                                  }));
                                }
                              }}
                              placeholder="0 = todos os leads"
                              className="w-full border border-gray-300 p-2 rounded-lg text-black text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {currentLimit === 0 || currentLimit === ""
                                ? `✓ Enviar para TODOS os ${maxLeads} leads`
                                : `Enviar para ${currentLimit} de ${maxLeads} leads`}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Total configurado:</span>
                      <span className="font-bold text-fuchsia-700">
                        {(() => {
                          let total = 0;
                          selectedAtendentes.forEach((id) => {
                            const limite = Number(limitesIndividuais[id] || 0);
                            const maxDisponivel = Number(
                              atendenteCounts[id] || 0
                            );
                            // Se limite é 0, conta como todos os leads daquele atendente
                            total += limite === 0 ? maxDisponivel : limite;
                          });
                          return total;
                        })()}{" "}
                        leads
                      </span>
                      <span className="text-gray-400">de</span>
                      <span className="font-semibold text-gray-600">
                        {limites} disponíveis
                      </span>
                    </div>
                  </div>
                )}

              {funil?.value &&
                etapas.length !== 0 &&
                modoLimite === "geral" && (
                  <div className="grid w-full gap-1">
                    <label className="block font-medium text-gray-500">
                      Quantidade de leads{" "}
                      {selectedAtendentes.length > 0 ? (
                        <span className="text-fuchsia-900">
                          (Máximo: {limites})
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          (Selecione atendentes primeiro)
                        </span>
                      )}{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    {selectedAtendentes.length > 0 && limites > 0 ? (
                      <>
                        <input
                          type="number"
                          className="border border-gray-300 w-full p-3 text-base rounded-xl text-black"
                          placeholder="Defina 0 para enviar a todos os selecionados"
                          min="0"
                          max={limites}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val === "" ||
                              (Number(val) >= 0 && Number(val) <= limites)
                            ) {
                              setQuantidade(val);
                            }
                          }}
                          value={quantidade}
                        />
                        <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            <strong>Dica:</strong> Digite <strong>0</strong>{" "}
                            para enviar para <strong>todos</strong> os {limites}{" "}
                            leads disponíveis
                          </span>
                        </p>
                      </>
                    ) : (
                      <input
                        type="number"
                        className="border border-gray-300 w-full p-3 text-base rounded-xl text-black opacity-50"
                        placeholder={
                          selectedAtendentes.length === 0
                            ? "Selecione atendentes primeiro"
                            : "Selecione atendentes com mais de um lead..."
                        }
                        min="0"
                        disabled
                        onChange={() => {}}
                        value={""}
                      />
                    )}
                  </div>
                )}

              {/* Fracionamento de Disparo */}
              {funil?.value &&
                etapas.length !== 0 &&
                selectedAtendentes.length > 0 && (
                  <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-fuchsia-50 to-purple-50 rounded-3xl border-2 border-violet-200 p-4 transition-all duration-300">
                    {/* Decoração de fundo animada */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-fuchsia-200/30 to-purple-300/30 rounded-full blur-3xl -z-0 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-200/30 to-pink-300/30 rounded-full blur-3xl -z-0 animate-pulse delay-1000"></div>

                    <div className="relative z-10 overflow-y-auto">
                      {/* Aviso quando limites < 5 */}
                      {limites < 5 && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 shadow-sm">
                          <svg
                            className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <div>
                            <h4 className="font-bold text-amber-800 text-sm mb-1">
                              Fracionamento Indisponível
                            </h4>
                            <p className="text-sm text-amber-700">
                              O fracionamento requer no mínimo{" "}
                              <span className="font-bold">5 leads</span>.
                              Atualmente você possui apenas{" "}
                              <span className="font-bold">
                                {limites} lead{limites !== 1 ? "s" : ""}
                              </span>{" "}
                              disponível{limites !== 1 ? "is" : ""}.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Cabeçalho com Toggle Premium */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-600 rounded-2xl  opacity-75 animate-pulse"></div>
                            <div className="relative bg-gradient-to-r from-violet-500 to-fuchsia-600 p-3 rounded-2xl ">
                              <svg
                                className="w-7 h-7 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-fuchsia-700 bg-clip-text text-transparent">
                              Fracionamento de envios
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 font-medium">
                              Divida seus envios em lotes com pausas
                              estratégicas
                            </p>
                          </div>
                        </div>

                        {/* Toggle Switch Premium */}
                        <button
                          type="button"
                          disabled={limites < 5}
                          onClick={() => {
                            setFracionamentoAtivo(!fracionamentoAtivo);
                            if (fracionamentoAtivo) {
                              setLeadsPorLote("");
                              setPausaHoras("");
                              setPausaMinutos("");
                              setPausaSegundos("");
                            }
                          }}
                          className={`group relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${
                            limites < 5
                              ? "bg-gray-200 cursor-not-allowed opacity-50"
                              : fracionamentoAtivo
                              ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 focus:ring-fuchsia-300 shadow-lg shadow-fuchsia-500/50"
                              : "bg-gray-300 focus:ring-gray-200 hover:bg-gray-400"
                          }`}
                        >
                          <span
                            className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-all duration-300 cursor-pointer ${
                              fracionamentoAtivo
                                ? "translate-x-11"
                                : "translate-x-1"
                            }`}
                          ></span>
                        </button>
                      </div>

                      {/* Conteúdo do Fracionamento com Animação */}
                      <div
                        className={`transition-all duration-500 ease-in-out ${
                          fracionamentoAtivo
                            ? "max-h-[1000px] opacity-100"
                            : "max-h-0 opacity-0 overflow-hidden"
                        }`}
                      >
                        {fracionamentoAtivo && (
                          <div className="space-y-6 pt-4">
                            {/* Leads por Lote */}
                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-violet-200 shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-2 rounded-lg shadow-md">
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                  </svg>
                                </div>
                                <label className="text-base font-bold text-gray-800">
                                  Leads por Lote
                                  <span className="text-red-500 ml-1">*</span>
                                </label>
                              </div>
                              <input
                                type="number"
                                min="5"
                                max={limites}
                                step="5"
                                value={leadsPorLote}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  // Permite vazio ou valida se é múltiplo de 5
                                  if (val === "") {
                                    setLeadsPorLote(val);
                                  } else {
                                    const numVal = Number(val);
                                    if (
                                      numVal > 0 &&
                                      numVal <= limites &&
                                      numVal % 5 === 0
                                    ) {
                                      setLeadsPorLote(val);
                                    }
                                  }
                                }}
                                onBlur={(e) => {
                                  const val = e.target.value;
                                  if (val !== "") {
                                    const numVal = Number(val);
                                    // Se não for múltiplo de 5, arredonda para o múltiplo mais próximo
                                    if (numVal % 5 !== 0) {
                                      const rounded =
                                        Math.round(numVal / 5) * 5;
                                      const adjusted = Math.max(
                                        5,
                                        Math.min(rounded, limites)
                                      );
                                      setLeadsPorLote(adjusted.toString());
                                    }
                                  }
                                }}
                                placeholder="Ex: 50"
                                className="w-full border-2 border-purple-300 bg-white/50 p-4 rounded-xl text-black font-bold text-xl text-center focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-300 placeholder:text-gray-400"
                              />
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-sm text-gray-600 font-medium">
                                  Quantidade de leads por envio
                                </p>
                                <p className="text-sm text-purple-700 font-bold bg-purple-100 px-3 py-1 rounded-full">
                                  Máx: {limites}
                                </p>
                              </div>
                            </div>

                            {/* Tempo de Pausa */}
                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-fuchsia-200 shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="bg-gradient-to-br from-fuchsia-500 to-pink-600 p-2 rounded-lg shadow-md">
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </div>
                                <label className="text-base font-bold text-gray-800">
                                  Tempo de Pausa entre Lotes
                                  <span className="text-red-500 ml-1">*</span>
                                </label>
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                {/* Horas */}
                                <div className="group">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="23"
                                      value={pausaHoras}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (
                                          val === "" ||
                                          (Number(val) >= 0 &&
                                            Number(val) <= 23)
                                        ) {
                                          setPausaHoras(val);
                                        }
                                      }}
                                      placeholder="0"
                                      className="w-full border-2 border-fuchsia-300 bg-white/50 p-4 rounded-xl text-black font-bold text-2xl text-center focus:outline-none focus:ring-4 focus:ring-fuchsia-300 focus:border-fuchsia-500 transition-all duration-300 placeholder:text-gray-400"
                                    />
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                      0-23
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-center gap-1 mt-2">
                                    <svg
                                      className="w-4 h-4 text-fuchsia-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <p className="text-sm text-gray-700 font-semibold">
                                      Horas
                                    </p>
                                  </div>
                                </div>

                                {/* Minutos */}
                                <div className="group">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="59"
                                      value={pausaMinutos}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (
                                          val === "" ||
                                          (Number(val) >= 0 &&
                                            Number(val) <= 59)
                                        ) {
                                          setPausaMinutos(val);
                                        }
                                      }}
                                      placeholder="0"
                                      className="w-full border-2 border-fuchsia-300 bg-white/50 p-4 rounded-xl text-black font-bold text-2xl text-center focus:outline-none focus:ring-4 focus:ring-fuchsia-300 focus:border-fuchsia-500 transition-all duration-300 placeholder:text-gray-400"
                                    />
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                      0-59
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-center gap-1 mt-2">
                                    <svg
                                      className="w-4 h-4 text-fuchsia-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <p className="text-sm text-gray-700 font-semibold">
                                      Minutos
                                    </p>
                                  </div>
                                </div>

                                {/* Segundos */}
                                <div className="group">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="59"
                                      value={pausaSegundos}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (
                                          val === "" ||
                                          (Number(val) >= 0 &&
                                            Number(val) <= 59)
                                        ) {
                                          setPausaSegundos(val);
                                        }
                                      }}
                                      placeholder="0"
                                      className="w-full border-2 border-fuchsia-300 bg-white/50 p-4 rounded-xl text-black font-bold text-2xl text-center focus:outline-none focus:ring-4 focus:ring-fuchsia-300 focus:border-fuchsia-500 transition-all duration-300 placeholder:text-gray-400"
                                    />
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                      0-59
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-center gap-1 mt-2">
                                    <svg
                                      className="w-4 h-4 text-fuchsia-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <p className="text-sm text-gray-700 font-semibold">
                                      Segundos
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-3">
                                <svg
                                  className="w-5 h-5 text-fuchsia-600 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="font-medium">
                                  Configure o intervalo de tempo que o sistema
                                  aguardará entre cada lote de envios
                                </span>
                              </div>
                            </div>

                            {/* Preview do Fracionamento */}
                            {leadsPorLote &&
                              ((pausaHoras && Number(pausaHoras) > 0) ||
                                (pausaMinutos && Number(pausaMinutos) > 0) ||
                                (pausaSegundos &&
                                  Number(pausaSegundos) > 0)) && (
                                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border-2 border-emerald-300 shadow-lg">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-300/20 rounded-full blur-2xl"></div>
                                  <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-md">
                                        <svg
                                          className="w-6 h-6 text-white"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </div>
                                      <h4 className="text-lg font-bold text-gray-800">
                                        📊 Resumo do Fracionamento
                                      </h4>
                                    </div>

                                    <div className="grid gap-3">
                                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-emerald-200 flex items-center gap-3">
                                        <div className="bg-purple-100 p-2 rounded-lg">
                                          <svg
                                            className="w-5 h-5 text-purple-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                            <path
                                              fillRule="evenodd"
                                              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm text-gray-600 font-medium">
                                            Total de Lotes
                                          </p>
                                          <p className="text-2xl font-bold text-purple-700">
                                            {Math.ceil(
                                              (modoLimite === "geral"
                                                ? quantidade === "" ||
                                                  quantidade === "0" ||
                                                  quantidade === 0
                                                  ? limites
                                                  : Number(quantidade)
                                                : (() => {
                                                    let total = 0;
                                                    selectedAtendentes.forEach(
                                                      (id) => {
                                                        const limite = Number(
                                                          limitesIndividuais[
                                                            id
                                                          ] || 0
                                                        );
                                                        const maxDisponivel =
                                                          Number(
                                                            atendenteCounts[
                                                              id
                                                            ] || 0
                                                          );
                                                        total +=
                                                          limite === 0
                                                            ? maxDisponivel
                                                            : limite;
                                                      }
                                                    );
                                                    return total;
                                                  })()) / Number(leadsPorLote)
                                            )}{" "}
                                            lotes
                                          </p>
                                        </div>
                                      </div>

                                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-emerald-200 flex items-center gap-3">
                                        <div className="bg-fuchsia-100 p-2 rounded-lg">
                                          <svg
                                            className="w-5 h-5 text-fuchsia-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm text-gray-600 font-medium">
                                            Pausa Configurada
                                          </p>
                                          <p className="text-2xl font-bold text-fuchsia-700">
                                            {(() => {
                                              const h = Number(pausaHoras || 0);
                                              const m = Number(
                                                pausaMinutos || 0
                                              );
                                              const s = Number(
                                                pausaSegundos || 0
                                              );
                                              const parts = [];
                                              if (h > 0) parts.push(`${h}h`);
                                              if (m > 0) parts.push(`${m}min`);
                                              if (s > 0) parts.push(`${s}s`);
                                              return parts.join(" ");
                                            })()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                            {/* Aviso de Atenção */}
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3 shadow-md">
                              <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                                <svg
                                  className="w-6 h-6 text-amber-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-amber-900 mb-1">
                                  ⚠️ Importante!
                                </p>
                                <p className="text-sm text-amber-800 font-medium">
                                  O disparo será executado em lotes com pausas
                                  automáticas.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </section>

            <section className="bg-gradient-to-br from-white to-gray-50 p-6 sm:p-10 rounded-2xl shadow-xl w-full max-w-2xl space-y-6 border border-gray-100">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gradient-to-r from-fuchsia-200 to-purple-200">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-fuchsia-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  📊 Resumo do Disparo
                </h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 p-4 rounded-xl border-2 border-fuchsia-200 shadow-sm">
                  <p className="text-xs font-semibold text-fuchsia-600 uppercase tracking-wide flex items-center gap-1 mb-2">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    Funil
                  </p>
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {funil?.name || "—"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200 shadow-sm">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-1 mb-2">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Etapa
                  </p>
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {etapa?.name || "—"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200 shadow-sm">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide flex items-center gap-1 mb-2">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    Template
                  </p>
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {template?.name || "—"}
                  </p>
                </div>
              </div>

              <p className="text-black font-medium">
                Momento de envio:{" "}
                <span className="text-fuchsia-900">{momento?.name}</span>
              </p>
              {momento?.value === "agendado" && (
                <p className="text-black font-medium">
                  Data/Hora do envio:{" "}
                  <span className="text-fuchsia-900">
                    {agendamento
                      ? formatarDataCuiaba(agendamento)
                      : "Não selecionado"}
                  </span>
                </p>
              )}
              <p className="text-black font-medium">
                Template Whatsapp:{" "}
                <span className="text-fuchsia-900">{template?.name || ""}</span>
              </p>
              <p className="text-black font-medium">
                Quantidade de leads:{" "}
                <span className="text-fuchsia-900">
                  {etapa?.name &&
                    selectedAtendentes.length !== 0 &&
                    limites > 0 &&
                    (modoLimite === "geral"
                      ? quantidade === "0" || quantidade === 0
                        ? "Todos"
                        : `${quantidade} de ${limites}`
                      : `Modo individual - ${(() => {
                          let total = 0;
                          selectedAtendentes.forEach((id) => {
                            const limite = Number(limitesIndividuais[id] || 0);
                            const maxDisponivel = Number(
                              atendenteCounts[id] || 0
                            );
                            total += limite === 0 ? maxDisponivel : limite;
                          });
                          return total;
                        })()} de ${limites} leads`)}
                </span>
              </p>

              {fracionamentoAtivo &&
                leadsPorLote &&
                (pausaHoras || pausaMinutos || pausaSegundos) && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-black font-medium text-sm mb-2">
                      📊 Fracionamento:
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700">
                        •{" "}
                        <span className="font-semibold text-purple-700">
                          {leadsPorLote} leads
                        </span>{" "}
                        por lote
                      </p>
                      <p className="text-gray-700">
                        •{" "}
                        <span className="font-semibold text-fuchsia-700">
                          {Number(pausaHoras || 0)}h {Number(pausaMinutos || 0)}
                          min {Number(pausaSegundos || 0)}s
                        </span>{" "}
                        de pausa (
                        {Number(pausaHoras || 0) * 3600 +
                          Number(pausaMinutos || 0) * 60 +
                          Number(pausaSegundos || 0)}{" "}
                        segundos)
                      </p>
                      <p className="text-gray-700">
                        •{" "}
                        <span className="font-semibold text-purple-700">
                          {Math.ceil(
                            (modoLimite === "geral"
                              ? quantidade === "" ||
                                quantidade === "0" ||
                                quantidade === 0
                                ? limites
                                : Number(quantidade)
                              : (() => {
                                  let total = 0;
                                  selectedAtendentes.forEach((id) => {
                                    const limite = Number(
                                      limitesIndividuais[id] || 0
                                    );
                                    const maxDisponivel = Number(
                                      atendenteCounts[id] || 0
                                    );
                                    total +=
                                      limite === 0 ? maxDisponivel : limite;
                                  });
                                  return total;
                                })()) / Number(leadsPorLote)
                          )}{" "}
                          lotes
                        </span>{" "}
                        no total
                      </p>
                    </div>
                  </div>
                )}

              {/* Tempo Estimado de Envio */}
              {limites > 0 && selectedAtendentes.length > 0 && (
                <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-900 mb-1">
                        ⏱️ Tempo Estimado de Envio
                      </p>
                      <p className="text-lg font-semibold text-blue-800">
                        {(() => {
                          const tempoTotalSegundos =
                            quantidade !== 0 ? quantidade * 5 : limites * 5;
                          const horas = Math.floor(tempoTotalSegundos / 3600);
                          const minutos = Math.floor(
                            (tempoTotalSegundos % 3600) / 60
                          );
                          const segundos = tempoTotalSegundos % 60;

                          const partes = [];
                          if (horas > 0) partes.push(`${horas}h`);
                          if (minutos > 0) partes.push(`${minutos}min`);
                          if (segundos > 0 || partes.length === 0)
                            partes.push(`${segundos}s`);

                          return partes.join(" ");
                        })()}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Baseado em 5 segundos por lead
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Envio - Apenas no modo single */}
              {creationMode === "single" && (
                <button
                  type="submit"
                  disabled={!camposValidos}
                  className={`py-3 px-6 text-lg rounded-xl w-full transition font-sans font-semibold ${
                    camposValidos
                      ? "bg-fuchsia-800 text-white hover:opacity-50 cursor-pointer"
                      : "bg-fuchsia-200 text-fuchsia-300 opacity-50 cursor-not-allowed"
                  }`}
                >
                  Enviar disparo
                </button>
              )}
            </section>
          </form>
        )}
      </main>
    </>
  );
}
