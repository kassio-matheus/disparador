"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TemplatesPage() {
  const router = useRouter();

  // Estados do formulário
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("MARKETING");
  const [idioma, setIdioma] = useState("pt_BR");
  const [parametroFormato, setParametroFormato] = useState("NAMED");

  // Header
  const [headerTipo, setHeaderTipo] = useState("NONE");
  const [headerTexto, setHeaderTexto] = useState("");
  const [headerImagemUrl, setHeaderImagemUrl] = useState(""); // Armazena o header_handle do Facebook
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(""); // URL para preview visual

  // Body - variável {{nome}} é opcional para personalização
  const [bodyTexto, setBodyTexto] = useState("");
  const [nomeExemplo, setNomeExemplo] = useState("Sua empresa");

  // Footer
  const [footerTexto, setFooterTexto] = useState("");

  // Buttons
  const [botoes, setBotoes] = useState([]);

  // Conexões e WABA
  const [conexoes, setConexoes] = useState([]);
  const [conexoesSelecionadas, setConexoesSelecionadas] = useState([]);
  const [pluginIdSelecionado, setPluginIdSelecionado] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Templates existentes
  const [templatesExistentes, setTemplatesExistentes] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [buscaTemplate, setBuscaTemplate] = useState("");
  const [templateSelecionado, setTemplateSelecionado] = useState(null);
  const [templateParaExcluir, setTemplateParaExcluir] = useState(null);
  const [templateParaEditar, setTemplateParaEditar] = useState(null);
  const [templateParaDuplicar, setTemplateParaDuplicar] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [duplicando, setDuplicando] = useState(false);
  const [conexoesDuplicacao, setConexoesDuplicacao] = useState([]);

  // Estados do formulário de edição
  const [editCategoria, setEditCategoria] = useState("");
  const [editHeaderTipo, setEditHeaderTipo] = useState("NONE");
  const [editHeaderTexto, setEditHeaderTexto] = useState("");
  const [editHeaderImagemUrl, setEditHeaderImagemUrl] = useState("");
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState("");
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editBodyTexto, setEditBodyTexto] = useState("");
  const [editNomeExemplo, setEditNomeExemplo] = useState("");
  const [editFooterTexto, setEditFooterTexto] = useState("");
  const [editBotoes, setEditBotoes] = useState([]);

  // Ref para scroll automático
  const formRef = useRef(null);

  // Notificações
  const [notificacao, setNotificacao] = useState(null);

  // Tokens do Facebook são por conexão (via backend). Não usar token global.
  const CHAKRA_API_TOKEN =
    "PQchPTcPWID96ZXfbpIg3MtjXilxoSRg4vTVSUx1Fg7iCccJVed5vGLiBkJ7ywC2noS3yHay8ZgYGHYJ0KgIeplsMdDy6Fw0ymCixEe3QuShG27SYYjZi0T8sQC7Fg6E6SB0XfJL4Ar5xRC2YwFgWsHTsDHqoVn5xkd211RUNw0Ob2CUYald5lxDzxiRXsgFEBfKmAkmfbmODIyGe3GBQkLJ7BCkNk8zHOcw4YhwzaAFy1xLODeHJnFa7Ofj5VE";
  const WHATSAPP_API_VERSION = "v24.0";

  async function LogOut() {
    await deleteCookie("auth_token");
    router.push("/login");
  }

  // Carregar conexões
  useEffect(() => {
    async function fetchConexoes() {
      setLoading(true);
      try {
        const res = await fetch(
          "https://frutosdoacai.up.railway.app/webhook/conexoes"
        );
        if (res.ok) {
          const data = await res.json();
          let list = Array.isArray(data) ? data : [];
          const oficiais = list.filter((c) => c.tipo === "Oficial");
          setConexoes(oficiais);
          // Buscar templates após carregar conexões
          if (oficiais.length > 0) {
            buscarTemplatesExistentes(oficiais);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar conexões:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConexoes();
  }, []);

  // Scroll automático quando abrir formulário
  useEffect(() => {
    if (mostrarFormulario && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [mostrarFormulario]);

  // Buscar templates existentes
  async function buscarTemplatesExistentes(conexoesList = conexoes) {
    if (conexoesList.length === 0) return;

    setLoadingTemplates(true);
    try {
      const allTemplates = [];

      for (const conexao of conexoesList) {
        try {
          const res = await fetch(
            `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${conexao.waba_id}/message_templates?limit=100`,
            {
              headers: {
                Authorization: `Bearer ${conexao.token}`,
              },
            }
          );

          if (res.ok) {
            const data = await res.json();
            if (data?.data && Array.isArray(data.data)) {
              const templatesComConexao = data.data.map((tmpl) => ({
                ...tmpl,
                conexao_nome: conexao.nome,
                conexao_telefone: conexao.telefone,
                waba_id: conexao.waba_id,
              }));
              allTemplates.push(...templatesComConexao);
            }
          }
        } catch (err) {
          console.error(`Erro ao buscar templates de ${conexao.nome}:`, err);
        }
      }

      // Agrupar templates por nome
      const templatesMap = new Map();
      allTemplates.forEach((tmpl) => {
        const key = tmpl.name;
        if (templatesMap.has(key)) {
          const existing = templatesMap.get(key);
          existing.conexoes.push({
            nome: tmpl.conexao_nome,
            telefone: tmpl.conexao_telefone,
            waba_id: tmpl.waba_id,
            status: tmpl.status,
          });
        } else {
          templatesMap.set(key, {
            ...tmpl,
            conexoes: [
              {
                nome: tmpl.conexao_nome,
                telefone: tmpl.conexao_telefone,
                waba_id: tmpl.waba_id,
                status: tmpl.status,
              },
            ],
          });
        }
      });

      const templatesAgrupados = Array.from(templatesMap.values());

      // Ordenar: primeiro PENDING, depois APPROVED/outros, alfabético dentro de cada grupo
      templatesAgrupados.sort((a, b) => {
        // Prioridade 1: Status PENDING primeiro
        const aPending = a.status === "PENDING" ? 0 : 1;
        const bPending = b.status === "PENDING" ? 0 : 1;

        if (aPending !== bPending) {
          return aPending - bPending;
        }

        // Prioridade 2: Ordem alfabética por nome
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setTemplatesExistentes(templatesAgrupados);
    } catch (err) {
      console.error("Erro ao buscar templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  }

  // Upload de imagem usando Facebook Resumable Upload API
  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (conexoesSelecionadas.length === 0) {
      setNotificacao({
        tipo: "erro",
        titulo: "Nenhuma conexão selecionada",
        mensagem:
          "Selecione pelo menos uma conexão antes de fazer upload da imagem.",
      });
      e.target.value = "";
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotificacao({
        tipo: "erro",
        titulo: "Arquivo muito grande",
        mensagem:
          "O tamanho máximo permitido é 5MB. Por favor, escolha uma imagem menor.",
      });
      e.target.value = "";
      return;
    }

    // Validar tipo de arquivo
    const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png"];
    if (!tiposPermitidos.includes(file.type)) {
      setNotificacao({
        tipo: "erro",
        titulo: "Tipo de arquivo inválido",
        mensagem: "Apenas arquivos JPG, JPEG e PNG são permitidos.",
      });
      e.target.value = "";
      return;
    }

    setUploadingImage(true);
    try {
      // Enviar arquivo para API route (server-side) para evitar CORS
      const formData = new FormData();
      formData.append("file", file);
      // Incluir token da primeira conexão selecionada para upload
      const tokenUpload = conexoesSelecionadas[0]?.token;
      if (!tokenUpload) {
        setNotificacao({
          tipo: "erro",
          titulo: "Token indisponível",
          mensagem: "Não foi possível obter o token da conexão selecionada.",
        });
        e.target.value = "";
        setUploadingImage(false);
        return;
      }
      formData.append("token", tokenUpload);

      const uploadRes = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha no upload do arquivo");
      }

      const uploadResult = await uploadRes.json();
      const fileHandle = uploadResult.handle; // Handle retornado pela API

      // Armazenar o handle para o template
      setHeaderImagemUrl(fileHandle);

      // Criar URL de preview para exibição visual
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);

      setNotificacao({
        tipo: "sucesso",
        titulo: "Upload concluído",
        mensagem: "Imagem enviada com sucesso e pronta para uso no template!",
      });
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setNotificacao({
        tipo: "erro",
        titulo: "Falha no upload",
        mensagem:
          err.message ||
          "Não foi possível fazer upload da imagem. Tente novamente.",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = ""; // Limpar input para permitir novo upload
    }
  }

  // Adicionar botão
  function adicionarBotao(tipo) {
    if (botoes.length >= 10) {
      setNotificacao({
        tipo: "aviso",
        titulo: "Limite de botões atingido",
        mensagem: "Máximo de 10 botões permitidos!",
      });
      return;
    }

    const novoBotao = {
      tipo,
      texto: "",
      ...(tipo === "PHONE_NUMBER" && { telefone: "" }),
      ...(tipo === "URL" && { url: "", exemplo: "" }),
    };

    setBotoes([...botoes, novoBotao]);
  }

  // Remover botão
  function removerBotao(index) {
    setBotoes(botoes.filter((_, i) => i !== index));
  }

  // Construir payload de criação
  function construirPayload() {
    const components = [];

    // Header
    if (headerTipo === "TEXT" && headerTexto) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: headerTexto,
      });
    } else if (headerTipo === "IMAGE" && headerImagemUrl) {
      components.push({
        type: "HEADER",
        format: "IMAGE",
        example: {
          header_handle: [headerImagemUrl],
        },
      });
    }

    // Body - variável {{nome}} é opcional
    if (bodyTexto) {
      const bodyComponent = {
        type: "BODY",
        text: bodyTexto,
      };

      // Se o texto contém {{nome}}, adicionar exemplo (campo obrigatório quando há variáveis)
      // Como estamos usando NAMED parameters, usamos body_text_named_params
      if (bodyTexto.includes("{{nome}}")) {
        bodyComponent.example = {
          body_text_named_params: [
            {
              param_name: "nome",
              example: nomeExemplo || "Cliente",
            },
          ],
        };
      }

      components.push(bodyComponent);
    }

    // Footer
    if (footerTexto) {
      components.push({
        type: "FOOTER",
        text: footerTexto,
      });
    }

    // Buttons
    if (botoes.length > 0) {
      const buttonsComponent = {
        type: "BUTTONS",
        buttons: botoes.map((b) => {
          const btn = { type: b.tipo, text: b.texto };

          if (b.tipo === "PHONE_NUMBER") btn.phone_number = b.telefone;
          if (b.tipo === "URL") {
            btn.url = b.url;
            if (b.exemplo) btn.example = [b.exemplo];
          }

          return btn;
        }),
      };

      components.push(buttonsComponent);
    }

    return {
      name: nome,
      category: categoria,
      language: idioma,
      parameter_format: parametroFormato,
      components,
    };
  }

  // Enviar template
  async function handleSubmit(e) {
    e.preventDefault();

    if (conexoesSelecionadas.length === 0) {
      setNotificacao({
        tipo: "erro",
        titulo: "Nenhuma conexão selecionada",
        mensagem:
          "Selecione pelo menos uma conexão WhatsApp para criar o template.",
      });
      return;
    }

    if (!nome || !bodyTexto) {
      setNotificacao({
        tipo: "erro",
        titulo: "Campos obrigatórios",
        mensagem:
          "Nome e corpo do template são obrigatórios. Preencha todos os campos necessários.",
      });
      return;
    }

    // Validar se header IMAGE tem imagem
    if (headerTipo === "IMAGE" && !headerImagemUrl) {
      setNotificacao({
        tipo: "erro",
        titulo: "Parâmetro de exemplo não fornecido",
        mensagem:
          "Modelos com o tipo de cabeçalho IMAGE precisam de um exemplo. Faça upload de uma imagem ou altere o tipo de cabeçalho.",
      });
      return;
    }

    // Validar proporção de palavras vs variáveis
    // O WhatsApp exige pelo menos 3-4 palavras fixas para cada variável
    const palavrasTotal = bodyTexto.trim().split(/\s+/).length;
    const numeroVariaveis = (bodyTexto.match(/\{\{nome\}\}/g) || []).length;

    if (numeroVariaveis > 0 && palavrasTotal < numeroVariaveis * 4) {
      setNotificacao({
        tipo: "aviso",
        titulo: "Texto muito curto",
        mensagem: `O corpo da mensagem é muito curto. O WhatsApp exige pelo menos 3-4 palavras fixas para cada variável.\n\nSeu texto: ${palavrasTotal} palavras | Variáveis: ${numeroVariaveis}\nMínimo recomendado: ${
          numeroVariaveis * 4
        } palavras`,
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = construirPayload();
      const resultados = [];
      const erros = [];

      // Criar template em cada conexão selecionada
      for (const conexao of conexoesSelecionadas) {
        try {
          const res = await fetch(
            `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${conexao.waba_id}/message_templates`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${conexao.token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }
          );

          const data = await res.json();

          if (!res.ok) {
            const errorMsg =
              data.error?.error_user_msg ||
              data.error?.message ||
              "Erro desconhecido";
            erros.push(`${conexao.nome}: ${errorMsg}`);
          } else {
            resultados.push(conexao.nome);
          }
        } catch (err) {
          erros.push(`${conexao.nome}: ${err.message}`);
        }
      }

      // Mostrar resultado
      let mensagem = "";
      if (resultados.length > 0) {
        mensagem += `✅ Template criado com sucesso em:\n${resultados.join(
          ", "
        )}\n\n`;
      }
      if (erros.length > 0) {
        mensagem += `❌ Erros:\n${erros.join("\n")}\n`;
      }
      mensagem += "\nTemplates criados estão aguardando aprovação do WhatsApp.";

      setNotificacao({
        tipo:
          resultados.length > 0 && erros.length === 0
            ? "sucesso"
            : erros.length > 0 && resultados.length === 0
            ? "erro"
            : "aviso",
        titulo:
          resultados.length > 0 ? "Template criado" : "Erro ao criar template",
        mensagem: mensagem,
      });

      // Limpar formulário apenas se pelo menos um sucesso
      if (resultados.length > 0) {
        setNome("");
        setBodyTexto("");
        setHeaderTexto("");
        setHeaderImagemUrl("");
        setImagePreviewUrl("");
        setFooterTexto("");
        setBotoes([]);
        setNomeExemplo("João");
        setConexoesSelecionadas([]);

        // Recarregar lista de templates
        setTimeout(() => buscarTemplatesExistentes(), 2000);
      }
    } catch (err) {
      console.error("Erro ao criar template:", err);
      setNotificacao({
        tipo: "erro",
        titulo: "Erro inesperado",
        mensagem:
          err.message || "Não foi possível criar o template. Tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Excluir template
  async function handleExcluirTemplate() {
    if (!templateParaExcluir) return;

    setExcluindo(true);
    try {
      const resultados = [];
      const erros = [];

      // Excluir template de cada conexão (waba_id)
      const conexoesDoTemplate = templateParaExcluir.conexoes || [
        {
          waba_id: templateParaExcluir.waba_id,
          nome: templateParaExcluir.conexao_nome,
        },
      ];

      for (const conexao of conexoesDoTemplate) {
        try {
          const res = await fetch(
            `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${conexao.waba_id}/message_templates?name=${templateParaExcluir.name}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${
                  conexoes.find((c) => c.waba_id === conexao.waba_id)?.token
                }`,
              },
            }
          );

          const data = await res.json();

          if (!res.ok || !data.success) {
            // Verificar se é erro de permissão
            const isPermissionError =
              data.error?.code === 100 ||
              data.error?.message?.includes("permission") ||
              data.error?.message?.includes("Need permission");

            const errorMsg =
              data.error?.error_user_msg ||
              data.error?.message ||
              "Erro desconhecido";

            // Adicionar contexto para erro de permissão
            if (isPermissionError) {
              erros.push(
                `${conexao.nome}: ⚠️ Sem permissão para excluir templates. O token de acesso precisa de permissões de administrador na conta WhatsApp Business.`
              );
            } else {
              erros.push(`${conexao.nome}: ${errorMsg}`);
            }
          } else {
            resultados.push(conexao.nome);
          }
        } catch (err) {
          erros.push(`${conexao.nome}: ${err.message}`);
        }
      }

      // Mostrar resultado
      if (resultados.length > 0) {
        setNotificacao({
          tipo: "sucesso",
          titulo: "Template excluído",
          mensagem: `Template "${
            templateParaExcluir.name
          }" excluído com sucesso de: ${resultados.join(", ")}`,
        });

        // Recarregar lista de templates
        setTimeout(() => buscarTemplatesExistentes(), 1500);
      }

      if (erros.length > 0) {
        // Verificar se há erros de permissão
        const hasPermissionError = erros.some(
          (erro) =>
            erro.includes("Sem permissão") || erro.includes("permission")
        );

        setNotificacao({
          tipo: "erro",
          titulo: hasPermissionError ? "Erro de Permissão" : "Erro ao excluir",
          mensagem: hasPermissionError
            ? `❌ Não foi possível excluir o template:\n\n${erros.join(
                "\n"
              )}\n\n💡 Solução: Acesse o Facebook Business Manager diretamente para excluir templates ou peça ao administrador para atualizar as permissões do token de acesso.`
            : `Erros:\n${erros.join("\n")}`,
        });
      }

      setTemplateParaExcluir(null);
    } catch (err) {
      console.error("Erro ao excluir template:", err);
      setNotificacao({
        tipo: "erro",
        titulo: "Erro inesperado",
        mensagem: err.message || "Não foi possível excluir o template.",
      });
    } finally {
      setExcluindo(false);
    }
  }

  // Editar template
  async function handleEditarTemplate(e) {
    e.preventDefault();
    if (!templateParaEditar) return;

    // Validação
    if (!editBodyTexto) {
      setNotificacao({
        tipo: "erro",
        titulo: "Campo obrigatório",
        mensagem: "O corpo do template é obrigatório.",
      });
      return;
    }

    setEditando(true);
    try {
      // Construir componentes
      const components = [];

      // Header
      if (editHeaderTipo === "TEXT" && editHeaderTexto) {
        components.push({
          type: "HEADER",
          format: "TEXT",
          text: editHeaderTexto,
        });
      } else if (editHeaderTipo === "IMAGE" && editHeaderImagemUrl) {
        components.push({
          type: "HEADER",
          format: "IMAGE",
          example: {
            header_handle: [editHeaderImagemUrl],
          },
        });
      }

      // Body
      const bodyComponent = {
        type: "BODY",
        text: editBodyTexto,
      };

      if (editBodyTexto.includes("{{nome}}")) {
        bodyComponent.example = {
          body_text_named_params: [
            {
              param_name: "nome",
              example: editNomeExemplo || "Cliente",
            },
          ],
        };
      }
      components.push(bodyComponent);

      // Footer
      if (editFooterTexto) {
        components.push({
          type: "FOOTER",
          text: editFooterTexto,
        });
      }

      // Buttons
      if (editBotoes.length > 0) {
        const buttonsComponent = {
          type: "BUTTONS",
          buttons: editBotoes.map((b) => {
            const btn = { type: b.tipo, text: b.texto };
            if (b.tipo === "PHONE_NUMBER") btn.phone_number = b.telefone;
            if (b.tipo === "URL") {
              btn.url = b.url;
              if (b.exemplo) btn.example = [b.exemplo];
            }
            return btn;
          }),
        };
        components.push(buttonsComponent);
      }

      const resultados = [];
      const erros = [];

      // Editar template em cada conexão (usando template_id)
      const conexoesDoTemplate = templateParaEditar.conexoes || [
        {
          waba_id: templateParaEditar.waba_id,
          nome: templateParaEditar.conexao_nome,
        },
      ];

      for (const conexao of conexoesDoTemplate) {
        try {
          const payload = { components };

          // Apenas adicionar categoria se o template não for APPROVED
          if (templateParaEditar.status !== "APPROVED" && editCategoria) {
            payload.category = editCategoria;
          }

          // Buscar o template_id específico desta conexão
          const templateIdRes = await fetch(
            `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${conexao.waba_id}/message_templates?name=${templateParaEditar.name}`,
            {
              headers: {
                Authorization: `Bearer ${
                  conexoes.find((c) => c.waba_id === conexao.waba_id)?.token
                }`,
              },
            }
          );

          const templateIdData = await templateIdRes.json();
          const templateId = templateIdData?.data?.[0]?.id;

          if (!templateId) {
            erros.push(
              `${conexao.nome}: Template não encontrado nesta conexão`
            );
            continue;
          }

          const res = await fetch(
            `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${templateId}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${
                  conexoes.find((c) => c.waba_id === conexao.waba_id)?.token
                }`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }
          );

          const data = await res.json();

          if (!res.ok || !data.success) {
            const errorMsg =
              data.error?.error_user_msg ||
              data.error?.message ||
              "Erro desconhecido";
            erros.push(`${conexao.nome}: ${errorMsg}`);
          } else {
            resultados.push(conexao.nome);
          }
        } catch (err) {
          erros.push(`${conexao.nome}: ${err.message}`);
        }
      }

      // Mostrar resultado
      if (resultados.length > 0) {
        setNotificacao({
          tipo: "sucesso",
          titulo: "Template editado",
          mensagem: `Template "${
            templateParaEditar.name
          }" editado com sucesso em: ${resultados.join(", ")}`,
        });

        // Recarregar lista de templates
        setTimeout(() => buscarTemplatesExistentes(), 1500);
      }

      if (erros.length > 0) {
        setNotificacao({
          tipo: "erro",
          titulo: "Erro ao editar",
          mensagem: `Erros:\n${erros.join("\n")}`,
        });
      }

      setTemplateParaEditar(null);
    } catch (err) {
      console.error("Erro ao editar template:", err);
      setNotificacao({
        tipo: "erro",
        titulo: "Erro inesperado",
        mensagem: err.message || "Não foi possível editar o template.",
      });
    } finally {
      setEditando(false);
    }
  }

  // Inicializar campos de edição quando abrir modal
  function inicializarEdicao(template) {
    setTemplateParaEditar(template);
    setEditCategoria(template.category || "MARKETING");

    // Processar componentes existentes
    const headerComp = template.components?.find((c) => c.type === "HEADER");
    const bodyComp = template.components?.find((c) => c.type === "BODY");
    const footerComp = template.components?.find((c) => c.type === "FOOTER");
    const buttonsComp = template.components?.find((c) => c.type === "BUTTONS");

    // Header
    if (headerComp) {
      if (headerComp.format === "TEXT") {
        setEditHeaderTipo("TEXT");
        setEditHeaderTexto(headerComp.text || "");
        setEditHeaderImagemUrl("");
        setEditImagePreviewUrl("");
      } else if (headerComp.format === "IMAGE") {
        setEditHeaderTipo("IMAGE");
        setEditHeaderTexto("");
        // Extrair o handle da imagem existente, se disponível
        const existingHandle = headerComp.example?.header_handle?.[0] || "";
        setEditHeaderImagemUrl(existingHandle);
        // Se o handle é uma URL válida (CDN do WhatsApp), usar como preview
        if (existingHandle && existingHandle.startsWith("http")) {
          setEditImagePreviewUrl(existingHandle);
        } else {
          setEditImagePreviewUrl("");
        }
      }
    } else {
      setEditHeaderTipo("NONE");
      setEditHeaderTexto("");
      setEditHeaderImagemUrl("");
      setEditImagePreviewUrl("");
    }

    // Body
    setEditBodyTexto(bodyComp?.text || "");
    const exemplo =
      bodyComp?.example?.body_text_named_params?.[0]?.example || "Cliente";
    setEditNomeExemplo(exemplo);

    // Footer
    setEditFooterTexto(footerComp?.text || "");

    // Buttons
    if (buttonsComp?.buttons) {
      const botoesFormatados = buttonsComp.buttons.map((btn) => ({
        tipo: btn.type,
        texto: btn.text || "",
        telefone: btn.phone_number || "",
        url: btn.url || "",
        exemplo: btn.example?.[0] || "",
      }));
      setEditBotoes(botoesFormatados);
    } else {
      setEditBotoes([]);
    }
  }

  // Upload de imagem para edição
  async function handleEditImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditUploadingImage(true);
    try {
      // Preview visual
      const previewUrl = URL.createObjectURL(file);
      setEditImagePreviewUrl(previewUrl);

      // Upload para Facebook
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro no upload da imagem");
      }

      const data = await response.json();

      if (data.handle) {
        setEditHeaderImagemUrl(data.handle);
        setNotificacao({
          tipo: "sucesso",
          titulo: "Upload concluído",
          mensagem: "Imagem enviada com sucesso!",
        });
      } else {
        throw new Error("Handle não retornado");
      }
    } catch (err) {
      console.error("Erro no upload:", err);
      setNotificacao({
        tipo: "erro",
        titulo: "Erro no upload",
        mensagem: err.message || "Não foi possível fazer upload da imagem.",
      });
      setEditImagePreviewUrl("");
      setEditHeaderImagemUrl("");
    } finally {
      setEditUploadingImage(false);
    }
  }

  // Adicionar botão na edição
  function adicionarBotaoEdicao(tipo) {
    if (editBotoes.length >= 10) return;
    setEditBotoes([
      ...editBotoes,
      { tipo, texto: "", telefone: "", url: "", exemplo: "" },
    ]);
  }

  // Remover botão na edição
  function removerBotaoEdicao(index) {
    setEditBotoes(editBotoes.filter((_, i) => i !== index));
  }

  // Duplicar template
  async function handleDuplicarTemplate() {
    if (!templateParaDuplicar || conexoesDuplicacao.length === 0) return;

    setDuplicando(true);
    try {
      // Extrair componentes do template original
      const components = [];

      if (
        templateParaDuplicar.components &&
        Array.isArray(templateParaDuplicar.components)
      ) {
        templateParaDuplicar.components.forEach((comp) => {
          if (comp.type === "HEADER") {
            if (comp.format === "TEXT") {
              components.push({
                type: "HEADER",
                format: "TEXT",
                text: comp.text,
              });
            } else if (comp.format === "IMAGE" && comp.example?.header_handle) {
              components.push({
                type: "HEADER",
                format: "IMAGE",
                example: {
                  header_handle: comp.example.header_handle,
                },
              });
            }
          } else if (comp.type === "BODY") {
            const bodyComp = {
              type: "BODY",
              text: comp.text,
            };
            if (comp.example?.body_text_named_params) {
              bodyComp.example = {
                body_text_named_params: comp.example.body_text_named_params,
              };
            }
            components.push(bodyComp);
          } else if (comp.type === "FOOTER") {
            components.push({
              type: "FOOTER",
              text: comp.text,
            });
          } else if (comp.type === "BUTTONS") {
            components.push({
              type: "BUTTONS",
              buttons: comp.buttons.map((btn) => {
                const newBtn = { type: btn.type, text: btn.text };
                if (btn.phone_number) newBtn.phone_number = btn.phone_number;
                if (btn.url) {
                  newBtn.url = btn.url;
                  if (btn.example) newBtn.example = btn.example;
                }
                return newBtn;
              }),
            });
          }
        });
      }

      const payload = {
        name: templateParaDuplicar.name,
        category: templateParaDuplicar.category || "MARKETING",
        language: templateParaDuplicar.language || "pt_BR",
        components,
      };

      const resultados = [];
      const erros = [];

      // Criar template em cada conexão selecionada
      for (const conexao of conexoesDuplicacao) {
        try {
          const res = await fetch(
            `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${conexao.waba_id}/message_templates`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${
                  conexoes.find((c) => c.waba_id === conexao.waba_id)?.token
                }`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }
          );

          const data = await res.json();

          if (res.ok && data.id) {
            resultados.push(conexao.nome);
          } else {
            const errorMsg =
              data.error?.error_user_msg ||
              data.error?.message ||
              "Erro desconhecido";
            erros.push(`${conexao.nome}: ${errorMsg}`);
          }
        } catch (err) {
          erros.push(`${conexao.nome}: ${err.message}`);
        }
      }

      // Mostrar resultado
      let mensagem = "";
      if (resultados.length > 0) {
        mensagem = `✅ Template duplicado com sucesso em: ${resultados.join(
          ", "
        )}\n\n`;
      }
      if (erros.length > 0) {
        mensagem += `❌ Erros:\n${erros.join("\n")}`;
      }

      setNotificacao({
        tipo:
          resultados.length > 0 && erros.length === 0
            ? "sucesso"
            : erros.length > 0 && resultados.length === 0
            ? "erro"
            : "aviso",
        titulo:
          resultados.length > 0
            ? "Template duplicado"
            : "Erro ao duplicar template",
        mensagem,
      });

      // Fechar modal e recarregar templates se houve sucesso
      if (resultados.length > 0) {
        setTemplateParaDuplicar(null);
        setConexoesDuplicacao([]);
        setTimeout(() => buscarTemplatesExistentes(), 2000);
      }
    } catch (err) {
      console.error("Erro ao duplicar template:", err);
      setNotificacao({
        tipo: "erro",
        titulo: "Erro inesperado",
        mensagem:
          err.message ||
          "Não foi possível duplicar o template. Tente novamente.",
      });
    } finally {
      setDuplicando(false);
    }
  }

  return (
    <main className="min-h-screen items-center content-start bg-slate-100 p-6">
      {/* Notificação Toast */}
      {notificacao && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
          <div
            className={`max-w-md rounded-xl shadow-2xl p-4 border-l-4 ${
              notificacao.tipo === "sucesso"
                ? "bg-green-50 border-green-500"
                : notificacao.tipo === "erro"
                ? "bg-red-50 border-red-500"
                : "bg-yellow-50 border-yellow-500"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {notificacao.tipo === "sucesso" && (
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {notificacao.tipo === "erro" && (
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {notificacao.tipo === "aviso" && (
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-1 ${
                    notificacao.tipo === "sucesso"
                      ? "text-green-900"
                      : notificacao.tipo === "erro"
                      ? "text-red-900"
                      : "text-yellow-900"
                  }`}
                >
                  {notificacao.titulo}
                </h3>
                <p
                  className={`text-sm whitespace-pre-line ${
                    notificacao.tipo === "sucesso"
                      ? "text-green-700"
                      : notificacao.tipo === "erro"
                      ? "text-red-700"
                      : "text-yellow-700"
                  }`}
                >
                  {notificacao.mensagem}
                </p>
              </div>
              <button
                onClick={() => setNotificacao(null)}
                className={`flex-shrink-0 rounded-lg p-1 hover:bg-black/5 transition ${
                  notificacao.tipo === "sucesso"
                    ? "text-green-600"
                    : notificacao.tipo === "erro"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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
          className="w-32 p-1 pl-2 pr-2 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
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
          className="text-center w-36 p-1 rounded-xl bg-fuchsia-900 text-white font-semibold hover:opacity-50 cursor-pointer"
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

      <section className="max-w-7xl mx-auto mt-28">
        {/* Lista de Templates Existentes */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Templates</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="px-5 py-2.5 bg-fuchsia-700 text-white font-semibold rounded-xl hover:bg-fuchsia-800 transition flex items-center gap-2"
              >
                {mostrarFormulario ? (
                  <>
                    <span>✕</span>
                    <span>Fechar Formulário</span>
                  </>
                ) : (
                  <>
                    <span>+</span>
                    <span>Criar Novo Template</span>
                  </>
                )}
              </button>
              <button
                onClick={() => buscarTemplatesExistentes()}
                disabled={loadingTemplates}
                className="px-4 py-2 bg-fuchsia-100 border border-fuchsia-200 text-black font-medium rounded-xl hover:opacity-80 disabled:opacity-50"
              >
                {loadingTemplates ? "Carregando..." : "🔄 Atualizar"}
              </button>
              <a
                href="https://business.facebook.com/latest/whatsapp_manager/message_templates"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                title="Abrir gerenciador de templates da Meta"
              >
                🔗 Meta
              </a>
            </div>
          </div>

          <input
            type="text"
            value={buscaTemplate}
            onChange={(e) => setBuscaTemplate(e.target.value)}
            placeholder="Buscar templates por nome, categoria ou conexão..."
            className="w-full p-3 mb-4 border border-gray-300 rounded-xl text-black"
          />

          {loadingTemplates ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-700"></div>
              <p className="mt-4 text-gray-600">Carregando templates...</p>
            </div>
          ) : templatesExistentes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Nenhum template encontrado</p>
              <p className="text-sm mt-2">Crie seu primeiro template abaixo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {templatesExistentes
                .filter((tmpl) => {
                  if (!buscaTemplate) return true;
                  const searchLower = buscaTemplate.toLowerCase();
                  return (
                    tmpl.name?.toLowerCase().includes(searchLower) ||
                    tmpl.category?.toLowerCase().includes(searchLower) ||
                    tmpl.conexao_nome?.toLowerCase().includes(searchLower) ||
                    tmpl.status?.toLowerCase().includes(searchLower)
                  );
                })
                .map((tmpl) => (
                  <div
                    key={`${tmpl.id}-${tmpl.waba_id}`}
                    className="p-4 border border-gray-200 rounded-xl hover:border-fuchsia-500 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3
                        onClick={() => setTemplateSelecionado(tmpl)}
                        className="font-semibold text-black text-lg cursor-pointer hover:text-fuchsia-600"
                      >
                        {tmpl.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* Se há múltiplas conexões, mostrar resumo de status */}
                        {tmpl.conexoes && tmpl.conexoes.length > 1 ? (
                          <div className="flex flex-col items-end gap-1.5 min-w-max">
                            <div className="flex gap-1 text-xs font-medium">
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                {
                                  tmpl.conexoes.filter(
                                    (c) => c.status === "APPROVED"
                                  ).length
                                }{" "}
                                ✓
                              </span>
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                {
                                  tmpl.conexoes.filter(
                                    (c) => c.status === "PENDING"
                                  ).length
                                }{" "}
                                ⏳
                              </span>
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                {
                                  tmpl.conexoes.filter(
                                    (c) => c.status === "REJECTED"
                                  ).length
                                }{" "}
                                ✗
                              </span>
                            </div>
                            {tmpl.conexoes.every(
                              (c) => c.status === "APPROVED"
                            ) ? (
                              <span className="px-2 py-1 text-xs rounded-lg bg-green-100 text-green-800 font-semibold whitespace-nowrap">
                                ✓ Todas Aprovadas
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-800 font-semibold whitespace-nowrap">
                                ⚠ Uso Bloqueado
                              </span>
                            )}
                          </div>
                        ) : (
                          <span
                            className={`px-2 py-1 text-xs rounded-lg ${
                              tmpl.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : tmpl.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : tmpl.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {tmpl.status === "APPROVED"
                              ? "Aprovado"
                              : tmpl.status === "PENDING"
                              ? "Pendente"
                              : tmpl.status === "REJECTED"
                              ? "Rejeitado"
                              : tmpl.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Categoria:</span>{" "}
                      {tmpl.category || "—"}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Idioma:</span>{" "}
                      {tmpl.language || "—"}
                    </p>

                    {/* Botões de ação */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplateParaDuplicar(tmpl);
                        }}
                        className="flex-1 px-3 py-1.5 bg-fuchsia-100 text-fuchsia-700 rounded-lg text-xs font-medium hover:bg-fuchsia-200 transition"
                        title="Duplicar template em outras conexões"
                      >
                        📋 Duplicar
                      </button>
                      {/* Botões de Editar e Excluir ocultos */}
                    </div>
                    {/* Múltiplas conexões com status individual */}
                    <div className="mt-3 space-y-2">
                      {tmpl.conexoes && tmpl.conexoes.length > 1 ? (
                        <>
                          <p className="text-xs font-semibold text-gray-700">
                            Status por Número:
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {tmpl.conexoes.map((conn, i) => (
                              <div
                                key={i}
                                className={`px-3 py-2 rounded-lg border-l-4 flex items-center justify-between ${
                                  conn.status === "APPROVED"
                                    ? "bg-green-50 border-green-500"
                                    : conn.status === "PENDING"
                                    ? "bg-yellow-50 border-yellow-500"
                                    : conn.status === "REJECTED"
                                    ? "bg-red-50 border-red-500"
                                    : "bg-gray-50 border-gray-500"
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div
                                    className={`text-xs font-semibold truncate ${
                                      conn.status === "APPROVED"
                                        ? "text-green-800"
                                        : conn.status === "PENDING"
                                        ? "text-yellow-800"
                                        : conn.status === "REJECTED"
                                        ? "text-red-800"
                                        : "text-gray-800"
                                    }`}
                                  >
                                    {conn.nome}
                                  </div>
                                  <div
                                    className={`text-xs opacity-70 ${
                                      conn.status === "APPROVED"
                                        ? "text-green-700"
                                        : conn.status === "PENDING"
                                        ? "text-yellow-700"
                                        : conn.status === "REJECTED"
                                        ? "text-red-700"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {conn.telefone}
                                  </div>
                                </div>
                                <div
                                  className={`text-xs font-bold whitespace-nowrap ml-2 ${
                                    conn.status === "APPROVED"
                                      ? "text-green-700"
                                      : conn.status === "PENDING"
                                      ? "text-yellow-700"
                                      : conn.status === "REJECTED"
                                      ? "text-red-700"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {conn.status === "APPROVED"
                                    ? "✓ Aprovado"
                                    : conn.status === "PENDING"
                                    ? "⏳ Pendente"
                                    : conn.status === "REJECTED"
                                    ? "✗ Rejeitado"
                                    : conn.status}
                                </div>
                              </div>
                            ))}
                          </div>
                          {!tmpl.conexoes.every(
                            (c) => c.status === "APPROVED"
                          ) && (
                            <div className="p-2.5 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                              <p className="text-xs text-red-800 leading-relaxed">
                                <span className="font-bold">⚠️ Atenção:</span>{" "}
                                Este template não pode ser usado em disparos
                                pois nem todas as conexões estão aprovadas.
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-fuchsia-600">
                          📱 {tmpl.conexao_nome} ({tmpl.conexao_telefone})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {mostrarFormulario && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Coluna esquerda - Formulário */}
            <div className="space-y-6">
              {/* Configurações básicas */}
              <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
                <h2 className="text-xl font-semibold text-black">
                  Configurações Básicas
                </h2>

                <div>
                  <label className="block font-medium text-gray-600 mb-2">
                    Conexões WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Selecione uma ou mais conexões para criar o mesmo template
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
                    {conexoes.length === 0 ? (
                      <p className="text-gray-400 text-sm">
                        Nenhuma conexão disponível
                      </p>
                    ) : (
                      conexoes.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={conexoesSelecionadas.some(
                              (conn) => conn.id === c.id
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConexoesSelecionadas([
                                  ...conexoesSelecionadas,
                                  c,
                                ]);
                              } else {
                                setConexoesSelecionadas(
                                  conexoesSelecionadas.filter(
                                    (conn) => conn.id !== c.id
                                  )
                                );
                              }
                            }}
                            className="w-4 h-4 text-fuchsia-600 rounded"
                          />
                          <span className="text-black flex-1">
                            {c.nome} - {c.telefone}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {conexoesSelecionadas.length > 0 && (
                    <p className="text-xs text-fuchsia-600 mt-2">
                      {conexoesSelecionadas.length} conexão(es) selecionada(s)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-gray-600 mb-2">
                    Nome do Template <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) =>
                      setNome(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                      )
                    }
                    className="w-full p-3 border border-gray-300 rounded-xl text-black"
                    placeholder="exemplo_template_vendas"
                    maxLength={512}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Apenas letras minúsculas, números e underscores
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-600 mb-2">
                      Categoria <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl text-black"
                    >
                      <option value="MARKETING">Marketing</option>
                      <option value="UTILITY">Utilidade</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-600 mb-2">
                      Idioma <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={idioma}
                      onChange={(e) => setIdioma(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl text-black"
                    >
                      <option value="pt_BR">Português (BR)</option>
                      <option value="en_US">English (US)</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
                <h2 className="text-xl font-semibold text-black">
                  Cabeçalho (Opcional)
                </h2>

                <div>
                  <label className="block font-medium text-gray-600 mb-2">
                    Tipo de Cabeçalho
                  </label>
                  <select
                    value={headerTipo}
                    onChange={(e) => {
                      setHeaderTipo(e.target.value);
                      setHeaderTexto("");
                      setHeaderImagemUrl("");
                    }}
                    className="w-full p-3 border border-gray-300 rounded-xl text-black"
                  >
                    <option value="NONE">Sem cabeçalho</option>
                    <option value="TEXT">Texto</option>
                    <option value="IMAGE">Imagem</option>
                  </select>
                </div>

                {headerTipo === "TEXT" && (
                  <div>
                    <label className="block font-medium text-gray-600 mb-2">
                      Texto do Cabeçalho
                    </label>
                    <input
                      type="text"
                      value={headerTexto}
                      onChange={(e) => setHeaderTexto(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl text-black"
                      placeholder="Nossa promoção começou!"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo 60 caracteres.
                    </p>
                  </div>
                )}

                {headerTipo === "IMAGE" && (
                  <div>
                    <label className="block font-medium text-gray-600 mb-2">
                      Upload de Imagem
                    </label>

                    {!headerImagemUrl ? (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={
                            uploadingImage || conexoesSelecionadas.length === 0
                          }
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition ${
                            uploadingImage || conexoesSelecionadas.length === 0
                              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                              : "border-fuchsia-300 bg-fuchsia-50 hover:bg-fuchsia-100 hover:border-fuchsia-400"
                          }`}
                        >
                          {uploadingImage ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mb-3"></div>
                              <p className="text-sm text-fuchsia-600 font-medium">
                                Enviando imagem...
                              </p>
                            </div>
                          ) : (
                            <>
                              <svg
                                className="w-12 h-12 mb-3 text-fuchsia-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                              <p className="mb-2 text-sm text-gray-700">
                                <span className="font-semibold">
                                  Clique para fazer upload
                                </span>{" "}
                                ou arraste
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG ou JPEG (máx. 5MB)
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreviewUrl}
                          alt="Preview"
                          className="w-full h-auto rounded-xl border-2 border-fuchsia-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setHeaderImagemUrl("");
                            setImagePreviewUrl("");
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition shadow-lg"
                          title="Remover imagem"
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
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}

                    {conexoesSelecionadas.length === 0 && (
                      <p className="text-xs text-red-500 mt-2">
                        ⚠️ Selecione uma conexão antes de fazer upload
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
                <h2 className="text-xl font-semibold text-black">
                  Corpo da Mensagem <span className="text-red-500">*</span>
                </h2>

                <div>
                  <label className="block font-medium text-gray-600 mb-2">
                    Texto do Corpo
                  </label>
                  <textarea
                    value={bodyTexto}
                    onChange={(e) => setBodyTexto(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl text-black min-h-32"
                    placeholder="Olá {{nome}}! Seja bem-vindo ao nosso sistema."
                    maxLength={1024}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 1024 caracteres. Use {"{{"}nome{"}}"} para
                    personalizar com o nome do cliente (opcional).
                  </p>
                </div>

                {bodyTexto.includes("{{nome}}") && (
                  <div>
                    <label className="block font-medium text-gray-600 mb-2">
                      Exemplo de Nome (para prévia)
                    </label>
                    <input
                      type="text"
                      value={nomeExemplo}
                      onChange={(e) => setNomeExemplo(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl text-black"
                      placeholder="João"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Este é apenas um exemplo para visualização. Ao enviar,
                      você fornece o nome real.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
                <h2 className="text-xl font-semibold text-black">
                  Rodapé (Opcional)
                </h2>

                <div>
                  <label className="block font-medium text-gray-600 mb-2">
                    Texto do Rodapé
                  </label>
                  <input
                    type="text"
                    value={footerTexto}
                    onChange={(e) => setFooterTexto(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl text-black"
                    placeholder="Use os botões abaixo para gerenciar suas preferências"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 60 caracteres
                  </p>
                </div>
              </div>

              {/* Botões */}
              <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-black">
                    Botões (Opcional)
                  </h2>
                  <span className="text-sm text-gray-500">
                    {botoes.length}/10
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => adicionarBotao("QUICK_REPLY")}
                    className="px-3 py-2 bg-blue-100 border border-blue-200 text-blue-800 text-sm rounded-lg hover:opacity-80"
                    disabled={botoes.length >= 10}
                  >
                    + Resposta Rápida
                  </button>
                  <button
                    type="button"
                    onClick={() => adicionarBotao("PHONE_NUMBER")}
                    className="px-3 py-2 bg-green-100 border border-green-200 text-green-800 text-sm rounded-lg hover:opacity-80"
                    disabled={botoes.length >= 10}
                  >
                    + Telefone
                  </button>
                  <button
                    type="button"
                    onClick={() => adicionarBotao("URL")}
                    className="px-3 py-2 bg-purple-100 border border-purple-200 text-purple-800 text-sm rounded-lg hover:opacity-80"
                    disabled={botoes.length >= 10}
                  >
                    + URL
                  </button>
                </div>

                <div className="space-y-3">
                  {botoes.map((botao, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          {botao.tipo === "QUICK_REPLY" && "Resposta Rápida"}
                          {botao.tipo === "PHONE_NUMBER" && "Botão de Telefone"}
                          {botao.tipo === "URL" && "Botão de URL"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerBotao(idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>

                      <input
                        type="text"
                        value={botao.texto}
                        onChange={(e) => {
                          const novos = [...botoes];
                          novos[idx].texto = e.target.value;
                          setBotoes(novos);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg text-black"
                        placeholder="Texto do botão"
                        maxLength={25}
                      />

                      {botao.tipo === "PHONE_NUMBER" && (
                        <input
                          type="tel"
                          value={botao.telefone}
                          onChange={(e) => {
                            const novos = [...botoes];
                            novos[idx].telefone = e.target.value;
                            setBotoes(novos);
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg text-black"
                          placeholder="+5565981442006"
                          maxLength={20}
                        />
                      )}

                      {botao.tipo === "URL" && (
                        <>
                          <input
                            type="url"
                            value={botao.url}
                            onChange={(e) => {
                              const novos = [...botoes];
                              novos[idx].url = e.target.value;
                              setBotoes(novos);
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg text-black"
                            placeholder="https://seusite.com"
                            maxLength={2000}
                          />
                          {botao.url && botao.url.includes("{{") && (
                            <input
                              type="text"
                              value={botao.exemplo || ""}
                              onChange={(e) => {
                                const novos = [...botoes];
                                novos[idx].exemplo = e.target.value;
                                setBotoes(novos);
                              }}
                              className="w-full p-2 border border-gray-300 rounded-lg text-black"
                              placeholder="Exemplo de valor para variável na URL"
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna direita - Preview e ações */}
            <div className="sticky top-6 space-y-6">
              {/* Preview estilo WhatsApp */}
              {showPreview && (
                <div>
                  <div className="bg-white p-6 rounded-2xl shadow-md">
                    <h2 className="text-xl font-semibold text-black mb-4">
                      Preview do Template
                    </h2>

                    {/* Celular mockup */}
                    <div className="mx-auto" style={{ width: "320px" }}>
                      {/* Moldura do celular */}
                      <div className="bg-black rounded-[3rem] p-3 shadow-2xl">
                        {/* Notch */}
                        <div
                          className="bg-black h-6 rounded-b-3xl mx-auto"
                          style={{ width: "40%" }}
                        ></div>

                        {/* Tela */}
                        <div
                          className="bg-gray-100 rounded-[2.5rem] overflow-hidden"
                          style={{ height: "580px" }}
                        >
                          {/* Header do WhatsApp */}
                          <div className="bg-[#008069] px-4 py-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                              {nomeExemplo?.charAt(0) || "C"}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm">
                                {nomeExemplo || "Cliente"}
                              </p>
                              <p className="text-gray-200 text-xs">online</p>
                            </div>
                            <div className="flex gap-4">
                              <div className="w-6 h-6 rounded-full bg-white/20"></div>
                              <div className="w-6 h-6 rounded-full bg-white/20"></div>
                            </div>
                          </div>

                          {/* Área de mensagens */}
                          <div
                            className="p-3 h-[490px] overflow-y-auto"
                            style={{
                              backgroundImage:
                                "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwTDQwIDQwTTQwIDBMMCA0MCIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')",
                              backgroundColor: "#efeae2",
                            }}
                          >
                            <div className="flex justify-start mb-3">
                              <div className="bg-white rounded-lg rounded-tl-none shadow-sm max-w-[85%]">
                                {/* Header Preview */}
                                {headerTipo === "TEXT" && headerTexto && (
                                  <div className="px-3 pt-2 pb-1">
                                    <p className="font-bold text-sm text-gray-900">
                                      {headerTexto}
                                    </p>
                                  </div>
                                )}

                                {headerTipo === "IMAGE" && imagePreviewUrl && (
                                  <img
                                    src={imagePreviewUrl}
                                    alt="Preview"
                                    className="w-full rounded-t-lg"
                                  />
                                )}

                                {/* Body Preview */}
                                {bodyTexto && (
                                  <div className="px-3 py-2">
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                      {bodyTexto.replace(
                                        /\{\{nome\}\}/g,
                                        nomeExemplo || "[nome]"
                                      )}
                                    </p>
                                  </div>
                                )}

                                {/* Footer Preview */}
                                {footerTexto && (
                                  <div className="px-3 pb-2">
                                    <p className="text-xs text-gray-500">
                                      {footerTexto}
                                    </p>
                                  </div>
                                )}

                                {/* Buttons Preview */}
                                {botoes.length > 0 && (
                                  <div className="border-t border-gray-200 mt-1">
                                    {botoes.map((botao, idx) => (
                                      <div
                                        key={idx}
                                        className="px-3 py-2 text-center border-b border-gray-200 last:border-0 hover:bg-gray-50 cursor-pointer"
                                      >
                                        <p className="text-sm text-blue-600 font-medium">
                                          {botao.tipo === "PHONE_NUMBER" &&
                                            "📞 "}
                                          {botao.tipo === "URL" && "🔗 "}
                                          {botao.texto || `Botão ${idx + 1}`}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Timestamp */}
                                <div className="px-3 pb-1 flex justify-end">
                                  <span className="text-[10px] text-gray-500">
                                    {new Date().toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Input area do WhatsApp */}
                          <div className="bg-gray-100 px-2 py-2 flex items-center gap-2 border-t border-gray-300">
                            <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                            <div className="flex-1 bg-white rounded-full px-4 py-2">
                              <p className="text-xs text-gray-400">Mensagem</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-[#008069] flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        <strong>Nota:</strong> Este é apenas um preview. O
                        template real será revisado pelo WhatsApp antes de ser
                        aprovado.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
                <h2 className="text-xl font-semibold text-black">Ações</h2>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    conexoesSelecionadas.length === 0 ||
                    !bodyTexto
                  }
                  className={`w-full py-3 px-6 text-lg rounded-xl font-semibold transition ${
                    submitting ||
                    conexoesSelecionadas.length === 0 ||
                    !bodyTexto
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-fuchsia-800 text-white hover:opacity-80"
                  }`}
                >
                  {submitting
                    ? `Criando em ${conexoesSelecionadas.length} conexão(es)...`
                    : `Criar Template em ${
                        conexoesSelecionadas.length || 0
                      } Conexão(es)`}
                </button>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Informações Importantes
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Templates são revisados pelo WhatsApp (até 24h)</li>
                    <li>Apenas templates aprovados podem ser enviados</li>
                    <li>
                      Use {"{{"}nome{"}}"} para personalizar com o nome do
                      cliente
                    </li>
                    <li>Você pode criar o mesmo template em várias conexões</li>
                    <li>Máximo 10 botões por template</li>
                    <li>Templates de marketing têm custo diferente</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Modal de Detalhes do Template - Preview estilo WhatsApp */}
      {templateSelecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setTemplateSelecionado(null)}
        >
          <div
            className="bg-slate-100 rounded-2xl p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-black">
                  {templateSelecionado.name}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`px-3 py-1 text-xs rounded-lg font-semibold ${
                      templateSelecionado.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : templateSelecionado.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {templateSelecionado.status === "APPROVED"
                      ? "✓ Aprovado"
                      : templateSelecionado.status === "PENDING"
                      ? "⏳ Pendente"
                      : "✗ Rejeitado"}
                  </span>
                  <span className="text-sm text-gray-600">
                    {templateSelecionado.category}
                  </span>
                  <span className="text-sm text-gray-600">
                    {templateSelecionado.language}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setTemplateSelecionado(null)}
                className="text-gray-500 hover:text-gray-800 text-3xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Conexões */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Conexões ({templateSelecionado.conexoes?.length || 1})
              </p>
              <div className="flex flex-wrap gap-2">
                {templateSelecionado.conexoes ? (
                  templateSelecionado.conexoes.map((conn, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 bg-fuchsia-100 text-fuchsia-800 rounded-lg text-xs"
                    >
                      <div className="font-semibold">{conn.nome}</div>
                      <div className="text-fuchsia-600">{conn.telefone}</div>
                      <div className="font-bold mt-1">
                        {conn.status === "APPROVED"
                          ? "✓ Aprovado"
                          : conn.status === "PENDING"
                          ? "⏳ Pendente"
                          : "✗ Rejeitado"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 bg-fuchsia-100 text-fuchsia-800 rounded-lg text-xs">
                    <div className="font-semibold">
                      {templateSelecionado.conexao_nome}
                    </div>
                    <div className="text-fuchsia-600">
                      {templateSelecionado.conexao_telefone}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Motivo de rejeição */}
            {templateSelecionado.rejected_reason && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <p className="text-sm font-semibold text-red-800">
                  ⚠️ Motivo da Rejeição
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {templateSelecionado.rejected_reason}
                </p>
              </div>
            )}

            {/* Preview estilo WhatsApp */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Header do WhatsApp */}
              <div className="bg-[#075e54] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                    👤
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      Pré-visualização do Template
                    </p>
                    <p className="text-gray-200 text-xs">online</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white/20"></div>
                  <div className="w-6 h-6 rounded-full bg-white/20"></div>
                </div>
              </div>

              {/* Área de mensagens */}
              <div
                className="p-4 min-h-[500px] flex items-start"
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwTDQwIDQwTTQwIDBMMCA0MCIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')",
                  backgroundColor: "#efeae2",
                }}
              >
                <div className="w-full max-w-xl">
                  <div className="bg-white rounded-lg rounded-tl-none shadow-md">
                    {/* Header Preview */}
                    {(() => {
                      const headerComp = templateSelecionado.components?.find(
                        (c) => c.type === "HEADER"
                      );
                      if (headerComp?.format === "TEXT" && headerComp.text) {
                        return (
                          <div className="px-3 pt-3 pb-1">
                            <p className="font-bold text-base text-gray-900">
                              {headerComp.text}
                            </p>
                          </div>
                        );
                      }
                      if (headerComp?.format === "IMAGE") {
                        // Tentar obter a URL da imagem do exemplo
                        const imageUrl = headerComp.example?.header_handle?.[0];

                        if (imageUrl && imageUrl.startsWith("http")) {
                          // Se temos uma URL válida, mostrar a imagem
                          return (
                            <img
                              src={imageUrl}
                              alt="Header"
                              className="w-full rounded-t-lg max-h-64 object-cover"
                              onError={(e) => {
                                // Se falhar ao carregar, mostrar placeholder
                                e.target.style.display = "none";
                                e.target.nextElementSibling.style.display =
                                  "flex";
                              }}
                            />
                          );
                        } else {
                          // Placeholder quando não há URL
                          return (
                            <div className="bg-gray-200 w-full h-48 rounded-t-lg flex items-center justify-center">
                              <span className="text-gray-500 text-sm">
                                🖼️ Imagem do Cabeçalho
                              </span>
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}

                    {/* Body Preview */}
                    {(() => {
                      const bodyComp = templateSelecionado.components?.find(
                        (c) => c.type === "BODY"
                      );
                      if (bodyComp?.text) {
                        const exemplo =
                          bodyComp.example?.body_text_named_params?.[0]
                            ?.example || "Cliente";
                        return (
                          <div className="px-3 py-3">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {bodyComp.text.replace(/\{\{nome\}\}/g, exemplo)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Footer Preview */}
                    {(() => {
                      const footerComp = templateSelecionado.components?.find(
                        (c) => c.type === "FOOTER"
                      );
                      if (footerComp?.text) {
                        return (
                          <div className="px-3 pb-2">
                            <p className="text-xs text-gray-500">
                              {footerComp.text}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Buttons Preview */}
                    {(() => {
                      const buttonsComp = templateSelecionado.components?.find(
                        (c) => c.type === "BUTTONS"
                      );
                      if (buttonsComp?.buttons?.length > 0) {
                        return (
                          <div className="border-t border-gray-200">
                            {buttonsComp.buttons.map((botao, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-2.5 text-center border-b border-gray-200 last:border-0 hover:bg-gray-50 cursor-pointer transition"
                              >
                                <p className="text-sm text-blue-600 font-medium">
                                  {botao.type === "PHONE_NUMBER" && "📞 "}
                                  {botao.type === "URL" && "🔗 "}
                                  {botao.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Timestamp */}
                    <div className="px-3 pb-2 flex justify-end">
                      <span className="text-[10px] text-gray-500">
                        {new Date().toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setTemplateSelecionado(null)}
              className="mt-6 w-full py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {templateParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setTemplateParaExcluir(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-11/12 max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-black mb-4">
              ⚠️ Confirmar Exclusão
            </h2>
            <p className="text-gray-700 mb-4">
              Tem certeza que deseja excluir o template{" "}
              <span className="font-semibold">
                "{templateParaExcluir.name}"
              </span>
              ?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Atenção:</strong>
              </p>
              <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                <li>
                  Templates aprovados não podem ser recriados com o mesmo nome
                  por 30 dias
                </li>
                <li>Mensagens pendentes podem não ser entregues</li>
                <li>Esta ação não pode ser desfeita</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Permissões:</strong>
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Se você receber erro de permissão, significa que o token de
                acesso precisa de permissões de administrador na conta WhatsApp
                Business. Entre em contato com o administrador do sistema ou
                acesse diretamente o{" "}
                <a
                  href="https://business.facebook.com"
                  target="_blank"
                  className="underline font-semibold hover:text-blue-900"
                >
                  Facebook Business Manager
                </a>{" "}
                para gerenciar templates.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setTemplateParaExcluir(null)}
                disabled={excluindo}
                className="flex-1 py-2 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirTemplate}
                disabled={excluindo}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {excluindo ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Duplicação */}
      {templateParaDuplicar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setTemplateParaDuplicar(null);
            setConexoesDuplicacao([]);
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-black">
                📋 Duplicar Template
              </h2>
              <button
                onClick={() => {
                  setTemplateParaDuplicar(null);
                  setConexoesDuplicacao([]);
                }}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-xl">
              <p className="font-semibold text-fuchsia-900 mb-2">
                Template: {templateParaDuplicar.name}
              </p>
              <p className="text-sm text-fuchsia-700">
                Status: {templateParaDuplicar.status} | Categoria:{" "}
                {templateParaDuplicar.category}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Conexões onde o template JÁ EXISTE:
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {templateParaDuplicar.conexoes ? (
                  templateParaDuplicar.conexoes.map((conn, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                    >
                      <div className="font-semibold text-gray-800">
                        {conn.nome}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {conn.telefone}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            conn.status === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : conn.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : conn.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {conn.status === "APPROVED"
                            ? "✓ Aprovado"
                            : conn.status === "PENDING"
                            ? "⏳ Pendente"
                            : conn.status === "REJECTED"
                            ? "✗ Rejeitado"
                            : conn.status || "Desconhecido"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm">
                    <div className="font-semibold text-gray-800">
                      {templateParaDuplicar.conexao_nome}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {templateParaDuplicar.conexao_telefone}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          templateParaDuplicar.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : templateParaDuplicar.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : templateParaDuplicar.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {templateParaDuplicar.status === "APPROVED"
                          ? "✓ Aprovado"
                          : templateParaDuplicar.status === "PENDING"
                          ? "⏳ Pendente"
                          : templateParaDuplicar.status === "REJECTED"
                          ? "✗ Rejeitado"
                          : templateParaDuplicar.status || "Desconhecido"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Selecione as conexões para DUPLICAR:{" "}
                <span className="text-red-500">*</span>
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Escolha as conexões onde você quer criar uma cópia deste
                template
              </p>

              {conexoes.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  Nenhuma conexão disponível
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3">
                  {conexoes
                    .filter((c) => {
                      // Filtrar conexões que já possuem o template
                      const conexoesExistentes = templateParaDuplicar.conexoes
                        ? templateParaDuplicar.conexoes.map(
                            (conn) => conn.waba_id
                          )
                        : [templateParaDuplicar.waba_id];
                      return !conexoesExistentes.includes(c.waba_id);
                    })
                    .map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={conexoesDuplicacao.some(
                            (conn) => conn.id === c.id
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConexoesDuplicacao([...conexoesDuplicacao, c]);
                            } else {
                              setConexoesDuplicacao(
                                conexoesDuplicacao.filter(
                                  (conn) => conn.id !== c.id
                                )
                              );
                            }
                          }}
                          className="w-4 h-4 text-fuchsia-600 rounded"
                        />
                        <span className="text-black flex-1">
                          {c.nome} - {c.telefone}
                        </span>
                      </label>
                    ))}
                </div>
              )}

              {conexoesDuplicacao.length > 0 && (
                <p className="text-xs text-fuchsia-600 mt-2">
                  {conexoesDuplicacao.length} conexão(es) selecionada(s)
                </p>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Importante:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>O template será criado com o mesmo nome e configurações</li>
                <li>Templates criados passam por aprovação do WhatsApp</li>
                <li>O status inicial será PENDING (pendente)</li>
                <li>Aprovação pode levar até 24 horas</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTemplateParaDuplicar(null);
                  setConexoesDuplicacao([]);
                }}
                disabled={duplicando}
                className="flex-1 py-2 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDuplicarTemplate}
                disabled={duplicando || conexoesDuplicacao.length === 0}
                className="flex-1 py-2 bg-fuchsia-600 text-white rounded-xl font-medium hover:bg-fuchsia-700 disabled:opacity-50"
              >
                {duplicando
                  ? `Duplicando em ${conexoesDuplicacao.length} conexão(es)...`
                  : `Duplicar em ${conexoesDuplicacao.length || 0} Conexão(es)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {templateParaEditar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-6"
          onClick={() => setTemplateParaEditar(null)}
        >
          <div
            className="bg-slate-100 rounded-2xl p-6 w-full max-w-7xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-black">
                  ✏️ Editar Template: {templateParaEditar.name}
                </h2>
                {templateParaEditar.conexoes &&
                  templateParaEditar.conexoes.length > 1 && (
                    <p className="text-sm text-gray-600 mt-1">
                      🔄 Esta edição será aplicada em{" "}
                      <span className="font-semibold text-blue-600">
                        {templateParaEditar.conexoes.length} conexões
                      </span>
                    </p>
                  )}
              </div>
              <button
                onClick={() => setTemplateParaEditar(null)}
                className="text-gray-500 hover:text-gray-800 text-3xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Limitações:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>
                  Não é possível editar a categoria de templates aprovados
                </li>
                <li>Todos os componentes serão substituídos pelos novos</li>
                <li>
                  Templates aprovados: máx 10 edições em 30 dias ou 1 em 24h
                </li>
              </ul>
            </div>

            <form onSubmit={handleEditarTemplate}>
              <div className="flex gap-6">
                {/* Coluna Esquerda: Formulário */}
                <div className="flex-1 overflow-y-auto max-h-[70vh] pr-4 space-y-6">
                  {/* Categoria */}
                  {templateParaEditar.status !== "APPROVED" && (
                    <div className="bg-white p-6 rounded-2xl shadow-md">
                      <label className="block font-medium text-gray-600 mb-2">
                        Categoria
                      </label>
                      <select
                        value={editCategoria}
                        onChange={(e) => setEditCategoria(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl text-black"
                      >
                        <option value="MARKETING">Marketing</option>
                        <option value="UTILITY">Utilidade</option>
                      </select>
                    </div>
                  )}

                  {/* Header */}
                  <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
                    <h3 className="text-xl font-semibold text-black">
                      Cabeçalho (Opcional)
                    </h3>

                    <div>
                      <label className="block font-medium text-gray-600 mb-2">
                        Tipo de Cabeçalho
                      </label>
                      <select
                        value={editHeaderTipo}
                        onChange={(e) => {
                          setEditHeaderTipo(e.target.value);
                          setEditHeaderTexto("");
                          setEditHeaderImagemUrl("");
                          setEditImagePreviewUrl("");
                        }}
                        className="w-full p-3 border border-gray-300 rounded-xl text-black"
                      >
                        <option value="NONE">Sem cabeçalho</option>
                        <option value="TEXT">Texto</option>
                        <option value="IMAGE">Imagem</option>
                      </select>
                    </div>

                    {editHeaderTipo === "TEXT" && (
                      <div>
                        <label className="block font-medium text-gray-600 mb-2">
                          Texto do Cabeçalho
                        </label>
                        <input
                          type="text"
                          value={editHeaderTexto}
                          onChange={(e) => setEditHeaderTexto(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-xl text-black"
                          placeholder="Nossa promoção começou!"
                          maxLength={60}
                        />
                      </div>
                    )}

                    {editHeaderTipo === "IMAGE" && (
                      <div>
                        <label className="block font-medium text-gray-600 mb-2">
                          Upload de Imagem
                        </label>

                        {/* Se há handle mas sem preview (imagem existente) */}
                        {editHeaderImagemUrl && !editImagePreviewUrl ? (
                          <div className="space-y-3">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <svg
                                    className="w-6 h-6 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-green-800">
                                    ✓ Este template já possui uma imagem no
                                    cabeçalho
                                  </p>
                                  <p className="text-xs text-green-600 mt-1">
                                    A imagem existente será mantida. Faça upload
                                    de uma nova apenas se desejar substituí-la.
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditImageUpload}
                                disabled={editUploadingImage}
                                className="flex-1 p-3 border border-gray-300 rounded-xl text-black"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setEditHeaderTipo("NONE");
                                  setEditHeaderImagemUrl("");
                                  setEditImagePreviewUrl("");
                                }}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition"
                                title="Remover imagem do cabeçalho"
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          </div>
                        ) : editImagePreviewUrl ? (
                          /* Nova imagem com preview */
                          <div className="relative">
                            <img
                              src={editImagePreviewUrl}
                              alt="Preview"
                              className="w-full h-auto rounded-xl border-2 border-fuchsia-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditHeaderImagemUrl("");
                                setEditImagePreviewUrl("");
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition shadow-lg"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          /* Sem imagem - permitir upload */
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEditImageUpload}
                            disabled={editUploadingImage}
                            className="w-full p-3 border border-gray-300 rounded-xl text-black"
                          />
                        )}
                        {editUploadingImage && (
                          <p className="text-sm text-gray-500 mt-2">
                            Fazendo upload...
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
                    <h3 className="text-xl font-semibold text-black">
                      Corpo da Mensagem <span className="text-red-500">*</span>
                    </h3>

                    <div>
                      <label className="block font-medium text-gray-600 mb-2">
                        Texto do Corpo
                      </label>
                      <textarea
                        value={editBodyTexto}
                        onChange={(e) => setEditBodyTexto(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl text-black min-h-32"
                        placeholder="Olá {{nome}}! Seja bem-vindo ao nosso sistema."
                        maxLength={1024}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use {"{{"}nome{"}}"} para personalizar com o nome do
                        cliente (opcional)
                      </p>
                    </div>

                    {editBodyTexto.includes("{{nome}}") && (
                      <div>
                        <label className="block font-medium text-gray-600 mb-2">
                          Exemplo para {"{{"}nome{"}}"}
                        </label>
                        <input
                          type="text"
                          value={editNomeExemplo}
                          onChange={(e) => setEditNomeExemplo(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-xl text-black"
                          placeholder="João Silva"
                          maxLength={50}
                        />
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
                    <h3 className="text-xl font-semibold text-black">
                      Rodapé (Opcional)
                    </h3>

                    <div>
                      <label className="block font-medium text-gray-600 mb-2">
                        Texto do Rodapé
                      </label>
                      <textarea
                        value={editFooterTexto}
                        onChange={(e) => setEditFooterTexto(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl text-black"
                        placeholder="Não deseja mais receber? Responda PARAR"
                        maxLength={60}
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
                    <h3 className="text-xl font-semibold text-black">
                      Botões (Opcional)
                    </h3>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => adicionarBotaoEdicao("QUICK_REPLY")}
                        className="px-3 py-2 bg-green-100 border border-green-200 text-green-800 text-sm rounded-lg hover:opacity-80"
                        disabled={editBotoes.length >= 10}
                      >
                        + Resposta Rápida
                      </button>
                      <button
                        type="button"
                        onClick={() => adicionarBotaoEdicao("PHONE_NUMBER")}
                        className="px-3 py-2 bg-blue-100 border border-blue-200 text-blue-800 text-sm rounded-lg hover:opacity-80"
                        disabled={editBotoes.length >= 10}
                      >
                        + Telefone
                      </button>
                      <button
                        type="button"
                        onClick={() => adicionarBotaoEdicao("URL")}
                        className="px-3 py-2 bg-purple-100 border border-purple-200 text-purple-800 text-sm rounded-lg hover:opacity-80"
                        disabled={editBotoes.length >= 10}
                      >
                        + URL
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editBotoes.map((botao, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-gray-50 rounded-xl space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">
                              {botao.tipo === "QUICK_REPLY" &&
                                "Resposta Rápida"}
                              {botao.tipo === "PHONE_NUMBER" &&
                                "Botão de Telefone"}
                              {botao.tipo === "URL" && "Botão de URL"}
                            </span>
                            <button
                              type="button"
                              onClick={() => removerBotaoEdicao(idx)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          </div>

                          <input
                            type="text"
                            value={botao.texto}
                            onChange={(e) => {
                              const novos = [...editBotoes];
                              novos[idx].texto = e.target.value;
                              setEditBotoes(novos);
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg text-black"
                            placeholder="Texto do botão"
                            maxLength={25}
                          />

                          {botao.tipo === "PHONE_NUMBER" && (
                            <input
                              type="tel"
                              value={botao.telefone}
                              onChange={(e) => {
                                const novos = [...editBotoes];
                                novos[idx].telefone = e.target.value;
                                setEditBotoes(novos);
                              }}
                              className="w-full p-2 border border-gray-300 rounded-lg text-black"
                              placeholder="+5565981442006"
                              maxLength={20}
                            />
                          )}

                          {botao.tipo === "URL" && (
                            <>
                              <input
                                type="url"
                                value={botao.url}
                                onChange={(e) => {
                                  const novos = [...editBotoes];
                                  novos[idx].url = e.target.value;
                                  setEditBotoes(novos);
                                }}
                                className="w-full p-2 border border-gray-300 rounded-lg text-black"
                                placeholder="https://exemplo.com"
                              />
                              <input
                                type="text"
                                value={botao.exemplo}
                                onChange={(e) => {
                                  const novos = [...editBotoes];
                                  novos[idx].exemplo = e.target.value;
                                  setEditBotoes(novos);
                                }}
                                className="w-full p-2 border border-gray-300 rounded-lg text-black"
                                placeholder="Exemplo (opcional): /promo123"
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-3 pb-4">
                    <button
                      type="button"
                      onClick={() => setTemplateParaEditar(null)}
                      disabled={editando}
                      className="flex-1 py-3 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={editando || !editBodyTexto}
                      className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50"
                    >
                      {editando ? "Salvando..." : "Salvar Alterações"}
                    </button>
                  </div>
                </div>

                {/* Coluna Direita: Preview Fixo */}
                <div className="w-96 flex-shrink-0">
                  <div className="sticky top-6">
                    <h3 className="text-lg font-semibold text-white mb-3 text-center">
                      📱 Pré-visualização
                    </h3>

                    {/* Mockup de Celular */}
                    <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
                      {/* Notch */}
                      <div className="bg-black h-6 w-32 mx-auto rounded-b-2xl mb-1"></div>

                      {/* Tela do Celular */}
                      <div className="bg-white rounded-[2rem] overflow-hidden">
                        {/* Header WhatsApp */}
                        <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">
                            FA
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">
                              Frutos do Açaí
                            </p>
                            <p className="text-white/80 text-xs">online</p>
                          </div>
                        </div>

                        {/* Área de Mensagens */}
                        <div
                          className="p-4 min-h-[450px]"
                          style={{
                            backgroundImage:
                              'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h100v100H0z" fill="%23e5ddd5"/%3E%3Cpath d="M10 10h30v30H10zM50 10h30v30H50zM10 50h30v30H10zM50 50h30v30H50z" fill="%23fff" opacity=".1"/%3E%3C/svg%3E")',
                            backgroundColor: "#efeae2",
                          }}
                        >
                          <div className="flex justify-start">
                            <div className="bg-white rounded-lg rounded-tl-none shadow-md max-w-[85%]">
                              {/* Header Preview */}
                              {editHeaderTipo === "TEXT" && editHeaderTexto && (
                                <div className="px-3 pt-2 pb-1">
                                  <p className="font-bold text-sm text-gray-900">
                                    {editHeaderTexto}
                                  </p>
                                </div>
                              )}

                              {editHeaderTipo === "IMAGE" &&
                                editImagePreviewUrl && (
                                  <img
                                    src={editImagePreviewUrl}
                                    alt="Preview"
                                    className="w-full rounded-t-lg"
                                  />
                                )}

                              {/* Body Preview */}
                              {editBodyTexto && (
                                <div className="px-3 py-2">
                                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                    {editBodyTexto.replace(
                                      /\{\{nome\}\}/g,
                                      editNomeExemplo || "[nome]"
                                    )}
                                  </p>
                                </div>
                              )}

                              {/* Footer Preview */}
                              {editFooterTexto && (
                                <div className="px-3 pb-2">
                                  <p className="text-xs text-gray-500">
                                    {editFooterTexto}
                                  </p>
                                </div>
                              )}

                              {/* Buttons Preview */}
                              {editBotoes.length > 0 && (
                                <div className="border-t border-gray-200 mt-1">
                                  {editBotoes.map((botao, idx) => (
                                    <div
                                      key={idx}
                                      className="px-3 py-2 text-center border-b border-gray-200 last:border-0 hover:bg-gray-50 cursor-pointer"
                                    >
                                      <p className="text-sm text-blue-600 font-medium">
                                        {botao.tipo === "PHONE_NUMBER" && "📞 "}
                                        {botao.tipo === "URL" && "🔗 "}
                                        {botao.texto || `Botão ${idx + 1}`}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Timestamp */}
                              <div className="px-3 pb-1 flex justify-end items-center gap-1">
                                <span className="text-[10px] text-gray-400">
                                  {new Date().toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botão Home */}
                        <div className="h-8 flex items-center justify-center">
                          <div className="w-24 h-1 bg-gray-300 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
