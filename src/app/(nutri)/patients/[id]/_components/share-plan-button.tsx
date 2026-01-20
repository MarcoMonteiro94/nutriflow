"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, MessageCircle, Check, Loader2 } from "lucide-react";

interface SharePlanButtonProps {
  patientId: string;
  patientName: string;
  generateToken: () => Promise<string>;
}

export function SharePlanButton({
  patientName,
  generateToken,
}: SharePlanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const token = await generateToken();
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/patient/access?token=${token}`;
      setMagicLink(link);
    } catch (error) {
      console.error("Failed to generate link:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!magicLink) return;
    await navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!magicLink) return;
    const message = encodeURIComponent(
      `Olá ${patientName}! Segue o link para acessar seu plano alimentar no NutriFlow:\n\n${magicLink}\n\nEste link é válido por 30 dias.`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when closing
      setMagicLink(null);
      setCopied(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar Plano
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Plano com Paciente</DialogTitle>
          <DialogDescription>
            Gere um link de acesso para {patientName} visualizar seu plano
            alimentar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!magicLink ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Clique no botão abaixo para gerar um link de acesso único. O
                link será válido por 30 dias.
              </p>
              <Button
                onClick={handleGenerateLink}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando link...
                  </>
                ) : (
                  "Gerar Link de Acesso"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link">Link de Acesso</Label>
                <div className="flex gap-2">
                  <Input
                    id="link"
                    value={magicLink}
                    readOnly
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Enviar via WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      Link copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Link
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                O link expira em 30 dias. Gerar um novo link invalidará o
                anterior.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
