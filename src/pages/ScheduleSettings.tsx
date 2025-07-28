
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const settingsSchema = z.object({
  max_consecutive_days: z.number().min(1).max(14),
  min_rest_hours: z.number().min(8).max(24),
  min_weekly_rest_hours: z.number().min(24).max(48),
  senior_experience_threshold: z.number().min(1).max(5),
  require_night_shift_qualification: z.boolean(),
  morning_shift: z.object({
    start_time: z.string(),
    end_time: z.string(),
    min_staff: z.number().min(1),
    min_experience_sum: z.number().min(1),
    min_senior_count: z.number().min(0),
  }),
  afternoon_shift: z.object({
    start_time: z.string(),
    end_time: z.string(),
    min_staff: z.number().min(1),
    min_experience_sum: z.number().min(1),
    min_senior_count: z.number().min(0),
  }),
  night_shift: z.object({
    start_time: z.string(),
    end_time: z.string(),
    min_staff: z.number().min(1),
    min_experience_sum: z.number().min(1),
    min_senior_count: z.number().min(0),
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function ScheduleSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['schedule-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('department', 'General')
        .single();

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings || {
      max_consecutive_days: 5,
      min_rest_hours: 11,
      min_weekly_rest_hours: 36,
      senior_experience_threshold: 3,
      require_night_shift_qualification: true,
      morning_shift: {
        start_time: '07:00',
        end_time: '15:00',
        min_staff: 3,
        min_experience_sum: 4,
        min_senior_count: 1,
      },
      afternoon_shift: {
        start_time: '15:00',
        end_time: '23:00',
        min_staff: 3,
        min_experience_sum: 4,
        min_senior_count: 1,
      },
      night_shift: {
        start_time: '23:00',
        end_time: '07:00',
        min_staff: 2,
        min_experience_sum: 3,
        min_senior_count: 1,
      },
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      // Ensure all required properties are present in the update
      const updateData = {
        department: 'General' as const,
        max_consecutive_days: data.max_consecutive_days,
        min_rest_hours: data.min_rest_hours,
        min_weekly_rest_hours: data.min_weekly_rest_hours,
        senior_experience_threshold: data.senior_experience_threshold,
        require_night_shift_qualification: data.require_night_shift_qualification,
        morning_shift: {
          start_time: data.morning_shift.start_time,
          end_time: data.morning_shift.end_time,
          min_staff: data.morning_shift.min_staff,
          min_experience_sum: data.morning_shift.min_experience_sum,
          min_senior_count: data.morning_shift.min_senior_count,
        },
        afternoon_shift: {
          start_time: data.afternoon_shift.start_time,
          end_time: data.afternoon_shift.end_time,
          min_staff: data.afternoon_shift.min_staff,
          min_experience_sum: data.afternoon_shift.min_experience_sum,
          min_senior_count: data.afternoon_shift.min_senior_count,
        },
        night_shift: {
          start_time: data.night_shift.start_time,
          end_time: data.night_shift.end_time,
          min_staff: data.night_shift.min_staff,
          min_experience_sum: data.night_shift.min_experience_sum,
          min_senior_count: data.night_shift.min_senior_count,
        },
      };

      const { error } = await supabase
        .from('schedule_settings')
        .update(updateData)
        .eq('department', 'General');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-settings'] });
      toast({
        title: "Inställningar sparade",
        description: "Schemaläggningsinställningarna har uppdaterats.",
      });
    },
    onError: () => {
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte spara inställningarna. Försök igen.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    mutation.mutate(data);
  };

  const handleReset = () => {
    form.reset();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Schemaläggningsinställningar</h1>
            <p className="text-muted-foreground">Hantera begränsningar och regler för schemaläggning</p>
          </div>
          <Button variant="outline" size="icon" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Grundläggande begränsningar</CardTitle>
                <CardDescription>
                  Inställningar för arbetstider och vila
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="max_consecutive_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max antal arbetsdagar i rad</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormDescription>
                        Det maximala antalet dagar en anställd kan arbeta i följd
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_rest_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minsta vilotid mellan pass (timmar)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_weekly_rest_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minsta veckovila (timmar)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bemanningskrav</CardTitle>
                <CardDescription>
                  Inställningar för minimibemanning och kompetenskrav per pass
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Dagpass (07:00-15:00)</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="morning_shift.min_staff"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. personal</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="morning_shift.min_experience_sum"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. erfarenhetssumma</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="morning_shift.min_senior_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. antal seniora</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-4">Kvällspass (15:00-23:00)</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="afternoon_shift.min_staff"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. personal</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="afternoon_shift.min_experience_sum"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. erfarenhetssumma</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="afternoon_shift.min_senior_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. antal seniora</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-4">Nattpass (23:00-07:00)</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="night_shift.min_staff"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. personal</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="night_shift.min_experience_sum"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. erfarenhetssumma</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="night_shift.min_senior_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. antal seniora</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="submit" size="lg">
                Spara ändringar
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
