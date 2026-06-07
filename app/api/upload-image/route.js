import { NextResponse } from "next/server";
const WHATSAPP_API_VERSION = "v24.0";
const APP_ID = "802584259333935";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const token = formData.get("token");

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado" },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: "Token da conexão não fornecido" },
        { status: 400 }
      );
    }

    // Converter o arquivo para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Etapa 1: Iniciar sessão de upload
    const uploadSessionRes = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${APP_ID}/uploads?file_name=${encodeURIComponent(
        file.name
      )}&file_length=${file.size}&file_type=${encodeURIComponent(file.type)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!uploadSessionRes.ok) {
      const errorData = await uploadSessionRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            errorData.error?.error_user_msg ||
            errorData.error?.message ||
            "Falha ao iniciar sessão de upload",
        },
        { status: uploadSessionRes.status }
      );
    }

    const uploadSession = await uploadSessionRes.json();
    const uploadSessionId = uploadSession.id;

    // Etapa 2: Fazer upload do arquivo binário
    const uploadRes = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${uploadSessionId}`,
      {
        method: "POST",
        headers: {
          Authorization: `OAuth ${token}`,
          file_offset: "0",
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            errorData.error?.error_user_msg ||
            errorData.error?.message ||
            "Falha no upload do arquivo",
        },
        { status: uploadRes.status }
      );
    }

    const uploadResult = await uploadRes.json();
    const fileHandle = uploadResult.h;

    return NextResponse.json({ handle: fileHandle });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
