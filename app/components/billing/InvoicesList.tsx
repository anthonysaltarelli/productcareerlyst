'use client';

import { useState, useEffect } from 'react';
import { FileText, ExternalLink, Download } from 'lucide-react';

interface Invoice {
  id: string;
  number: string | null;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  created: number;
  due_date: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  description: string;
}

interface InvoicesListProps {
  subscription: { stripe_customer_id: string } | null;
}

export const InvoicesList = ({ subscription }: InvoicesListProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!subscription) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/billing/invoices');

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch invoices');
        }

        const { invoices: fetchedInvoices } = await response.json();
        setInvoices(fetchedInvoices);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [subscription]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'open':
        return 'bg-yellow-100 text-yellow-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'void':
        return 'bg-gray-100 text-gray-700';
      case 'uncollectible':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!subscription) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Invoices</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Invoices</h2>
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Invoices</h2>
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">No invoices found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
      <h2 className="text-2xl font-black text-gray-900 mb-6">Invoices</h2>

      <div className="space-y-4">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="p-6 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-purple-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-black text-gray-900">
                    {invoice.number || `Invoice ${invoice.id.slice(-8)}`}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(invoice.status)}`}
                  >
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 font-semibold text-sm mb-1">
                  {invoice.description}
                </p>
                <p className="text-gray-500 text-sm">
                  Created: {formatDate(invoice.created)}
                  {invoice.due_date && ` • Due: ${formatDate(invoice.due_date)}`}
                </p>
              </div>
              <div className="text-right ml-4">
                <div className="text-xl font-black text-gray-900 mb-2">
                  {formatAmount(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              {invoice.hosted_invoice_url && (
                <a
                  href={invoice.hosted_invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Invoice
                </a>
              )}
              {invoice.invoice_pdf && (
                <a
                  href={invoice.invoice_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

