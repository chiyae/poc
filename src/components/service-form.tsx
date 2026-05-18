
"use client"

import * as React from "react"
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
import type { Service } from "@/lib/types"
import { useSettings } from "@/context/settings-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect } from "react"

const formSchema = z.object({
  name: z.string().min(3, { message: "Service name must be at least 3 characters." }),
  fee: z.coerce.number().positive({ message: "Fee must be a positive number." }),
  category: z.string().min(1, { message: "Please select a category." }),
})

type ServiceFormProps = {
  service?: Service | null;
  onSubmit: (data: Omit<Service, 'id'>) => Promise<void>;
}

export function ServiceForm({ service, onSubmit }: ServiceFormProps) {
  const { currency } = useSettings();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      fee: 0,
      category: "General",
    },
  })

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        fee: service.fee,
        category: service.category || "General",
      });
    } else {
      form.reset({ name: "", fee: 0, category: "General" });
    }
  }, [service, form]);

  async function handleFormSubmit(values: z.infer<typeof formSchema>) {
    if (service && values.name !== service.name) {
      form.setError("name", {
        type: "manual",
        message: "Changing the service name is not allowed. To rename, please delete and create a new service.",
      });
      return;
    }
    await onSubmit(values);
  }

  const isEditing = !!service;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Regular Consultation" {...field} disabled={isEditing} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee ({currency})</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="e.g. 50.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Laboratory">Laboratory</SelectItem>
                  <SelectItem value="Procedure">Procedure</SelectItem>
                  <SelectItem value="Radiology">Radiology</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Service')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
