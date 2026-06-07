"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";

const formSchema = z.object({
  email: z.string().min(1),
  senha: z.string().min(1),
});

export default function Login() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setFocus,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await fetch(
        "https://frutosdoacai.up.railway.app/webhook/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      // Lê o texto cru primeiro
      const user = await response.json();

      console.log(user);

      if (response.ok && user?.email === data.email) {
        setCookie("auth_token", JSON.stringify(user), {
          expires: new Date().setMonth(new Date().getMonth + 1),
        });

        router.push("/");
        reset();
      } else if (!response.ok) {
        setError("email", {
          type: "custom",
          message: "E-mail ou senha inválido",
        });

        setFocus("email");
        setValue("email", "");
        setValue("senha", "");
      }
    } catch (error) {
      setError("email", {
        type: "custom",
        message: "E-mail ou senha inválido",
      });

      setFocus("email");
      setValue("email", "");
      setValue("senha", "");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h1 className="text-2xl font-semibold text-left text-black">
          Iniciar sessão
        </h1>

        <div className="grid w-full gap-1">
          <label className="block font-medium text-gray-500">
            E-mail <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            {...register("email")}
            className="border border-gray-300 w-full p-2 rounded-xl text-black"
            placeholder="exemplo@gmail.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="grid w-full gap-1">
          <label className="block font-medium text-gray-500">
            Senha <span className="text-red-500">*</span>
          </label>

          <input
            type="password"
            {...register("senha")}
            className="border border-gray-300 w-full p-2 rounded-xl text-black"
            placeholder="*********"
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>

        {/* Botão de Envio */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-purple-600 hover:opacity-50 text-white py-2 px-4 rounded-xl w-full transition font-sans font-medium cursor-pointer"
        >
          {isSubmitting ? "Iniciando..." : "Iniciar agora"}
        </button>
      </form>
    </main>
  );
}
