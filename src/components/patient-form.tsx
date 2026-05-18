
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Patient } from "@/lib/types"
import { format, parse } from "date-fns"
import { Textarea } from "./ui/textarea"


const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  dateOfBirth: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Date must be in DD/MM/YYYY format.")
    .refine((dateString) => {
      try {
        const date = parse(dateString, "dd/MM/yyyy", new Date());
        // `parse` can be lenient. This check ensures the date is real,
        // e.g. it rejects "32/01/2023"
        return format(date, 'dd/MM/yyyy') === dateString;
      } catch {
        return false;
      }
    }, "Please enter a valid date."),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Please select a gender." }),
  phone: z.string().optional(),
  address: z.string().optional(),
});


type PatientFormProps = {
  patient?: Patient | null;
  onSubmit: (data: any) => Promise<void>;
}

export function PatientForm({ patient, onSubmit }: PatientFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      dateOfBirth: "",
      gender: "Male",
      phone: "",
    }
  });

  // When the patient prop changes (e.g., editing a different patient in the same dialog),
  // we need to reset the form with the new values.
  React.useEffect(() => {
    form.reset({
      firstName: patient?.firstName || "",
      lastName: patient?.lastName || "",
      address: patient?.address || "",
      dateOfBirth: patient?.dateOfBirth ? format(new Date(patient.dateOfBirth), "dd/MM/yyyy") : "",
      gender: (patient?.gender as any) || "Male",
      phone: patient?.phone || "",
    });
  }, [patient, form]);

  async function handleFormSubmit(values: z.infer<typeof formSchema>) {
    await onSubmit({
      ...values,
      dateOfBirth: parse(values.dateOfBirth, 'dd/MM/yyyy', new Date()),
    });
  }

  const isEditing = !!patient;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => {
            const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              let value = e.target.value.replace(/[^\d]/g, '');
              if (value.length > 8) {
                value = value.slice(0, 8);
              }
              if (value.length > 4) {
                value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
              } else if (value.length > 2) {
                value = `${value.slice(0, 2)}/${value.slice(2)}`;
              }
              field.onChange(value);
            };

            return (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input
                    placeholder="DD/MM/YYYY"
                    {...field}
                    onChange={handleDateChange}
                    maxLength={10}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )
          }}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 0999..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="123 Main St, Anytown..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (isEditing ? 'Saving...' : 'Registering...') : (isEditing ? 'Save Changes' : 'Register Patient')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
