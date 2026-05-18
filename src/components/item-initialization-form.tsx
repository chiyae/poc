"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Item } from "@/lib/types"
import { useSettings } from "@/context/settings-provider"
import { formatItemName } from "@/lib/utils"

const formSchema = z.object({
  buyingPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  consultationPrice: z.coerce.number().nonnegative(),
  batchId: z.string().min(1, "Batch ID is required."),
  expiryDate: z.string().min(1, "Expiry date is required."),
  initialQuantity: z.coerce.number().int().positive("Quantity must be at least 1."),
})

type ItemInitializationFormProps = {
  item: Item;
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
}

export function ItemInitializationForm({ item, onSubmit }: ItemInitializationFormProps) {
  const { currency } = useSettings();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      buyingPrice: item.buyingPrice,
      sellingPrice: item.sellingPrice,
      consultationPrice: item.consultationPrice,
      batchId: "",
      expiryDate: "",
      initialQuantity: 0,
    },
  })

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-3 rounded-md border border-primary/20">
        <h3 className="font-bold text-sm text-[#A0D2EB]">{formatItemName(item)}</h3>
        <p className="text-[10px] text-muted-foreground uppercase">{item.itemCode} • {item.category}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
            <FormField
              control={form.control}
              name="buyingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase text-muted-foreground">Buying Price ({currency})</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} className="h-8 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase text-muted-foreground">Walk-in Price ({currency})</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} className="h-8 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consultationPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase text-muted-foreground">OPD Price ({currency})</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} className="h-8 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase text-muted-foreground">Batch ID</FormLabel>
                  <FormControl><Input placeholder="e.g. BAT123" {...field} className="h-8 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase text-muted-foreground">Expiry Date</FormLabel>
                  <FormControl><Input type="date" {...field} className="h-8 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initialQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase text-muted-foreground">Quantity ({item.unitOfMeasure})</FormLabel>
                  <FormControl><Input type="number" {...field} className="h-8 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-[#A0D2EB] hover:bg-[#A0D2EB]/90 text-slate-900 font-bold px-8">
              {form.formState.isSubmitting ? "Initializing..." : "Initialize Item Stock"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
