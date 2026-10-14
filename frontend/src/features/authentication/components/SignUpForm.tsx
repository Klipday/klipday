import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type RegisterInput } from '../api';
import { UseRegisterMutation } from '../hooks';
import { INDUSTRY_OPTIONS, signUpSchema, type SignUpFormValues } from '../schemas';
import { INDUSTRY_LABELS } from '../utils';
import { PasswordInput } from './PasswordInput';
import { RoleSlider } from './RoleSlider';

/**
 * Sign up form with animated role slider (Creator or Brand), role-specific dynamic fields,
 * select dropdown for industry, and robust phone validation. Submits to the backend register
 * endpoint via the `UseRegisterMutation` TanStack Query hook.
 *
 * @returns The sign up form component.
 */
export function SignUpForm() {
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get('role')?.toUpperCase();
  const initialRole = queryRole === 'BRAND' ? 'BRAND' : 'CREATOR';

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: initialRole,
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      companyName: '',
      phoneNumber: '',
      industry: '',
    },
  });

  const role = useWatch({ control: form.control, name: 'role' });
  const mutation = UseRegisterMutation();

  /**
   * Builds the register payload for the chosen role and submits it to the
   * register endpoint.
   *
   * @param values - Validated sign up form values.
   */
  function OnSubmit(values: SignUpFormValues) {
    const { role, email, password } = values;

    const payload: RegisterInput =
      role === 'BRAND'
        ? {
            role,
            email,
            password,
            companyName: values.companyName,
            phoneNumber: values.phoneNumber.trim(),
            industry: values.industry,
          }
        : {
            role,
            email,
            password,
            fullName: values.fullName,
          };

    mutation.mutate(payload);
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(OnSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Controller
          name="role"
          control={form.control}
          render={({ field }) => (
            <RoleSlider
              value={field.value}
              onChange={(newRole) => {
                field.onChange(newRole);
                form.clearErrors();
              }}
              disabled={mutation.isPending}
            />
          )}
        />
      </div>

      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                placeholder="nama@email.com"
                aria-invalid={fieldState.invalid}
                autoComplete="email"
                disabled={mutation.isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Kata sandi</FieldLabel>
              <PasswordInput
                {...field}
                id={field.name}
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
                disabled={mutation.isPending}
              />
              <FieldDescription>Minimal 8 karakter, kombinasi huruf kapital, angka, dan simbol.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Konfirmasi kata sandi</FieldLabel>
              <PasswordInput
                {...field}
                id={field.name}
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
                disabled={mutation.isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {role === 'CREATOR' ? (
          <Controller
            name="fullName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Nama lengkap</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Contoh: Budi Santoso"
                  aria-invalid={fieldState.invalid}
                  autoComplete="name"
                  disabled={mutation.isPending}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        ) : (
          <>
            <Controller
              name="companyName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Nama perusahaan / brand</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Contoh: PT Maju Bersama"
                    aria-invalid={fieldState.invalid}
                    autoComplete="organization"
                    disabled={mutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="phoneNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Nomor telepon</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    placeholder="Contoh: 628123456789"
                    aria-invalid={fieldState.invalid}
                    autoComplete="tel"
                    disabled={mutation.isPending}
                  />
                  <FieldDescription>Gunakan nomor aktif diawali 62 (contoh: 628123456789).</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="industry"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Bidang industri</FieldLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange} disabled={mutation.isPending}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Pilih industri" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {INDUSTRY_OPTIONS.map((item) => {
                        const itemLabel = INDUSTRY_LABELS[item];

                        return (
                          <SelectItem key={item} value={item}>
                            {itemLabel}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </>
        )}

        {mutation.isError && <FieldError>{mutation.error.message}</FieldError>}

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Memproses...</span>
            </span>
          ) : (
            'Daftar'
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
