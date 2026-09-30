import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Download,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Plus,
  Trash2,
  Loader2,
  Layers,
  Sparkles
} from 'lucide-react';
import { compressImageWithCanvas, formatFileSize } from '@/lib/imageCompressor';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// Robust CSV parser supporting quotes, commas, and multiline values
function parseCSV(text) {
  const lines = [];
  let row = [''];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      if (row.length > 1 || row[0] !== '') {
        lines.push(row);
      }
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, '_'));
  return lines.slice(1).map((values, rowIdx) => {
    const obj = { _rowId: `row_${Date.now()}_${rowIdx}` };
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    return obj;
  });
}

export default function BulkProductUploadModal({
  open,
  onOpenChange,
  collections = [],
  token,
  onSuccess
}) {
  const [step, setStep] = useState('upload'); // 'upload' | 'preview'
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [imageMap, setImageMap] = useState({}); // { [normalizedFilename]: { file, previewUrl, originalSize, compressedSize } }
  const [compressing, setCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState({ current: 0, total: 0, text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0, text: '' });
  const [totalOrigSize, setTotalOrigSize] = useState(0);
  const [totalCompSize, setTotalCompSize] = useState(0);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Normalize filenames for easy matching
  const normalizeKey = (name) => {
    return (name || '').toLowerCase().trim().replace(/\\/g, '/').split('/').pop();
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const collNames = collections.map(c => c.name).join(' | ') || 'Festive Wear | Saree | Kurtis';
    const csvContent = [
      'name,collection_name,price,discount_price,sizes,color,quantity,description,is_trending,is_new_arrival,is_best_seller,images',
      `"Floral Cotton Anarkali Kurti","${collections[0]?.name || 'Festive Wear'}",2499,1999,"S, M, L, XL","Maroon",20,"Pure cotton hand-block printed anarkali with dupatta",true,true,false,"anarkali-1.jpg, anarkali-2.jpg"`,
      `"Embroidered Georgette Saree","${collections[1]?.name || collections[0]?.name || 'Saree'}",3899,2999,"Free Size","Royal Blue",15,"Heavy zardozi embroidered designer saree with silk blouse piece",false,true,true,"saree-front.jpg, saree-pallu.jpg"`,
      `"Velvet Party Wear Gown","${collections[0]?.name || 'Kurtis'}",4999,3999,"M, L, XL, XXL","Emerald Green",10,"Premium velvet evening gown with sequin embellishments",true,false,false,"gown.jpg"`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vs_fashion_bulk_products_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sample CSV template downloaded');
  };

  // Handle CSV file selection
  const handleCSVChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid .csv file');
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const rawRows = parseCSV(text);
        if (rawRows.length === 0) {
          toast.error('The CSV file appears to be empty or missing data rows');
          return;
        }

        // Map to structured product rows
        const formatted = rawRows.map((r, idx) => {
          // Attempt collection match
          let matchedCollId = '';
          const collName = r.collection_name || r.collection || '';
          if (collName) {
            const found = collections.find(
              c => c.name.toLowerCase().trim() === collName.toLowerCase().trim()
            );
            if (found) matchedCollId = found.id;
          }
          if (!matchedCollId && collections.length > 0) {
            matchedCollId = collections[0].id;
          }

          // Parse image filenames
          const imgList = (r.images || r.image_filenames || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

          return {
            _rowId: `row_${Date.now()}_${idx}`,
            name: r.name || '',
            collection_id: matchedCollId,
            collection_name: collName,
            price: r.price ? parseFloat(r.price) : 0,
            discount_price: r.discount_price ? parseFloat(r.discount_price) : '',
            sizes: r.sizes || 'S, M, L, XL',
            color: r.color || 'Default',
            quantity: r.quantity ? parseInt(r.quantity, 10) : 10,
            description: r.description || '',
            is_trending: r.is_trending === 'true' || r.is_trending === '1',
            is_new_arrival: r.is_new_arrival === 'true' || r.is_new_arrival === '1',
            is_best_seller: r.is_best_seller === 'true' || r.is_best_seller === '1',
            imageFilenames: imgList,
            attachedImages: [] // populated when images are uploaded/matched
          };
        });

        setParsedRows(formatted);
        toast.success(`Loaded ${formatted.length} products from CSV`);
      } catch (err) {
        console.error('CSV parse error:', err);
        toast.error('Failed to parse CSV file. Please check format.');
      }
    };
    reader.readAsText(file);
  };

  // Process & Compress Images via Canvas
  const handleImagesSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setCompressing(true);
    setCompressProgress({ current: 0, total: files.length, text: 'Starting Canvas compression...' });

    let newMap = { ...imageMap };
    let addedOrig = 0;
    let addedComp = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setCompressProgress({
        current: i + 1,
        total: files.length,
        text: `Compressing ${f.name} with Canvas... (${i + 1}/${files.length})`
      });

      try {
        const result = await compressImageWithCanvas(f, {
          targetMaxBytes: 2.5 * 1024 * 1024, // 2.5 MB target
          maxDimension: 2200,
          initialQuality: 0.90
        });

        const key = normalizeKey(f.name);
        newMap[key] = result;
        addedOrig += result.originalSize;
        addedComp += result.compressedSize;
      } catch (err) {
        console.error(`Error compressing ${f.name}:`, err);
      }
    }

    setTotalOrigSize(prev => prev + addedOrig);
    setTotalCompSize(prev => prev + addedComp);
    setImageMap(newMap);
    setCompressing(false);

    // Auto-link newly added images to parsed rows
    autoMatchImages(newMap, parsedRows);

    const savedPct = addedOrig > 0 ? Math.round(((addedOrig - addedComp) / addedOrig) * 100) : 0;
    toast.success(
      `Canvas compressed ${files.length} images! Reduced ${formatFileSize(addedOrig)} → ${formatFileSize(addedComp)} (${savedPct}% saved)`
    );
  };

  // Match images to rows
  const autoMatchImages = (currImageMap, rows) => {
    const updated = rows.map(row => {
      const attached = [...(row.attachedImages || [])];

      // Match by listed filenames
      (row.imageFilenames || []).forEach(fname => {
        const key = normalizeKey(fname);
        if (currImageMap[key] && !attached.some(a => a.name === key)) {
          attached.push({ name: key, ...currImageMap[key] });
        }
      });

      // Also match if an image filename contains the row's product name slug
      if (attached.length === 0 && row.name) {
        const slug = row.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (slug.length >= 3) {
          Object.keys(currImageMap).forEach(key => {
            const cleanKey = key.replace(/[^a-z0-9]/g, '');
            if (cleanKey.includes(slug) && !attached.some(a => a.name === key)) {
              attached.push({ name: key, ...currImageMap[key] });
            }
          });
        }
      }

      return { ...row, attachedImages: attached };
    });

    setParsedRows(updated);
  };

  // Row update helper
  const handleUpdateRow = (rowId, field, value) => {
    setParsedRows(prev =>
      prev.map(r => (r._rowId === rowId ? { ...r, [field]: value } : r))
    );
  };

  // Remove attached image from a row
  const handleRemoveImageFromRow = (rowId, imgKey) => {
    setParsedRows(prev =>
      prev.map(r => {
        if (r._rowId !== rowId) return r;
        return {
          ...r,
          attachedImages: r.attachedImages.filter(img => img.name !== imgKey)
        };
      })
    );
  };

  // Manually attach an uploaded image to a row
  const handleAttachImageToRow = (rowId, imgKey) => {
    const imgObj = imageMap[imgKey];
    if (!imgObj) return;

    setParsedRows(prev =>
      prev.map(r => {
        if (r._rowId !== rowId) return r;
        if (r.attachedImages.some(a => a.name === imgKey)) return r;
        return {
          ...r,
          attachedImages: [...r.attachedImages, { name: imgKey, ...imgObj }].slice(0, 5)
        };
      })
    );
  };

  // Add a blank row
  const handleAddRow = () => {
    const newRow = {
      _rowId: `row_${Date.now()}_new`,
      name: '',
      collection_id: collections[0]?.id || '',
      collection_name: collections[0]?.name || '',
      price: 0,
      discount_price: '',
      sizes: 'S, M, L, XL',
      color: 'Default',
      quantity: 10,
      description: '',
      is_trending: false,
      is_new_arrival: true,
      is_best_seller: false,
      imageFilenames: [],
      attachedImages: []
    };
    setParsedRows(prev => [...prev, newRow]);
  };

  // Delete row
  const handleDeleteRow = (rowId) => {
    setParsedRows(prev => prev.filter(r => r._rowId !== rowId));
  };

  // Execute Bulk Save
  const handleSaveAll = async () => {
    if (parsedRows.length === 0) {
      toast.error('No products to upload');
      return;
    }

    // Validate rows
    const invalidRow = parsedRows.find(r => !r.name.trim() || !r.price || r.price <= 0);
    if (invalidRow) {
      toast.error(`Please provide a valid Name and Price for: "${invalidRow.name || 'Untitled Product'}"`);
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload compressed images to server and get URLs
      // Collect all distinct compressed files to upload
      const imagesToUpload = new Map();
      parsedRows.forEach(row => {
        (row.attachedImages || []).forEach(img => {
          if (!imagesToUpload.has(img.name) && img.file) {
            imagesToUpload.set(img.name, img.file);
          }
        });
      });

      const uploadedUrlMap = {};
      const imgEntries = Array.from(imagesToUpload.entries());
      let uploadedCount = 0;

      for (const [key, file] of imgEntries) {
        setSubmitProgress({
          current: uploadedCount + 1,
          total: imgEntries.length,
          text: `Uploading compressed image ${uploadedCount + 1}/${imgEntries.length}: ${key}...`
        });

        const formData = new FormData();
        formData.append('file', file);

        const res = await axios.post(`${API}/products/upload`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        uploadedUrlMap[key] = res.data.url;
        uploadedCount++;
      }

      // 2. Prepare payload for bulk product creation
      setSubmitProgress({
        current: 0,
        total: parsedRows.length,
        text: `Saving ${parsedRows.length} products to catalog...`
      });

      const productsPayload = parsedRows.map(row => {
        // Collect URLs for this product
        const finalImageUrls = (row.attachedImages || [])
          .map(img => uploadedUrlMap[img.name])
          .filter(Boolean);

        const sizesArr = (typeof row.sizes === 'string' ? row.sizes.split(',') : row.sizes)
          .map(s => s.trim())
          .filter(Boolean);

        const defaultSizes = sizesArr.length > 0 ? sizesArr : ['Free Size'];
        const qtyPerSize = Math.max(1, Math.floor(row.quantity / defaultSizes.length));
        const sizeQuantities = {};
        defaultSizes.forEach(s => {
          sizeQuantities[s] = qtyPerSize;
        });

        return {
          name: row.name.trim(),
          collection_id: row.collection_id,
          collection_name: row.collection_name,
          description: row.description || '',
          sizes: defaultSizes,
          color: row.color || 'Default',
          quantity: parseInt(row.quantity, 10) || 10,
          size_quantities: sizeQuantities,
          price: parseFloat(row.price),
          discount_price: row.discount_price ? parseFloat(row.discount_price) : null,
          is_trending: Boolean(row.is_trending),
          is_new_arrival: Boolean(row.is_new_arrival),
          is_best_seller: Boolean(row.is_best_seller),
          images: finalImageUrls,
          video_url: '',
          weight: 0.5
        };
      });

      // 3. Post to backend
      await axios.post(
        `${API}/products/bulk`,
        { products: productsPayload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Successfully uploaded ${productsPayload.length} products in bulk!`);
      if (onSuccess) onSuccess();
      onOpenChange(false);
      resetState();
    } catch (err) {
      console.error('Bulk save error:', err);
      toast.error(err.response?.data?.detail || 'Failed to save products in bulk. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setStep('upload');
    setCsvFile(null);
    setParsedRows([]);
    setImageMap({});
    setTotalOrigSize(0);
    setTotalCompSize(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const uploadedImageKeys = Object.keys(imageMap);
  const totalSavedPct = totalOrigSize > 0
    ? Math.round(((totalOrigSize - totalCompSize) / totalOrigSize) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-6xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#4A2836]/10 flex items-center justify-center text-[#4A2836]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-[#4A2836]" style={{ fontFamily: 'Playfair Display' }}>
                  Bulk Product Upload
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Upload multiple products at once via CSV with automatic Canvas image compression.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="border-[#4A2836] text-[#4A2836] hover:bg-[#4A2836]/10 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Sample CSV
            </Button>
          </div>
        </DialogHeader>

        {/* Compression Statistics Banner (if images were compressed) */}
        {uploadedImageKeys.length > 0 && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>HTML5 Canvas Compressor Active:</strong> {uploadedImageKeys.length} images processed.
                Original: <strong>{formatFileSize(totalOrigSize)}</strong> → Compressed: <strong>{formatFileSize(totalCompSize)}</strong>
              </span>
            </div>
            <span className="font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs">
              ⚡ {totalSavedPct}% storage & bandwidth saved
            </span>
          </div>
        )}

        {/* Upload Zone Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Step 1: CSV File Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-[#4A2836] transition-colors bg-gray-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                <FileSpreadsheet className="w-4 h-4 text-[#4A2836]" />
                <span>1. Select Product CSV File</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Upload your spreadsheet with columns: <code>name</code>, <code>collection_name</code>, <code>price</code>, <code>sizes</code>, <code>images</code>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVChange}
                className="hidden"
                id="bulk-csv-upload"
              />
              <label
                htmlFor="bulk-csv-upload"
                className="cursor-pointer inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {csvFile ? 'Change CSV' : 'Choose CSV File'}
              </label>

              {csvFile && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">{csvFile.name}</span>
                  <span className="text-gray-400">({parsedRows.length} items)</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Product Images with Canvas Compressor */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-[#4A2836] transition-colors bg-gray-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                <ImageIcon className="w-4 h-4 text-[#4A2836]" />
                <span>2. Select Product Images (Auto-Compressed)</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Select high-res photos. The <strong>Canvas Compressor</strong> automatically reduces size (under 2.5 MB) with 0 blur before upload.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImagesSelect}
                disabled={compressing}
                className="hidden"
                id="bulk-images-upload"
              />
              <label
                htmlFor="bulk-images-upload"
                className={`cursor-pointer inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-md bg-[#4A2836] text-white shadow-sm hover:bg-[#5A3846] ${
                  compressing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {compressing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Compressing...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {uploadedImageKeys.length > 0 ? 'Add More Images' : 'Choose Photos in Bulk'}
                  </>
                )}
              </label>

              {uploadedImageKeys.length > 0 && !compressing && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{uploadedImageKeys.length} images ready</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compression Spinner / Progress Indicator */}
        {compressing && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-xs text-amber-800">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">{compressProgress.text}</div>
              <div className="w-full bg-amber-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-amber-600 h-full transition-all duration-300"
                  style={{
                    width: `${(compressProgress.current / (compressProgress.total || 1)) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Submitting Progress Indicator */}
        {submitting && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-xs text-blue-800">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">{submitProgress.text}</div>
              <div className="w-full bg-blue-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{
                    width: `${((submitProgress.current) / (submitProgress.total || 1)) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Preview & Edit Table */}
        {parsedRows.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Products Review ({parsedRows.length} items)
                </h3>
                <p className="text-xs text-gray-500">
                  Review and customize product details before saving. Compressed images are matched automatically.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="text-xs border-dashed flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Blank Row
              </Button>
            </div>

            <div className="border rounded-lg overflow-x-auto max-h-[46vh] bg-white">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10 font-semibold border-b">
                  <tr>
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5 min-w-[180px]">Product Name *</th>
                    <th className="p-2.5 min-w-[140px]">Collection</th>
                    <th className="p-2.5 w-24">Price (₹) *</th>
                    <th className="p-2.5 w-24">Discount (₹)</th>
                    <th className="p-2.5 w-28">Sizes</th>
                    <th className="p-2.5 w-20">Stock</th>
                    <th className="p-2.5 min-w-[200px]">Compressed Images</th>
                    <th className="p-2.5 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parsedRows.map((row, idx) => {
                    const isMissingName = !row.name.trim();
                    const isMissingPrice = !row.price || row.price <= 0;

                    return (
                      <tr
                        key={row._rowId}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          isMissingName || isMissingPrice ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center text-gray-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Name */}
                        <td className="p-2">
                          <Input
                            value={row.name}
                            onChange={(e) => handleUpdateRow(row._rowId, 'name', e.target.value)}
                            placeholder="e.g. Cotton Kurti"
                            className={`h-8 text-xs ${isMissingName ? 'border-red-400 bg-red-50/30' : ''}`}
                          />
                        </td>

                        {/* Collection */}
                        <td className="p-2">
                          <select
                            value={row.collection_id}
                            onChange={(e) => handleUpdateRow(row._rowId, 'collection_id', e.target.value)}
                            className="w-full h-8 px-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#4A2836]"
                          >
                            {collections.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Price */}
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.price || ''}
                            onChange={(e) => handleUpdateRow(row._rowId, 'price', e.target.value)}
                            placeholder="1999"
                            className={`h-8 text-xs ${isMissingPrice ? 'border-red-400 bg-red-50/30' : ''}`}
                          />
                        </td>

                        {/* Discount Price */}
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.discount_price || ''}
                            onChange={(e) => handleUpdateRow(row._rowId, 'discount_price', e.target.value)}
                            placeholder="1499"
                            className="h-8 text-xs"
                          />
                        </td>

                        {/* Sizes */}
                        <td className="p-2">
                          <Input
                            value={row.sizes}
                            onChange={(e) => handleUpdateRow(row._rowId, 'sizes', e.target.value)}
                            placeholder="S, M, L"
                            className="h-8 text-xs"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.quantity || ''}
                            onChange={(e) => handleUpdateRow(row._rowId, 'quantity', e.target.value)}
                            placeholder="10"
                            className="h-8 text-xs"
                          />
                        </td>

                        {/* Images Thumbnails & Matching */}
                        <td className="p-2">
                          <div className="flex items-center gap-1.5 flex-wrap min-h-[32px]">
                            {(row.attachedImages || []).map((img, iIdx) => (
                              <div
                                key={img.name + iIdx}
                                className="relative group w-10 h-10 rounded border border-gray-300 overflow-hidden bg-gray-100 flex-shrink-0"
                                title={`${img.name} (${formatFileSize(img.compressedSize)})`}
                              >
                                <img
                                  src={img.previewUrl}
                                  alt={img.name}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImageFromRow(row._rowId, img.name)}
                                  className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}

                            {/* Dropdown to assign an uploaded image */}
                            {uploadedImageKeys.length > 0 && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAttachImageToRow(row._rowId, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                className="h-7 text-[11px] px-1 border border-dashed border-gray-300 rounded text-gray-600 bg-white hover:border-[#4A2836] cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>+ Attach Image</option>
                                {uploadedImageKeys.map(k => (
                                  <option key={k} value={k}>
                                    {k} ({formatFileSize(imageMap[k]?.compressedSize)})
                                  </option>
                                ))}
                              </select>
                            )}

                            {(row.attachedImages || []).length === 0 && uploadedImageKeys.length === 0 && (
                              <span className="text-[11px] text-gray-400 italic">No images yet</span>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row._rowId)}
                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                            title="Delete row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dialog Footer Actions */}
        <div className="mt-6 pt-4 border-t flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {parsedRows.length > 0 ? (
              <span>
                Ready to save <strong>{parsedRows.length}</strong> product{parsedRows.length > 1 ? 's' : ''}.
              </span>
            ) : (
              <span>Upload CSV and images above to begin.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting || compressing}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSaveAll}
              disabled={parsedRows.length === 0 || submitting || compressing}
              className="bg-[#4A2836] hover:bg-[#5A3846] text-white flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving All Products...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Save {parsedRows.length > 0 ? `${parsedRows.length} Products` : 'All'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
