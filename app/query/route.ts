import { prisma } from "@/app/lib/prisma";

async function listInvoices() {
  const data = await prisma.invoice.findMany({
    where: { amount: 666 },
    include: {
      customer: {
        select: {
          name: true,
        },
      },
    },
  });

  return data.map((invoice) => ({
    amount: invoice.amount,
    name: invoice.customer.name,
  }));
}

export async function GET() {
  try {
    return Response.json(await listInvoices());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
