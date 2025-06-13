import Form from 'next/form';

import { Input } from './ui/input';
import { Label } from './ui/label';
import { Icon } from '@iconify/react';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
}) {
  return (
    <Form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 w-full">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400 flex items-center gap-2"
        >
          <Icon icon="mdi:email" className="mr-1" />
          Email
        </Label>

        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="lady.ada.lovelace@dedevs.club"
          autoComplete="email"
          required
          autoFocus
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400 flex items-center gap-2"
        >
          <Icon icon="mdi:lock" className="mr-1" />
          Password
        </Label>

        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>

      {children}
    </Form>
  );
}
