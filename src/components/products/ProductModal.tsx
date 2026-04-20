"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

interface ProductModalProps {
  defaultValues?: Partial<ProductFormValues>;
  onSave: (data: ProductFormValues) => void;
  onCancel: () => void;
}

export function ProductModal({
  defaultValues,
  onSave,
  onCancel,
}: ProductModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      reference: "",
      type: "PRODUCT",
      costPrice: 0,
      sellingPriceHT: 0,
      tvaRate: 0.20,
      stockQuantity: 0,
      unit: "unité",
      ...defaultValues,
    },
  });

  const selectedType = watch("type");
  const sellingPrice = watch("sellingPriceHT") || 0;
  const tvaRate = watch("tvaRate") || 0;
  const priceTTC = sellingPrice * (1 + tvaRate);

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="flex flex-col gap-4"
    >
      {/* Type selector */}
      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <div className="flex gap-1">
          {(["PRODUCT", "SERVICE"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValue("type", t, { shouldDirty: true })}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                selectedType === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              {t === "PRODUCT" ? "Produit" : "Service"}
            </button>
          ))}
        </div>
      </div>

      {/* Name & Reference */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-name">
            Désignation <span className="text-destructive">*</span>
          </Label>
          <Input
            id="product-name"
            placeholder="Ex: Ciment Portland CPJ 45"
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-ref">Référence</Label>
          <Input
            id="product-ref"
            placeholder="CIM-001"
            className="font-mono"
            {...register("reference")}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="grid gap-4 sm:grid-cols-3">
        {selectedType === "PRODUCT" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-cost">Prix d&apos;achat (DH)</Label>
            <Input
              id="product-cost"
              type="number"
              step="0.01"
              min="0"
              className="font-mono"
              {...register("costPrice", { valueAsNumber: true })}
              aria-invalid={!!errors.costPrice}
            />
            {errors.costPrice && (
              <p className="text-xs text-destructive">
                {errors.costPrice.message}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-price">
            Prix de vente HT (DH) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="product-price"
            type="number"
            step="0.01"
            min="0"
            className="font-mono"
            {...register("sellingPriceHT", { valueAsNumber: true })}
            aria-invalid={!!errors.sellingPriceHT}
          />
          {errors.sellingPriceHT && (
            <p className="text-xs text-destructive">
              {errors.sellingPriceHT.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-tva">TVA</Label>
          <select
            id="product-tva"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
            {...register("tvaRate", { valueAsNumber: true })}
          >
            <option value="0.20">20%</option>
            <option value="0.14">14%</option>
            <option value="0.10">10%</option>
            <option value="0.07">7%</option>
            <option value="0">Exonéré</option>
          </select>
        </div>
      </div>

      {/* Price TTC preview */}
      <div className="rounded-md border bg-accent/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Prix de vente TTC
          </span>
          <span className="text-base font-bold">
            {new Intl.NumberFormat("fr-MA", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(priceTTC)}{" "}
            DH
          </span>
        </div>
      </div>

      {/* Stock */}
      {selectedType === "PRODUCT" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-stock">Quantité initiale en stock</Label>
            <Input
              id="product-stock"
              type="number"
              min="0"
              step="1"
              className="font-mono"
              {...register("stockQuantity", { valueAsNumber: true })}
              aria-invalid={!!errors.stockQuantity}
            />
            {errors.stockQuantity && (
              <p className="text-xs text-destructive">
                {errors.stockQuantity.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-unit">Unité</Label>
            <Input
              id="product-unit"
              placeholder="pièce, kg, m², etc."
              {...register("unit")}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="size-4" data-icon="inline-start" />
          Annuler
        </Button>
        <Button type="submit">
          <Save className="size-4" data-icon="inline-start" />
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
