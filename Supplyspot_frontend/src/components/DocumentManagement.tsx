import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Download, 
  Share2,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Upload,
  Trash2,
  Edit,
  Grid,
  List,
  Table as TableIcon
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const documents = [
  {
    id: 1,
    name: 'Software License Agreement.pdf',
    vendor: 'TechCorp Solutions',
    type: 'Contract',
    category: 'Legal',
    size: '2.4 MB',
    uploadDate: '2023-11-15',
    uploadedBy: 'John Smith',
    status: 'Approved',
    version: '1.0',
    tags: ['License', 'Software', 'Annual'],
    fileType: 'pdf',
    description: 'Annual software licensing agreement for 2024'
  },
  {
    id: 2,
    name: 'Invoice_NOV_2023.pdf',
    vendor: 'Global Supplies Ltd',
    type: 'Invoice',
    category: 'Financial',
    size: '1.2 MB',
    uploadDate: '2023-11-20',
    uploadedBy: 'Sarah Johnson',
    status: 'Pending Review',
    version: '1.0',
    tags: ['Invoice', 'November', 'Materials'],
    fileType: 'pdf',
    description: 'Monthly invoice for raw materials supply'
  },
  {
    id: 3,
    name: 'Vendor_Certification.jpg',
    vendor: 'Premium Services Inc',
    type: 'Certificate',
    category: 'Compliance',
    size: '856 KB',
    uploadDate: '2023-11-25',
    uploadedBy: 'Mike Wilson',
    status: 'Approved',
    version: '2.1',
    tags: ['Certificate', 'ISO', 'Quality'],
    fileType: 'image',
    description: 'ISO 9001 quality certification document'
  },
  {
    id: 4,
    name: 'Transport_Quote.xlsx',
    vendor: 'Quick Logistics',
    type: 'Quote',
    category: 'Financial',
    size: '445 KB',
    uploadDate: '2023-11-28',
    uploadedBy: 'Emily Davis',
    status: 'Under Review',
    version: '1.2',
    tags: ['Quote', 'Transportation', 'Q4'],
    fileType: 'spreadsheet',
    description: 'Transportation services quote for Q4 2023'
  },
  {
    id: 5,
    name: 'Infrastructure_Specs.docx',
    vendor: 'Digital Systems Co',
    type: 'Specification',
    category: 'Technical',
    size: '1.8 MB',
    uploadDate: '2023-12-01',
    uploadedBy: 'David Brown',
    status: 'Approved',
    version: '3.0',
    tags: ['Specs', 'Infrastructure', 'Cloud'],
    fileType: 'document',
    description: 'Technical specifications for cloud infrastructure'
  },
  {
    id: 6,
    name: 'Insurance_Policy.pdf',
    vendor: 'TechCorp Solutions',
    type: 'Insurance',
    category: 'Legal',
    size: '3.2 MB',
    uploadDate: '2023-12-03',
    uploadedBy: 'Lisa Anderson',
    status: 'Expired',
    version: '1.0',
    tags: ['Insurance', 'Policy', 'Liability'],
    fileType: 'pdf',
    description: 'General liability insurance policy document'
  }
];

export function DocumentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isViewDocumentOpen, setIsViewDocumentOpen] = useState(false);
  const [docViewMode, setDocViewMode] = useState<'card' | 'list' | 'table'>('table');

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending Review': return 'secondary';
      case 'Under Review': return 'outline';
      case 'Expired': return 'destructive';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
      case 'document': return <FileText className="w-5 h-5 text-red-500" />;
      case 'image': return <Image className="w-5 h-5 text-blue-500" />;
      case 'spreadsheet': return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setIsViewDocumentOpen(true);
  };

  const totalDocuments = documents.length;
  const pendingReview = documents.filter(doc => doc.status === 'Pending Review' || doc.status === 'Under Review').length;
  const approved = documents.filter(doc => doc.status === 'Approved').length;
  const expired = documents.filter(doc => doc.status === 'Expired').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Document Management</h1>
          <p className="text-muted-foreground">Manage vendor documents and files</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
              <DialogDescription>
                Upload a new document by selecting a file and filling out the details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground">Supports PDF, DOC, XLS, JPG, PNG up to 10MB</p>
                <Button variant="outline" className="mt-4">
                  Choose Files
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-vendor">Vendor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="techcorp">TechCorp Solutions</SelectItem>
                      <SelectItem value="global">Global Supplies Ltd</SelectItem>
                      <SelectItem value="premium">Premium Services Inc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-type">Document Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="quote">Quote</SelectItem>
                      <SelectItem value="specification">Specification</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-tags">Tags (comma separated)</Label>
                  <Input id="doc-tags" placeholder="contract, annual, software" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="doc-description">Description</Label>
                  <Input id="doc-description" placeholder="Document description" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsUploadOpen(false)}>
                Upload Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-semibold">{totalDocuments}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-semibold">{pendingReview}</p>
            </div>
            <Eye className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-semibold">{approved}</p>
            </div>
            <FileText className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expired/Rejected</p>
              <p className="text-2xl font-semibold">{expired}</p>
            </div>
            <FileText className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </Card>

      {/* View Toggle Buttons */}
      <div className="flex items-center border rounded-md w-fit">
        <Button
          variant={docViewMode === 'card' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setDocViewMode('card')}
          className="rounded-r-none"
        >
          <Grid className="w-4 h-4" />
        </Button>
        <Button
          variant={docViewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setDocViewMode('list')}
          className="rounded-none border-l border-r"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant={docViewMode === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setDocViewMode('table')}
          className="rounded-l-none"
        >
          <TableIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Card View */}
      {docViewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
          <Card key={document.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              {/* Document Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getFileTypeIcon(document.fileType)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" title={document.name}>
                      {document.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{document.size}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDocument(document)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Info
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Document Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vendor:</span>
                  <span className="text-sm font-medium">{document.vendor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="text-xs">{document.type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <span className="text-sm">{document.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={getStatusColor(document.status)} className="text-xs">
                    {document.status}
                  </Badge>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {document.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {document.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{document.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Upload Info */}
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <p>Uploaded by {document.uploadedBy}</p>
                <p>{document.uploadDate} • v{document.version}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* List View */}
      {docViewMode === 'list' && (
        <div className="space-y-3">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getFileTypeIcon(document.fileType)}
                    <p className="font-semibold">{document.name}</p>
                    <Badge variant={document.status === 'Approved' ? 'default' : 'secondary'}>
                      {document.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{document.vendor}</span>
                    <span>{document.type}</span>
                    <span>{document.uploadDate}</span>
                    <span>{document.size}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedDocument(document)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {docViewMode === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Document Details</th>
                  <th className="text-left p-4 font-medium">Vendor</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Upload Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getFileTypeIcon(document.fileType)}
                        <div>
                          <p className="font-medium">{document.name}</p>
                          <p className="text-xs text-muted-foreground">{document.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{document.vendor}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{document.type}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{document.category}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{document.uploadDate}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={document.status === 'Approved' ? 'default' : 'secondary'}>
                        {document.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedDocument(document)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Document Detail Modal */}
      <Dialog open={isViewDocumentOpen} onOpenChange={setIsViewDocumentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              View detailed information about this document.
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                {getFileTypeIcon(selectedDocument.fileType)}
                <div>
                  <p className="font-medium">{selectedDocument.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDocument.size}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor</Label>
                  <p className="text-sm mt-1">{selectedDocument.vendor}</p>
                </div>
                <div>
                  <Label>Document Type</Label>
                  <p className="text-sm mt-1">{selectedDocument.type}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="text-sm mt-1">{selectedDocument.category}</p>
                </div>
                <div>
                  <Label>Version</Label>
                  <p className="text-sm mt-1">v{selectedDocument.version}</p>
                </div>
                <div>
                  <Label>Upload Date</Label>
                  <p className="text-sm mt-1">{selectedDocument.uploadDate}</p>
                </div>
                <div>
                  <Label>Uploaded By</Label>
                  <p className="text-sm mt-1">{selectedDocument.uploadedBy}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(selectedDocument.status)}>
                      {selectedDocument.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>File Size</Label>
                  <p className="text-sm mt-1">{selectedDocument.size}</p>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1">{selectedDocument.description}</p>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedDocument.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="outline" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <Button variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Info
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}