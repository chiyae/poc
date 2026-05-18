'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { getSettings, upsertSettings } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ClinicSettings } from '@/lib/types';
import { useSettings } from '@/context/settings-provider';

const defaultSettings: ClinicSettings = {
  clinicName: 'My Clinic',
  clinicAddress: '123 Main St, City, Country',
  clinicPhone: '+1234567890',
  currency: 'MWK',
  patientIdPrefix: 'MPC',
  sessionTimeout: 30,
  nextReceiptNumber: 1,
  nextInvoiceNumber: 1,
};

export default function GeneralSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { refreshSettings } = useSettings();

  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: settingsRow, isLoading, error } = useQuery(
    () => getSettings('clinic'),
    []
  );

  const settingsData = settingsRow?.value as ClinicSettings | undefined;

  // Form state
  const [clinicName, setClinicName] = React.useState('');
  const [clinicAddress, setClinicAddress] = React.useState('');
  const [clinicPhone, setClinicPhone] = React.useState('');
  const [currency, setCurrency] = React.useState('USD');
  const [patientIdPrefix, setPatientIdPrefix] = React.useState('MPC');
  const [sessionTimeout, setSessionTimeout] = React.useState(30);
  const [nextReceiptNumber, setNextReceiptNumber] = React.useState(1);
  const [nextInvoiceNumber, setNextInvoiceNumber] = React.useState(1);

  // Effect to seed the database with initial data if none exists
  React.useEffect(() => {
    if (!isLoading && !settingsData) {
      upsertSettings('clinic', defaultSettings).then(() => {
        toast({
          title: "Initial Settings Created",
          description: "Default clinic settings have been saved.",
        });
        refreshSettings();
      }).catch(err => {
        console.error("Failed to create initial settings:", err);
      });
    }
  }, [isLoading, settingsData, toast, refreshSettings]);


  // React.useEffect to update form state when data loads
  React.useEffect(() => {
    const dataToDisplay = settingsData || defaultSettings;
    setClinicName(dataToDisplay.clinicName || '');
    setClinicAddress(dataToDisplay.clinicAddress || '');
    setClinicPhone(dataToDisplay.clinicPhone || '');
    setCurrency(dataToDisplay.currency || 'USD');
    setPatientIdPrefix(dataToDisplay.patientIdPrefix || 'MPC');
    setSessionTimeout(dataToDisplay.sessionTimeout || 30);
    setNextReceiptNumber(dataToDisplay.nextReceiptNumber || 1);
    setNextInvoiceNumber(dataToDisplay.nextInvoiceNumber || 1);
  }, [settingsData]);


  const handleSaveClinicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const current = settingsData || defaultSettings;
      await upsertSettings('clinic', {
        ...current,
        clinicName,
        clinicAddress,
        clinicPhone,
        patientIdPrefix,
        sessionTimeout,
        nextReceiptNumber,
        nextInvoiceNumber,
      });

      await refreshSettings();

      toast({
        title: "Clinic Information Updated",
        description: "Your clinic's details have been saved.",
      });
    } catch (error) {
      console.error("Failed to save clinic info:", error);
      toast({
        variant: "destructive",
        title: "Error Saving",
        description: "Could not save clinic information.",
      });
    }
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const current = settingsData || defaultSettings;
      await upsertSettings('clinic', { ...current, currency });
      await refreshSettings();
      toast({
        title: "Currency Settings Updated",
        description: `The default currency has been set to ${currency}.`,
      });
    } catch (error) {
      console.error("Failed to save currency:", error);
      toast({
        variant: "destructive",
        title: "Error Saving",
        description: "Could not save currency settings.",
      });
    }
  };

  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view or edit general settings.</p>
      </div>
    );
  }

  if (isLoading || !isClient) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <header className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
          <p className="text-muted-foreground">
            Manage general information and configurations for the application.
          </p>
        </header>
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="space-y-1.5">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
            <p className="text-muted-foreground">
              Manage general information and configurations for the application.
            </p>
          </div>
        </div>
      </header>

      {/* Clinic Information Card */}
      <Card>
        <form onSubmit={handleSaveClinicInfo}>
          <CardHeader>
            <CardTitle>Clinic Information</CardTitle>
            <CardDescription>
              This information will appear on bills and other official documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic Name</Label>
              <Input
                id="clinicName"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicAddress">Address</Label>
              <Input
                id="clinicAddress"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicPhone">Phone Number</Label>
              <Input
                id="clinicPhone"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientIdPrefix">Patient ID Prefix</Label>
              <Input
                id="patientIdPrefix"
                value={patientIdPrefix}
                onChange={(e) => setPatientIdPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. MPC"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">Used for generating new patient registration numbers (e.g., {patientIdPrefix}-2024-001).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Inactivity Timeout (Minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(parseInt(e.target.value, 10) || 1)}
                min={1}
                max={1440}
              />
              <p className="text-xs text-muted-foreground">Automatically log out users after this many minutes of inactivity.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Save Clinic Info</Button>
          </CardFooter>
        </form>
      </Card>

      {/* Billing & Document Settings Card */}
      <Card>
        <form onSubmit={handleSaveClinicInfo}>
          <CardHeader>
            <CardTitle>Billing & Document Settings</CardTitle>
            <CardDescription>
              Configure how receipts and invoices are numbered.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nextReceiptNumber">Next Receipt Number</Label>
                <Input
                  id="nextReceiptNumber"
                  type="number"
                  value={nextReceiptNumber}
                  onChange={(e) => setNextReceiptNumber(parseInt(e.target.value, 10) || 1)}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">The number that will be assigned to the next finalized receipt.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
                <Input
                  id="nextInvoiceNumber"
                  type="number"
                  value={nextInvoiceNumber}
                  onChange={(e) => setNextInvoiceNumber(parseInt(e.target.value, 10) || 1)}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">The number that will be assigned to the next created invoice.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Save Billing Settings</Button>
          </CardFooter>
        </form>
      </Card>

      {/* Currency Settings Card */}
      <Card>
        <form onSubmit={handleSaveCurrency}>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
            <CardDescription>
              Set the default currency used for all financial transactions and reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isClient && (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="currency">Default Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - United States Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                    <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                    <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                    <SelectItem value="MWK">MWK - Malawian Kwacha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            {isClient && <Button type="submit">Save Currency</Button>}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
