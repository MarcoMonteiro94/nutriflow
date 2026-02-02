"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Link2Off, Loader2, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface LinkAccountButtonProps {
  patientId: string;
  patientName: string;
  patientEmail: string | null;
  linkedUserId: string | null;
  linkedUserEmail?: string | null;
}

export function LinkAccountButton({
  patientId,
  patientName,
  patientEmail,
  linkedUserId,
  linkedUserEmail,
}: LinkAccountButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(patientEmail || "");
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    userId?: string;
    email?: string;
  } | null>(null);

  const isLinked = !!linkedUserId;

  async function handleSearch() {
    if (!email.trim()) {
      toast.error("Digite um email para buscar");
      return;
    }

    setLoading(true);
    setSearchResult(null);

    try {
      const response = await fetch("/api/patients/search-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao buscar usuário");
        return;
      }

      setSearchResult(data);

      if (!data.found) {
        toast.info("Nenhum usuário encontrado com este email");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Erro ao buscar usuário");
    } finally {
      setLoading(false);
    }
  }

  async function handleLink() {
    if (!searchResult?.userId) return;

    setLoading(true);

    try {
      const response = await fetch("/api/patients/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          userId: searchResult.userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao vincular conta");
        return;
      }

      toast.success("Conta vinculada com sucesso!");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Link error:", error);
      toast.error("Erro ao vincular conta");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    setLoading(true);

    try {
      const response = await fetch("/api/patients/unlink-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao desvincular conta");
        return;
      }

      toast.success("Conta desvinculada com sucesso!");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Unlink error:", error);
      toast.error("Erro ao desvincular conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isLinked ? "outline" : "default"} className="w-full sm:w-auto">
          {isLinked ? (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              Conta Vinculada
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              Vincular Conta
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isLinked ? "Conta Vinculada" : "Vincular Conta de Paciente"}
          </DialogTitle>
          <DialogDescription>
            {isLinked
              ? `${patientName} está vinculado a uma conta de usuário.`
              : `Vincule ${patientName} a uma conta de usuário existente para que ele possa acessar o portal do paciente.`}
          </DialogDescription>
        </DialogHeader>

        {isLinked ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{linkedUserEmail || "Usuário vinculado"}</p>
                  <p className="text-sm text-muted-foreground">
                    Pode acessar o portal do paciente
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Desvincular a conta removerá o acesso do paciente ao portal.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Fechar
              </Button>
              <Button
                variant="destructive"
                onClick={handleUnlink}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Link2Off className="mr-2 h-4 w-4" />
                Desvincular
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do usuário</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSearchResult(null);
                  }}
                  disabled={loading}
                />
                <Button onClick={handleSearch} disabled={loading || !email.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Buscar"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Busque pelo email da conta que o paciente usa para fazer login
              </p>
            </div>

            {searchResult && (
              <div className="rounded-lg border p-4">
                {searchResult.found ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <UserCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{searchResult.email}</p>
                        <Badge variant="secondary" className="mt-1">
                          Usuário encontrado
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Nenhum usuário encontrado com este email.</p>
                    <p className="text-sm mt-1">
                      O paciente precisa criar uma conta primeiro.
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleLink}
                disabled={loading || !searchResult?.found}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Link2 className="mr-2 h-4 w-4" />
                Vincular
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
