
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Item, Stock } from "@/lib/types"

const formSchema = z.object({
  mode: z.enum(["adjustment", "correction"]),
  value: z.coerce.number(), // This is either the delta or the absolute new total
  batchId: z.string().min(1, "Batch ID is required"),
  expiryDate: z.string().min(1, "Expiry Date is required"),
});

type AdjustStockFormProps = {
  item: Item & { stock?: Stock };
  batchId?: string; // Optional initial batchId if known
  onAdjustStock: (itemId: string, adjustment: number, batchId?: string, expiryDate?: Date, isAbsolute?: boolean, originalStockId?: string) => void;
};

export function AdjustStockForm({ item, batchId: initialBatchId, onAdjustStock }: AdjustStockFormProps) {
  const currentStock = item.stock;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: currentStock ? "correction" : "adjustment",
      value: 0,
      batchId: currentStock?.batchId || initialBatchId || "",
      expiryDate: currentStock?.expiryDate ? new Date(currentStock.expiryDate).toISOString().split('T')[0] : "",
    },
  });

  const mode = form.watch("mode");

  function onSubmit(values: z.infer<typeof formSchema>) {
    let adjustment = values.value;
    const isAbsolute = values.mode === "correction";

    if (!isAbsolute && adjustment === 0) {
      if (values.batchId === currentStock?.batchId && 
          values.expiryDate === (currentStock?.expiryDate ? new Date(currentStock.expiryDate).toISOString().split('T')[0] : "")) {
        form.setError("value", { message: "Please enter an adjustment value or switch to Correction mode to fix details." });
        return;
      }
    }

    if (isAbsolute && values.value < 0) {
      form.setError("value", { message: "Total stock cannot be negative." });
      return;
    }

    if (!isAbsolute && (currentStock?.currentStockQuantity ?? 0) + values.value < 0) {
      form.setError("value", { message: "Stock adjustment would result in negative quantity." });
      return;
    }

    onAdjustStock(
      item.id, 
      adjustment, 
      values.batchId, 
      new Date(values.expiryDate),
      isAbsolute,
      currentStock?.id
    );
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Update Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="adjustment" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Adjustment (add/subtract)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="correction" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Correction (set total/fix details)
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{mode === "adjustment" ? "Adjustment Amount" : "New Total Quantity"}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder={mode === "adjustment" ? "e.g., -10 or 25" : "e.g., 150"} {...field} />
                </FormControl>
                <FormDescription className="text-[10px]">
                  Current: {currentStock?.currentStockQuantity ?? 0}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="batchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch ID</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., B12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiry Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2 border-t">
          <Button type="submit">{mode === "adjustment" ? "Apply Adjustment" : "Save Correction"}</Button>
        </div>
      </form>
    </Form>
  );
}
