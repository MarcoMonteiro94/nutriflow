"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Sparkles, Trophy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChallengeBadgeProps {
  title: string;
  completedAt?: string | null;
}

export function ChallengeBadge({ title, completedAt }: ChallengeBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="rounded-2xl shadow-soft overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />

          <CardContent className="relative p-6 sm:p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Badge Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="relative"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg">
                  <Trophy className="h-10 w-10 text-primary-foreground" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 shadow-md"
                >
                  <Award className="h-4 w-4 text-amber-900" />
                </motion.div>
              </motion.div>

              {/* Sparkles animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2 text-primary"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Parabéns!</span>
                <Sparkles className="h-4 w-4" />
              </motion.div>

              {/* Title */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Desafio Concluído!</h3>
                <p className="text-muted-foreground">{title}</p>
              </div>

              {/* Completion date */}
              {completedAt && (
                <p className="text-sm text-muted-foreground">
                  Completado em{" "}
                  {format(new Date(completedAt), "d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              )}

              {/* Motivational message */}
              <div className="mt-4 p-4 rounded-xl bg-card/80 backdrop-blur-sm max-w-sm">
                <p className="text-sm text-muted-foreground">
                  Você demonstrou dedicação e comprometimento ao completar este
                  desafio. Continue assim e alcance todos os seus objetivos! 💪
                </p>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}
