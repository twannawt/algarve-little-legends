import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { ToastAction } from "@/components/ui/toast";
import type { Recipe, KidApproval } from "@shared/schema";
import { createElement } from "react";

/**
 * Gedeelde recipe mutations — gebruikt door recipes.tsx en recipe-favorites.tsx.
 * Voorkomt ~60 regels duplicatie.
 */
export function useRecipeMutations() {
  const { toast } = useToast();
  const t = useT();
  const qc = useQueryClient();

  const toggleCookedMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/recipes/${id}/cooked`);
      return res.json();
    },
    onSuccess: (data: Recipe, id: string) => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: data.cooked ? t("gemaaktAan") : t("gemaaktUit"),
        action: createElement(
          ToastAction,
          { altText: t("ongedaanMaken"), onClick: () => toggleCookedMutation.mutate(id) },
          t("ongedaanMaken"),
        ),
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/recipes/${id}/favorite`);
      return res.json();
    },
    onSuccess: (data: Recipe, id: string) => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: data.favorite ? t("favorietAan") : t("favorietUit"),
        action: createElement(
          ToastAction,
          { altText: t("ongedaanMaken"), onClick: () => toggleFavoriteMutation.mutate(id) },
          t("ongedaanMaken"),
        ),
      });
    },
  });

  const toggleKidApprovalMutation = useMutation({
    mutationFn: async ({ id, tag }: { id: string; tag: KidApproval }) => {
      const res = await apiRequest("POST", `/api/recipes/${id}/kid-approval`, { tag });
      return res.json();
    },
    onSuccess: (_data: Recipe, variables: { id: string; tag: KidApproval }) => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: `${variables.tag} bijgewerkt`,
        action: createElement(
          ToastAction,
          { altText: t("ongedaanMaken"), onClick: () => toggleKidApprovalMutation.mutate(variables) },
          t("ongedaanMaken"),
        ),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recipes/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: t("receptVerwijderd") });
    },
  });

  const updateCategoriesMutation = useMutation({
    mutationFn: async ({ id, categories }: { id: string; categories: string[] }) => {
      const res = await apiRequest("PATCH", `/api/recipes/${id}/categories`, { categories });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
  });

  return {
    toggleCooked: toggleCookedMutation,
    toggleFavorite: toggleFavoriteMutation,
    toggleKidApproval: toggleKidApprovalMutation,
    deleteRecipe: deleteMutation,
    updateCategories: updateCategoriesMutation,
  };
}
