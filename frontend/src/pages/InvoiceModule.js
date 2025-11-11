import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, DollarSign, Clock, CheckCircle } from 'lucide-react';

const InvoiceModule = ({ user, tenant, onLogout }) => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    customer_name: '',
    customer_email: '',
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
    subtotal: 0,
    tax: 0,
    total: 0,
    due_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesRes, statsRes] = await Promise.all([
        axios.get('/invoices'),
        axios.get('/invoices/stats')
      ]);
      setInvoices(invoicesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const addInvoiceItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    });
  };

  const updateInvoiceItem = (index, field, value) => {
    const items = [...newInvoice.items];
    items[index][field] = value;
    
    if (field === 'quantity' || field === 'unit_price') {
      items[index].total = items[index].quantity * items[index].unit_price;
    }
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    setNewInvoice({ ...newInvoice, items, subtotal, tax, total });
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/invoices', newInvoice);
      toast.success('Invoice created successfully');
      setOpenDialog(false);
      loadData();
      setNewInvoice({
        customer_name: '',
        customer_email: '',
        items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
        subtotal: 0,
        tax: 0,
        total: 0,
        due_date: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    }
  };

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      await axios.put(`/invoices/${invoiceId}`, { status: newStatus });
      toast.success('Invoice status updated');
      loadData();
    } catch (error) {
      toast.error('Failed to update invoice');
    }
  };

  if (loading) {
    return (
      <Layout user={user} tenant={tenant} onLogout={onLogout} currentModule="invoices">
        <div className="p-6 text-center">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout user={user} tenant={tenant} onLogout={onLogout} currentModule="invoices">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Invoicing & Reporting</h1>
            <p className="text-gray-600">Manage invoices and track payments</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button data-testid="create-invoice-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>Generate a new invoice for your customer</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer-name">Customer Name</Label>
                    <Input
                      id="customer-name"
                      data-testid="invoice-customer-name"
                      value={newInvoice.customer_name}
                      onChange={(e) => setNewInvoice({...newInvoice, customer_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-email">Customer Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={newInvoice.customer_email}
                      onChange={(e) => setNewInvoice({...newInvoice, customer_email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Invoice Items</Label>
                  <div className="space-y-2 mt-2">
                    {newInvoice.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          required
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value))}
                          required
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={item.unit_price}
                          onChange={(e) => updateInvoiceItem(index, 'unit_price', parseFloat(e.target.value))}
                          required
                        />
                        <Input
                          type="number"
                          placeholder="Total"
                          value={item.total.toFixed(2)}
                          readOnly
                        />
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addInvoiceItem}>
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">${newInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (10%):</span>
                      <span className="font-medium">${newInvoice.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${newInvoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="submit-invoice-btn">Create Invoice</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="w-8 h-8 mr-3 text-blue-500" />
                  <div className="text-3xl font-bold">{stats.total_invoices}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 mr-3 text-green-500" />
                  <div className="text-3xl font-bold">${stats.total_revenue.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="w-8 h-8 mr-3 text-yellow-500" />
                  <div className="text-3xl font-bold">${stats.pending_amount.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 mr-3 text-red-500" />
                  <div className="text-3xl font-bold">${stats.overdue_amount.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invoices List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Invoices</h2>
          {invoices.map((invoice) => (
            <Card key={invoice.id} data-testid={`invoice-card-${invoice.invoice_number}`}>
              <CardContent className="pt-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <div className="font-bold text-lg mb-1">{invoice.invoice_number}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Customer: {invoice.customer_name}</p>
                      <p>Email: {invoice.customer_email}</p>
                      <p>Issue Date: {new Date(invoice.issue_date).toLocaleDateString()}</p>
                      <p>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
                      <p>Items: {invoice.items.length}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">${invoice.total.toFixed(2)}</div>
                    <div className="mt-2">
                      <Select value={invoice.status} onValueChange={(v) => updateInvoiceStatus(invoice.id, v)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default InvoiceModule;
