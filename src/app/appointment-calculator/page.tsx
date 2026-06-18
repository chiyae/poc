'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Calculator } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function AppointmentCalculatorPage() {
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [customDays, setCustomDays] = useState<number | ''>('');
    const [resultDate, setResultDate] = useState<Date | null>(null);

    const calculateDate = (days: number) => {
        if (!startDate) return;
        const newDate = addDays(startDate, days);
        setResultDate(newDate);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Appointment Calculator</h1>
                <p className="text-muted-foreground">
                    Easily calculate future appointment dates for ART, Family Planning, and other services.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Calculation Parameters</CardTitle>
                        <CardDescription>Select a start date and the duration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={(date) => date && setStartDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-4">
                            <Label>Quick Presets</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" onClick={() => calculateDate(14)}>14 Days</Button>
                                <Button variant="outline" onClick={() => calculateDate(30)}>30 Days</Button>
                                <Button variant="outline" onClick={() => calculateDate(60)}>60 Days</Button>
                                <Button variant="outline" onClick={() => calculateDate(90)}>90 Days (ART)</Button>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <Label>Custom Days</Label>
                            <div className="flex space-x-2">
                                <Input
                                    type="number"
                                    placeholder="Enter days..."
                                    value={customDays}
                                    onChange={(e) => setCustomDays(e.target.value ? parseInt(e.target.value) : '')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && typeof customDays === 'number') {
                                            calculateDate(customDays);
                                        }
                                    }}
                                />
                                <Button 
                                    onClick={() => {
                                        if (typeof customDays === 'number') {
                                            calculateDate(customDays);
                                        }
                                    }}
                                    disabled={typeof customDays !== 'number'}
                                >
                                    Calculate
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Result</CardTitle>
                        <CardDescription>The calculated next appointment date</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 min-h-[300px]">
                        {!resultDate && (
                            <Calculator className="h-16 w-16 text-muted-foreground opacity-20" />
                        )}
                        
                        {resultDate ? (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Next Appointment</p>
                                </div>
                                <div className="bg-primary/10 p-6 rounded-lg border border-primary/20 space-y-2">
                                    <p className="text-4xl font-bold text-primary">
                                        {format(resultDate, "EEEE")}
                                    </p>
                                    <p className="text-2xl font-semibold">
                                        {format(resultDate, "MMMM d, yyyy")}
                                    </p>
                                </div>
                                <Button variant="ghost" onClick={() => setResultDate(null)} className="mt-4">
                                    Clear Result
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-muted-foreground">
                                    Select a quick preset or enter custom days to see the result here.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
