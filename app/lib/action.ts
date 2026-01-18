'use server';
import { z } from 'zod';
import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({    invalid_type_error: 'Please select a customer.',}),
    amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter a valid amount.' }),
    status: z.enum(
      ['pending', 'paid'],
      {invalid_type_error: 'Please select an invoice status.'},
    ),
    date: z.string(),
  });
const createInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoices(prevState: State, formData: FormData){
  const validatedFields = createInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
      });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
    const { customerId, amount, status } = validatedFields.data;
    const AmountHandler = amount * 100;
    const date = new Date();
    try {
        await prisma.invoice.create({
          data: {
            customerId,
            amount: AmountHandler,
            status: status as 'pending' | 'paid',
            date,
          },
        });
        console.log('Invoice created successfully.');
    }
    catch(error){
        console.error('NADHIR RASO S7I7 Error:', error);
        throw new Error('Failed to create invoice.');
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}
const UpdateInvoices = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData){
     const validatedFields = UpdateInvoices.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Edit Invoice.',
      };
    }
    const { customerId, amount, status } = validatedFields.data;
    console.log('Updating invoice with:', { customerId, amount, status });
    const amountInCents = amount * 100;
   
    try{
      await prisma.invoice.update({
        where: { id },
        data: {
          customerId,
          amount: amountInCents,
          status: status as 'pending' | 'paid',
        },
      });
    }catch(error){
      console.error('Failed to update invoice:', error);
      throw new Error('Failed to update invoice.');
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }
export async function deleteInvoice(id: string) {
    try{
      await prisma.invoice.delete({
        where: { id },
      });
    }catch(error){
      console.error('Failed to delete invoice:', error);
      throw new Error('Failed to delete invoice.');
    }
    revalidatePath('/dashboard/invoices');
};
//////////////////////////////////////
const CustomerFormSchema = z.object({
  id: z.string(),
  name: z.string({ invalid_type_error: 'Please enter a name.' }).min(1, { message: 'Please enter a valid name.' }),
  email: z.string({ invalid_type_error: 'Please enter an email.' }).email({ message: 'Please enter a valid email.' }),
  image_url: z.string({ invalid_type_error: 'Please enter an image URL.' }).min(1, { message: 'Please enter a valid image URL.' }),
});

const createCustomerSchema = CustomerFormSchema.omit({ id: true });

export async function createCustomer(prevState: CustomerState, formData: FormData) {
  const validatedFields = createCustomerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    image_url: formData.get('image_url'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Customer.',
    };
  }

  const { name, email, image_url } = validatedFields.data;

  try {
    await prisma.customer.create({
      data: {
        name,
        email,
        imageUrl: image_url,
      },
    });
    console.log('Customer created successfully.');
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Failed to create customer.');
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

const updateCustomerSchema = CustomerFormSchema.omit({ id: true });

export async function updateCustomer(id: string, formData: FormData) {
  const validatedFields = updateCustomerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    image_url: formData.get('image_url'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Edit Customer.',
    };
  }

  const { name, email, image_url } = validatedFields.data;
  console.log('Updating customer with:', { name, email, image_url });

  try {
    await prisma.customer.update({
      where: { id },
      data: {
        name,
        email,
        imageUrl: image_url,
      },
    });
  } catch (error) {
    console.error('Failed to update customer:', error);
    throw new Error('Failed to update customer.');
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Failed to delete customer:', error);
    throw new Error('Failed to delete customer.');
  }
  revalidatePath('/dashboard/customers');
}

////////////////////////////////////
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
};
  message?: string | null;
};

export type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    image_url?: string[];
  };
  message?: string | null;
};
//////////////////////////////////////////////////////////// authentication
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}