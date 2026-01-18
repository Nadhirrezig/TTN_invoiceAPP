'use client';
import { CustomerForm } from '@/app/lib/definitions';
import {
  UserCircleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateCustomer } from '@/app/lib/action';
import { useState } from 'react';
import ImageUpload from '@/app/ui/customers/image-upload';

export default function EditCustomerForm({
  customer,
}: {
  customer: CustomerForm;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(customer.image_url || null);
  const [customerName, setCustomerName] = useState<string>(customer.name);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    
    // Use the current image URL from state (which may have been updated via ImageUpload)
    if (imageUrl) {
      formData.set('image_url', imageUrl);
    } else {
      formData.set('image_url', '');
    }

    try {
      await updateCustomer(customer.id, formData);
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
              defaultValue={customer.name}
              placeholder="Enter customer name"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
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
              defaultValue={customer.email}
              placeholder="Enter email address"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            />
            <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
        </div>
        <ImageUpload 
          onImageSelect={setImageUrl} 
          initialImageUrl={customer.image_url || undefined}
          customerName={customerName}
        />
        <input
          type="hidden"
          name="image_url"
          value={imageUrl || ''}
        />
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/customers"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Update Customer</Button>
      </div>
    </form>
  );
}
