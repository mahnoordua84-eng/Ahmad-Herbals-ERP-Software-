import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Barcode,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  Award,
  Printer,
  Upload,
  Image as ImageIcon,
  Star,
  Archive,
  Warehouse,
} from 'lucide-react';
import { Product, ProductVariation, ProductImage } from '../../types/erp';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    brands,
    warehouses,
    addProduct,
    updateProduct,
    deleteProduct,
    formatCurrency,
    hasPermission,
    t,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodePrintModal, setBarcodePrintModal] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    warehouseId: warehouses[0]?.id || 'wh-main',
    unit: 'KG',
    purchasePrice: 0,
    salePrice: 0,
    wholesalePrice: 0,
    stock: 0,
    minStock: 10,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
    image: '',
    images: [] as ProductImage[],
    tags: '',
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `AH-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `896${Math.floor(100000000 + Math.random() * 900000000)}`,
      categoryId: categories[0]?.id || '',
      brandId: brands[0]?.id || '',
      warehouseId: warehouses[0]?.id || 'wh-main',
      unit: 'KG',
      purchasePrice: 0,
      salePrice: 0,
      wholesalePrice: 0,
      stock: 50,
      minStock: 15,
      description: '',
      status: 'ACTIVE',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
      images: [
        {
          id: `img-${Date.now()}`,
          productId: '',
          url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
          filename: 'herbal_sample.jpg',
          mimeType: 'image/jpeg',
          size: 10240,
          sortOrder: 1,
          isPrimary: true,
          altText: 'Ahmad Herbals Pure Product',
          createdAt: new Date().toISOString(),
        },
      ],
      tags: 'organic, pure',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    const existingImages: ProductImage[] = prod.images && prod.images.length > 0
      ? prod.images
      : prod.image
      ? [{
          id: `img-${Date.now()}`,
          productId: prod.id,
          url: prod.image,
          filename: 'primary.jpg',
          mimeType: 'image/jpeg',
          size: 0,
          sortOrder: 1,
          isPrimary: true,
          altText: prod.name,
          createdAt: new Date().toISOString(),
        }]
      : [];

    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode,
      categoryId: prod.categoryId,
      brandId: prod.brandId,
      warehouseId: warehouses[0]?.id || 'wh-main',
      unit: prod.unit,
      purchasePrice: prod.purchasePrice,
      salePrice: prod.salePrice,
      wholesalePrice: prod.wholesalePrice || prod.salePrice * 0.85,
      stock: prod.stock,
      minStock: prod.minStock,
      description: prod.description || '',
      status: (prod.status as any) || 'ACTIVE',
      image: prod.image || '',
      images: existingImages,
      tags: prod.tags.join(', '),
    });
    setIsModalOpen(true);
  };

  // Image Upload handler (Requirement 30 & 31)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target?.result as string;
        if (dataUrl) {
          const newImg: ProductImage = {
            id: `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: editingProduct?.id || '',
            url: dataUrl,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            sortOrder: formData.images.length + 1,
            isPrimary: formData.images.length === 0,
            altText: formData.name || file.name,
            createdAt: new Date().toISOString(),
          };

          setFormData((prev) => {
            const updated = [...prev.images, newImg];
            const primaryUrl = updated.find((i) => i.isPrimary)?.url || updated[0]?.url || '';
            return {
              ...prev,
              images: updated,
              image: primaryUrl,
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSetPrimaryImage = (imgId: string) => {
    setFormData((prev) => {
      const updated = prev.images.map((img) => ({
        ...img,
        isPrimary: img.id === imgId,
      }));
      const primaryUrl = updated.find((i) => i.isPrimary)?.url || '';
      return {
        ...prev,
        images: updated,
        image: primaryUrl,
      };
    });
  };

  const handleDeleteImage = (imgId: string) => {
    setFormData((prev) => {
      const filtered = prev.images.filter((img) => img.id !== imgId);
      if (filtered.length > 0 && !filtered.some((i) => i.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      const primaryUrl = filtered.find((i) => i.isPrimary)?.url || '';
      return {
        ...prev,
        images: filtered,
        image: primaryUrl,
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === formData.categoryId);
    const br = brands.find((b) => b.id === formData.brandId);
    const primaryImgUrl = formData.images.find((i) => i.isPrimary)?.url || formData.image;

    const payload = {
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode,
      categoryId: formData.categoryId,
      categoryName: cat?.name || 'Category',
      brandId: formData.brandId,
      brandName: br?.name || 'Ahmad Herbals',
      unit: formData.unit,
      purchasePrice: Number(formData.purchasePrice),
      salePrice: Number(formData.salePrice),
      wholesalePrice: Number(formData.wholesalePrice),
      stock: Number(formData.stock),
      minStock: Number(formData.minStock),
      description: formData.description,
      status: formData.status as any,
      image: primaryImgUrl,
      images: formData.images,
      tags: formData.tags.split(',').map((s) => s.trim()).filter(Boolean),
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload, formData.warehouseId);
    }
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesStock =
      stockFilter === 'ALL'
        ? true
        : stockFilter === 'LOW'
        ? p.stock > 0 && p.stock <= p.minStock
        : p.stock <= 0;

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ARCHIVED'
        ? p.status === 'ARCHIVED'
        : p.status !== 'ARCHIVED';

    return matchesSearch && matchesCat && matchesStock && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['ID,Name,SKU,Barcode,Category,Brand,CostPrice,SalePrice,Stock,Unit,Status'];
    const rows = filteredProducts.map(
      (p) =>
        `"${p.id}","${p.name}","${p.sku}","${p.barcode}","${p.categoryName}","${p.brandName}",${p.purchasePrice},${p.salePrice},${p.stock},"${p.unit}","${p.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ahmad_herbals_products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="products-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('products')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Catalog & SKU Management ({filteredProducts.length} items listed)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer shadow-2xs"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          {hasPermission('products', 'create') && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name, SKU or barcode..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('ARCHIVED')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === 'ARCHIVED'
                  ? 'bg-slate-800 text-white shadow-2xs dark:bg-slate-200 dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Archived
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              All
            </button>
          </div>

          {/* Stock Level Filter */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                stockFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => setStockFilter('LOW')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                stockFilter === 'LOW'
                  ? 'bg-amber-100 text-amber-800 shadow-2xs dark:bg-amber-950 dark:text-amber-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('OUT')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                stockFilter === 'OUT'
                  ? 'bg-rose-100 text-rose-800 shadow-2xs dark:bg-rose-950 dark:text-rose-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-slate-500">
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">SKU / Barcode</th>
                <th className="py-3 px-4 font-semibold">Category / Brand</th>
                <th className="py-3 px-4 font-semibold">Cost</th>
                <th className="py-3 px-4 font-semibold">Sale Price</th>
                <th className="py-3 px-4 font-semibold">Available Stock</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((prod) => {
                const isLow = prod.stock > 0 && prod.stock <= prod.minStock;
                const isOut = prod.stock <= 0;

                return (
                  <tr
                    key={prod.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&q=80'}
                          alt={prod.name}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                            {prod.name}
                          </p>
                          <span className="text-[10px] text-slate-400">Unit: {prod.unit}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono text-slate-700 dark:text-slate-300 font-medium">{prod.sku}</p>
                      <p className="font-mono text-[10px] text-slate-400">{prod.barcode}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{prod.categoryName}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{prod.brandName}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {formatCurrency(prod.purchasePrice)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(prod.salePrice)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-black ${
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {prod.stock} {prod.unit}
                        </span>
                        {isLow && (
                          <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            LOW
                          </span>
                        )}
                        {isOut && (
                          <span className="rounded bg-rose-100 px-1 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                            OUT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">Min: {prod.minStock} {prod.unit}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          prod.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : prod.status === 'ARCHIVED'
                            ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            prod.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : prod.status === 'ARCHIVED'
                              ? 'bg-slate-500'
                              : 'bg-amber-500'
                          }`}
                        ></span>
                        {prod.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setBarcodePrintModal(prod)}
                          title="Generate & Print Barcode Label"
                          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Barcode className="h-4 w-4" />
                        </button>
                        {hasPermission('products', 'edit') && (
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            title="Edit Product"
                            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {hasPermission('products', 'delete') && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete product "${prod.name}" permanently?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            title="Delete Product"
                            className="rounded-lg p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product to Catalog'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. 7-Grains Multi Grains Flour"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Brand Entity *
                  </label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Barcode Number (EAN/UPC) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cost / Purchase Price (PKR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Retail Sale Price (PKR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Wholesale Price (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Unit of Measure
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="KG">KG (Kilogram)</option>
                    <option value="Gram">Gram (g)</option>
                    <option value="Liter">Liter (L)</option>
                    <option value="Pack">Pack</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Pcs">Pieces (Pcs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Physical Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Product Lifecycle Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="ACTIVE">Active (Available in POS & Online)</option>
                    <option value="INACTIVE">Inactive / Hidden</option>
                    <option value="ARCHIVED">Archived (Preserve Transaction Records)</option>
                  </select>
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Opening Stock Warehouse *
                    </label>
                    <select
                      value={formData.warehouseId}
                      onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Multiple Images Gallery & Real Upload (Requirement 30 & 31) */}
                <div className="sm:col-span-2 space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Product Media & Image Gallery
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Upload local files or add image URLs. The primary image is displayed in POS and storefront.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Images</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Image previews grid */}
                  {formData.images.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {formData.images.map((img) => (
                        <div
                          key={img.id}
                          className={`relative rounded-xl border overflow-hidden p-1.5 flex flex-col justify-between bg-slate-50 dark:bg-slate-800/80 ${
                            img.isPrimary
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 relative">
                            <img src={img.url} alt={img.altText} className="h-full w-full object-cover" />
                            {img.isPrimary && (
                              <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5 fill-white" /> Primary
                              </span>
                            )}
                          </div>

                          <div className="mt-1.5 flex items-center justify-between gap-1">
                            {!img.isPrimary ? (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(img.id)}
                                className="text-[10px] text-emerald-600 font-bold hover:underline"
                              >
                                Set Primary
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold">Main Image</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              className="text-rose-500 hover:text-rose-700 p-0.5"
                              title="Delete Image"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                    >
                      <ImageIcon className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click to upload product photos</p>
                      <p className="text-[10px] text-slate-400">PNG, JPG, WebP supported</p>
                    </div>
                  )}

                  {/* Fallback Image URL Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Or Add by Direct Image URL:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.image.trim()) return;
                          const newImg: ProductImage = {
                            id: `img-${Date.now()}`,
                            productId: editingProduct?.id || '',
                            url: formData.image.trim(),
                            filename: 'url_image.jpg',
                            mimeType: 'image/jpeg',
                            size: 0,
                            sortOrder: formData.images.length + 1,
                            isPrimary: formData.images.length === 0,
                            altText: formData.name || 'Product Image',
                            createdAt: new Date().toISOString(),
                          };
                          setFormData((prev) => ({
                            ...prev,
                            images: [...prev.images, newImg],
                          }));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 cursor-pointer"
                      >
                        Add to Gallery
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Product Description & Benefits
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Print Preview Modal (Requirement #33) */}
      {barcodePrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Thermal Label Generator
              </span>
              <button
                onClick={() => setBarcodePrintModal(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Printable Sticker Simulation */}
            <div className="my-6 rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-slate-900 shadow-xs">
              <p className="text-xs font-black tracking-tight uppercase">AHMAD HERBALS</p>
              <p className="mt-1 text-sm font-bold truncate">{barcodePrintModal.name}</p>
              <p className="text-xs font-black text-emerald-700">
                Price: {formatCurrency(barcodePrintModal.salePrice)}
              </p>

              {/* Barcode visual lines */}
              <div className="my-3 flex items-center justify-center gap-0.5 h-12 bg-slate-50 p-1 rounded">
                <div className="h-full w-1 bg-black"></div>
                <div className="h-full w-0.5 bg-black"></div>
                <div className="h-full w-2 bg-black"></div>
                <div className="h-full w-1 bg-black"></div>
                <div className="h-full w-3 bg-black"></div>
                <div className="h-full w-1 bg-black"></div>
                <div className="h-full w-0.5 bg-black"></div>
                <div className="h-full w-2 bg-black"></div>
                <div className="h-full w-1.5 bg-black"></div>
                <div className="h-full w-0.5 bg-black"></div>
                <div className="h-full w-3 bg-black"></div>
                <div className="h-full w-1 bg-black"></div>
              </div>
              <p className="font-mono text-xs tracking-widest font-bold">
                {barcodePrintModal.barcode}
              </p>
              <p className="text-[9px] text-slate-500 mt-1">SKU: {barcodePrintModal.sku}</p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-black cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                <Printer className="h-4 w-4" />
                <span>Print Thermal Barcode</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
