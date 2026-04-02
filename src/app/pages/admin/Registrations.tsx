import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Search, Download, Filter, MessageCircle, Eye, RefreshCw, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { apiFetch, API_BASE_URL, getAuthToken } from "../../../api/client";
import { useEvents } from "../../context/EventsContext";
import { toast } from "sonner";
import { Label } from "../../components/ui/label";

export function Registrations() {
  const { events } = useEvents();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

  // View Modal
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // WhatsApp Modal
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [waEventId, setWaEventId] = useState("");
  const [waLink, setWaLink] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/registrations?limit=1000');
      if (res.success) {
        setRegistrations(res.data || []);
      } else {
        toast.error("Failed to load registrations");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.phone?.includes(searchTerm) ||
      reg.eventName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || reg.paymentStatus === statusFilter;
      
    const matchesEvent =
      eventFilter === "all" || reg.eventId === eventFilter;

    return matchesSearch && matchesStatus && matchesEvent;
  });
  
  const stats = {
    total: registrations.length,
    paid: registrations.filter(r => r.paymentStatus === 'paid').length,
    pending: registrations.filter(r => r.paymentStatus === 'pending').length,
  };

  const handleExport = () => {
    let url = `${API_BASE_URL}/registrations/export`;
    if (eventFilter !== "all") {
      url += `?eventId=${eventFilter}`;
    }
    // Better way: Fetch the CSV with auth headers, then create object URL
    toast.loading("Preparing CSV export...", { id: "export" });
    
    const token = getAuthToken();
    
    fetch(url, {
        headers: {
             'Authorization': token ? `Bearer ${token}` : ''
        }
    })
    .then(res => res.blob())
    .then(blob => {
        toast.dismiss("export");
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = `registrations_${new Date().getTime()}.csv`;
        a.click();
    })
    .catch(err => {
        toast.error("Failed to export", { id: "export" });
    });
  };

  const handleUpdatePaymentStatus = async (regId: string, newStatus: string) => {
      setUpdatingPayment(true);
      try {
         const res = await apiFetch(`/registrations/${regId}/payment`, {
             method: 'PATCH',
             body: JSON.stringify({ paymentStatus: newStatus })
         });
         
         if (res.success) {
             toast.success(`Payment marked as ${newStatus}`);
             setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, paymentStatus: newStatus } : r));
             if (selectedReg && selectedReg.id === regId) {
                 setSelectedReg({ ...selectedReg, paymentStatus: newStatus });
             }
         } else {
             toast.error(res.message || "Failed to update status");
         }
      } catch (err) {
         toast.error("Network error");
      } finally {
         setUpdatingPayment(false);
      }
  };

  const handleDeleteRegistration = async (regId: string) => {
      if (!confirm("Are you sure you want to completely delete this registration? This cannot be undone.")) return;
      
      try {
         const res = await apiFetch(`/registrations/${regId}`, {
            method: "DELETE"
         });
         
         if (res.success) {
             toast.success("Registration deleted.");
             setRegistrations(prev => prev.filter(r => r.id !== regId));
         } else {
             toast.error(res.message || "Failed to delete registration");
         }
      } catch (err) {
         toast.error("Network error");
      }
  };

  const handleSendWhatsappInvites = async () => {
      if (!waEventId) return toast.error("Please select an event");
      if (!waLink) return toast.error("Please enter the WhatsApp link");
      
      setSendingInvite(true);
      try {
         const res = await apiFetch('/registrations/invite-whatsapp', {
             method: 'POST',
             body: JSON.stringify({ eventId: waEventId, link: waLink })
         });
         
         if (res.success) {
             toast.success(res.message || "Invitations queued!");
             setIsWhatsappModalOpen(false);
             setWaLink("");
             setWaEventId("");
         } else {
             toast.error(res.message || "Failed to trigger invites");
         }
      } catch (err) {
          toast.error("Network error");
      } finally {
          setSendingInvite(false);
      }
  };

  const openViewModal = (reg: any) => {
      setSelectedReg(reg);
      setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3057] dark:text-white mb-2">
            Registrations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all event registrations
          </p>
        </div>
        
        <div className="flex gap-3 mt-4 sm:mt-0">
            <Button
              className="bg-[#25D366] hover:bg-[#128C7E] text-white whitespace-nowrap"
              onClick={() => setIsWhatsappModalOpen(true)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp Invite
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="whitespace-nowrap"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Registrations
            </p>
            <p className="text-3xl font-bold text-[#0F3057] dark:text-white">
              {stats.total}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Paid
            </p>
            <p className="text-3xl font-bold text-green-600">
              {stats.paid}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Pending
            </p>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>All Registrations</CardTitle>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial md:w-56">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search name, phone, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map(ev => (
                      <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration Info</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Loading registrations...
                        </TableCell>
                    </TableRow>
                ) : filteredRegistrations.length > 0 ? (
                  filteredRegistrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                         <div className="font-medium text-[#0F3057] dark:text-gray-200">{reg.name}</div>
                         <div className="text-xs text-gray-500">{reg.email}</div>
                         <div className="text-xs text-gray-500">{reg.phone}</div>
                         <div className="text-xs text-gray-400 mt-1">ID: {reg.registrationNumber || reg.id}</div>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                          <div className="truncate font-medium">{reg.eventName}</div>
                          <div className="text-xs text-gray-400">
                             {new Date(reg.registeredAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                             })}
                          </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-700 dark:text-gray-300">
                          ₹{reg.amount || 0}
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1 items-start">
                            <Badge
                              className={
                                reg.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                                  : reg.paymentStatus === "pending"
                                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                                  : "bg-red-100 text-red-700 hover:bg-red-100"
                              }
                            >
                              {reg.paymentStatus}
                            </Badge>
                            {reg.paymentMethod && <span className="text-[10px] uppercase text-gray-400 font-bold">{reg.paymentMethod}</span>}
                         </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                          <Button 
                             variant="secondary" 
                             size="sm"
                             className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 mr-2"
                             onClick={() => openViewModal(reg)}
                          >
                             <Eye className="w-4 h-4 mr-2" /> View
                          </Button>
                          <Button 
                             variant="destructive" 
                             size="sm"
                             className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border-none shadow-none"
                             onClick={() => handleDeleteRegistration(reg.id)}
                          >
                             <Trash2 className="w-4 h-4" />
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-gray-500"
                    >
                      No registrations found matching filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Registration Detail View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
           <DialogHeader>
               <DialogTitle>Registration Details</DialogTitle>
           </DialogHeader>
           {selectedReg && (
               <div className="space-y-6 mt-4">
                  {/* User Profile */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <div>
                          <Label className="text-gray-500">Name</Label>
                          <p className="font-semibold">{selectedReg.name}</p>
                      </div>
                      <div>
                          <Label className="text-gray-500">Email</Label>
                          <p className="font-semibold">{selectedReg.email}</p>
                      </div>
                      <div>
                          <Label className="text-gray-500">Phone</Label>
                          <p className="font-semibold">{selectedReg.phone}</p>
                      </div>
                      <div>
                          <Label className="text-gray-500">Emergency Contact</Label>
                          <p className="font-semibold">{selectedReg.emergencyContact || 'None'}</p>
                      </div>
                      <div className="col-span-2">
                          <Label className="text-gray-500">Dietary Restrictions</Label>
                          <p className="font-semibold">{selectedReg.dietaryRestrictions || 'None'}</p>
                      </div>
                      <div className="col-span-2">
                          <Label className="text-gray-500">Health Conditions</Label>
                          <p className="font-semibold">{selectedReg.medicalConditions || 'None'}</p>
                      </div>
                  </div>
                  
                  {/* Payment Verification */}
                  <div>
                      <h4 className="font-bold text-lg mb-3">Payment Information</h4>
                      <div className="flex items-center gap-4 mb-4">
                          <Badge className={selectedReg.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                              STATUS: {selectedReg.paymentStatus.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-gray-600">METHOD: {selectedReg.paymentMethod?.toUpperCase()}</Badge>
                      </div>
                      
                      {selectedReg.paymentId && selectedReg.paymentMethod === 'razorpay' && (
                           <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-sm font-mono">
                               Razorpay TXN ID: {selectedReg.paymentId}
                           </div>
                      )}
                      
                      {selectedReg.paymentScreenshot && (
                          <div className="mt-4 border rounded-xl overflow-hidden bg-gray-100 w-full flex justify-center">
                              <img src={selectedReg.paymentScreenshot} className="max-w-full max-h-[300px] object-contain" alt="Payment Proof" />
                          </div>
                      )}
                      
                      {/* Approval Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Button 
                             className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                             disabled={updatingPayment || selectedReg.paymentStatus === 'paid'}
                             onClick={() => handleUpdatePaymentStatus(selectedReg.id, 'paid')}
                          >
                             <CheckCircle className="w-4 h-4 mr-2" /> Mark as Paid
                          </Button>
                          <Button 
                             className="flex-1 bg-red-600 hover:bg-red-700 text-white" 
                             disabled={updatingPayment || selectedReg.paymentStatus === 'failed'}
                             onClick={() => handleUpdatePaymentStatus(selectedReg.id, 'failed')}
                          >
                             <XCircle className="w-4 h-4 mr-2" /> Mark Failed
                          </Button>
                      </div>
                  </div>
               </div>
           )}
        </DialogContent>
      </Dialog>
      
      {/* WhatsApp Invite Modal */}
      <Dialog open={isWhatsappModalOpen} onOpenChange={setIsWhatsappModalOpen}>
          <DialogContent className="sm:max-w-[450px]">
             <DialogHeader>
                 <DialogTitle className="flex items-center gap-2">
                     <MessageCircle className="text-[#25D366] w-5 h-5" /> 
                     Bulk WhatsApp Invite
                 </DialogTitle>
             </DialogHeader>
             
             <div className="space-y-5 mt-4">
                 <p className="text-sm text-gray-600">
                     Select an event and paste your WhatsApp group link. This will automatically generate and send a formatted HTML email to all users registered for that event instructing them to join.
                 </p>
                 
                 <div className="space-y-2">
                     <Label>Target Event</Label>
                     <Select value={waEventId} onValueChange={setWaEventId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Event..." />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map(ev => (
                              <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                 </div>
                 
                 <div className="space-y-2">
                     <Label>WhatsApp Group Link</Label>
                     <Input 
                        placeholder="https://chat.whatsapp.com/..." 
                        value={waLink}
                        onChange={(e) => setWaLink(e.target.value)}
                     />
                 </div>
                 
                 <Button 
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                    disabled={sendingInvite}
                    onClick={handleSendWhatsappInvites}
                 >
                     {sendingInvite ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
                     {sendingInvite ? "Firing Broadcast..." : "Send Invite Blast"}
                 </Button>
             </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}
