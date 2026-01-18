import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';
import type { Prisma } from '@prisma/client';

type PrismaClientType = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function seedUsers(client: PrismaClientType = prisma) {
  console.log('Seeding users...');
  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return client.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: hashedPassword,
        },
      });
    }),
  );
  console.log(`✓ Seeded ${insertedUsers.length} users`);
  return insertedUsers;
}

async function seedCustomers(client: PrismaClientType = prisma) {
  console.log('Seeding customers...');
  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => client.customer.upsert({
        where: { id: customer.id },
        update: {},
        create: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          imageUrl: customer.image_url,
        },
      }),
    ),
  );
  console.log(`✓ Seeded ${insertedCustomers.length} customers`);
  return insertedCustomers;
}

async function seedInvoices(client: PrismaClientType = prisma) {
  console.log('Seeding invoices...');
  
  // First, try to delete existing invoices to avoid duplicates
  const existingCount = await client.invoice.count();
  if (existingCount > 0) {
    console.log(`Found ${existingCount} existing invoices. Deleting...`);
    await client.invoice.deleteMany();
  }

  // Use createMany for better performance
  const result = await client.invoice.createMany({
    data: invoices.map((invoice) => ({
      customerId: invoice.customer_id,
      amount: invoice.amount,
      status: invoice.status as 'pending' | 'paid',
      date: new Date(invoice.date),
    })),
    skipDuplicates: true,
  });

  console.log(`✓ Seeded ${result.count} invoices`);
  return result;
}

async function seedRevenue(client: PrismaClientType = prisma) {
  console.log('Seeding revenue...');
  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => client.revenue.upsert({
        where: { month: rev.month },
        update: {},
        create: {
          month: rev.month,
          revenue: rev.revenue,
        },
      }),
    ),
  );
  console.log(`✓ Seeded ${insertedRevenue.length} revenue records`);
  return insertedRevenue;
}

export async function GET() {
  try {
    console.log('Starting database seed...');

    await prisma.$transaction(async (tx) => {
      await seedUsers(tx);
      await seedCustomers(tx);
      await seedInvoices(tx);
      await seedRevenue(tx);
    }, {
      timeout: 30000, // 30 second timeout
    });

    // Verify the data was seeded
    const userCount = await prisma.user.count();
    const customerCount = await prisma.customer.count();
    const invoiceCount = await prisma.invoice.count();
    const revenueCount = await prisma.revenue.count();

    console.log('Seed completed successfully!');
    console.log(`Users: ${userCount}, Customers: ${customerCount}, Invoices: ${invoiceCount}, Revenue: ${revenueCount}`);

    return Response.json({ 
      message: 'Database seeded successfully',
      counts: {
        users: userCount,
        customers: customerCount,
        invoices: invoiceCount,
        revenue: revenueCount,
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Seed error:', errorMessage);
    console.error('Stack:', errorStack);
    return Response.json({ 
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      message: 'Failed to seed database'
    }, { status: 500 });
  }
}

// Also support POST method for seeding
export async function POST() {
  return GET();
}
