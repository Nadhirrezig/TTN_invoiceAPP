import { prisma } from './prisma';
import {
  CustomerField,
  CustomersTableType,
  CustomerForm,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

export async function fetchRevenue() {
  try {
    //dont do this please :D its just an artifitial delay
    // why am i drowning
    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await prisma.revenue.findMany();

    // console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await prisma.invoice.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        customer: true,
      },
    });

    const latestInvoices = data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount,
      name: invoice.customer.name,
      image_url: invoice.customer.imageUrl,
      email: invoice.customer.email,
    })).map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const invoiceCountPromise = prisma.invoice.count();
    const customerCountPromise = prisma.customer.count();
    
    const invoiceStats = await prisma.invoice.groupBy({
      by: ['status'],
      _sum: {
        amount: true,
      },
    });

    const [numberOfInvoices, numberOfCustomers] = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
    ]);

    const totalPaid = invoiceStats.find((s: { status: string; _sum: { amount: number | bigint | null } }) => s.status === 'paid')?._sum.amount ?? 0;
    const totalPending = invoiceStats.find((s: { status: string; _sum: { amount: number | bigint | null } }) => s.status === 'pending')?._sum.amount ?? 0;

    const totalPaidInvoices = formatCurrency(Number(totalPaid));
    const totalPendingInvoices = formatCurrency(Number(totalPending));

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const searchQuery = `%${query}%`;

  try {
    if (!query) {
      const invoices = await prisma.invoice.findMany({
        take: ITEMS_PER_PAGE,
        skip: offset,
        orderBy: { date: 'desc' },
        include: {
          customer: true,
        },
      });

      return invoices.map((invoice) => ({
        id: invoice.id,
        customer_id: invoice.customerId,
        amount: invoice.amount,
        date: invoice.date.toISOString().split('T')[0],
        status: invoice.status as 'pending' | 'paid',
        name: invoice.customer.name,
        email: invoice.customer.email,
        image_url: invoice.customer.imageUrl,
      }));
    }

    // Use raw query for complex search with ILIKE on amount
    const invoices = await prisma.$queryRaw<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date::text as date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url,
        invoices.customer_id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${searchQuery} OR
        customers.email ILIKE ${searchQuery} OR
        invoices.amount::text ILIKE ${searchQuery} OR
        invoices.date::text ILIKE ${searchQuery} OR
        invoices.status ILIKE ${searchQuery}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    if (!query) {
      const count = await prisma.invoice.count();
      return Math.ceil(count / ITEMS_PER_PAGE);
    }

    const searchQuery = `%${query}%`;
    const count = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${searchQuery} OR
        customers.email ILIKE ${searchQuery} OR
        invoices.amount::text ILIKE ${searchQuery} OR
        invoices.date::text ILIKE ${searchQuery} OR
        invoices.status ILIKE ${searchQuery}
    `;

    const totalPages = Math.ceil(Number(count[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        customerId: true,
        amount: true,
        status: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    return {
      id: invoice.id,
      customer_id: invoice.customerId,
      amount: invoice.amount / 100,
      status: invoice.status as 'pending' | 'paid',
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const searchQuery = `%${query}%`;

  try {
    const data = await prisma.$queryRaw<CustomersTableType[]>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${searchQuery} OR
        customers.email ILIKE ${searchQuery}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
		LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
	  `;

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(Number(customer.total_pending ?? 0)),
      total_paid: formatCurrency(Number(customer.total_paid ?? 0)),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function fetchCustomersPages(query: string) {
  try {
    if (!query) {
      const count = await prisma.customer.count();
      return Math.ceil(count / ITEMS_PER_PAGE);
    }

    const searchQuery = `%${query}%`;
    const count = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)
      FROM customers
      WHERE
        customers.name ILIKE ${searchQuery} OR
        customers.email ILIKE ${searchQuery}
    `;

    const totalPages = Math.ceil(Number(count[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of customers.');
  }
}

export async function fetchCustomerById(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
      },
    });

    if (!customer) {
      throw new Error('Customer not found.');
    }

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      image_url: customer.imageUrl,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customer.');
  }
}
