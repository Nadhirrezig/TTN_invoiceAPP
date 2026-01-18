"use client";
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { createCustomer, CustomerState } from '@/app/lib/action';
import {
  UserCircleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import ImageUpload from '@/app/ui/customers/image-upload';

export default function Form() {
  const initialState: CustomerState = { message: null, errors: {} };
  const [state, formAction] = useActionState(createCustomer, initialState);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Customer Name
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter customer name"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby='name-error'
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.name && state.errors.name.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email address"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby='email-error'
            />
            <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          <div id="email-error" aria-live="polite" aria-atomic="true">
            {state.errors?.email && state.errors.email.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>
        <ImageUpload onImageSelect={setImageUrl} customerName={customerName} />
        <input
          type="hidden"
          name="image_url"
          value={imageUrl || ''}
        />
        <div id="image_url-error" aria-live="polite" aria-atomic="true">
          {state.errors?.image_url && state.errors.image_url.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/customers"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Create Customer</Button>
      </div>
    </form>
  );
}
