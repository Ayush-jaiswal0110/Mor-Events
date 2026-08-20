import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { apiFetch } from "../../../api/client";
import { 
  Users, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  Copy, 
  Check, 
  Search,
  MessageSquare,
  RefreshCw,
  Edit2,
  Trash2,
  Play,
  X,
  Save
} from "lucide-react";

export function ManageWhatsApp() {
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Editing state variables
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPhoneValue, setEditPhoneValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    failed: 0,
    initiated: 0
  });

  const webhookUrl = `${window.location.origin.replace("5173", "8000")}/api/whatsapp/webhook`;
  const verifyToken = "morevents_whatsapp_verify_token_2026";

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/admin/whatsapp/members?limit=100");
      if (res.success) {
        setMembers(res.data);
        
        // Calculate statistics
        const totals = {
          total: res.data.length,
          pending: res.data.filter((m: any) => m.whatsappStatus === "pending").length,
          active: res.data.filter((m: any) => m.whatsappStatus === "active").length,
          failed: res.data.filter((m: any) => m.whatsappStatus === "failed").length,
          initiated: res.data.filter((m: any) => m.whatsappStatus === "initiated").length
        };
        setStats(totals);
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleBroadcast = async () => {
    if (stats.pending === 0 && stats.failed === 0) {
      alert("No pending or failed members to broadcast to.");
      return;
    }

    setIsBroadcasting(true);
    setBroadcastMessage("");
    try {
      const res = await apiFetch("/admin/whatsapp/broadcast", {
        method: "POST"
      });
      if (res.success) {
        setBroadcastMessage(res.message);
        fetchMembers(); // refresh
      } else {
        setBroadcastMessage("Failed to initiate broadcast.");
      }
    } catch (err: any) {
      setBroadcastMessage(err.message || "An error occurred during broadcast.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const copyToClipboard = (text: string, type: "url" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // Inline edit handlers
  const handleStartEdit = (member: any) => {
    setEditingId(member.id);
    setEditPhoneValue(member.phone);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPhoneValue("");
  };

  const handleSaveEdit = async (memberId: string) => {
    if (!editPhoneValue) {
      alert("Phone number is required.");
      return;
    }
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/admin/whatsapp/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ phone: editPhoneValue })
      });
      if (res.success) {
        setEditingId(null);
        setEditPhoneValue("");
        fetchMembers(); // refresh list
      }
    } catch (err: any) {
      alert(err.message || "Failed to update phone number.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      const res = await apiFetch(`/admin/whatsapp/members/${memberId}/delete`, {
        method: "DELETE"
      });
      if (res.success) {
        fetchMembers(); // refresh
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete member.");
    }
  };

  const handleRetryMember = async (memberId: string) => {
    try {
      const res = await apiFetch(`/admin/whatsapp/members/${memberId}/retry`, {
        method: "POST"
      });
      alert(res.message || "Retry welcome broadcast completed.");
      fetchMembers(); // refresh status
    } catch (err: any) {
      alert(err.message || "Failed to retry welcome broadcast.");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3.5 h-3.5" /> Active (Replied)
          </span>
        );
      case "initiated":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Send className="w-3.5 h-3.5" /> Initiated
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <HelpCircle className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3057] dark:text-white mb-2 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-teal-500" /> WhatsApp Members Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your lifetime WhatsApp members, check connection statuses, and broadcast template greeting messages.
          </p>
        </div>
        <Button
          onClick={fetchMembers}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh List
        </Button>
      </div>

      {/* Meta Webhook Setup Reference Card */}
      <Card className="bg-[#0F3057]/5 dark:bg-white/[0.02] border-teal-500/20">
        <CardHeader>
          <CardTitle className="text-lg text-[#0F3057] dark:text-white">Meta Webhooks Setup Config</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Copy and paste these configuration values into the <strong>WhatsApp Configuration</strong> section of the Meta Developers Console.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Callback URL</label>
              <div className="flex items-center bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg overflow-hidden">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 select-all font-mono"
                />
                <button
                  onClick={() => copyToClipboard(webhookUrl, "url")}
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 border-l dark:border-gray-700 transition-colors"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Verify Token</label>
              <div className="flex items-center bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg overflow-hidden">
                <input
                  type="text"
                  readOnly
                  value={verifyToken}
                  className="flex-1 px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 select-all font-mono"
                />
                <button
                  onClick={() => copyToClipboard(verifyToken, "token")}
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 border-l dark:border-gray-700 transition-colors"
                >
                  {copiedToken ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats and Action Row */}
      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Statistics Cards */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-sm font-semibold text-gray-500">Total Members</p>
              <h3 className="text-3xl font-bold mt-1 text-[#0F3057] dark:text-white">{stats.total}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-sm font-semibold text-amber-500">Pending & Failed</p>
              <h3 className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-500">{stats.pending + stats.failed}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-sm font-semibold text-blue-500">Welcome Sent</p>
              <h3 className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-500">{stats.initiated}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-sm font-semibold text-green-500">Active Chats</p>
              <h3 className="text-3xl font-bold mt-1 text-green-600 dark:text-green-500">{stats.active}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Broadcast Action Card */}
        <Card className="md:col-span-4 border-teal-500/30 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Broadcast Welcome</CardTitle>
          </CardHeader>
          <CardContent className="pb-6 flex-1 flex flex-col justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Trigger Meta WhatsApp template greetings to all <strong>{stats.pending + stats.failed} pending & failed</strong> members.
            </p>
            
            {broadcastMessage && (
              <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold">
                {broadcastMessage}
              </div>
            )}

            <Button
              onClick={handleBroadcast}
              disabled={isBroadcasting || (stats.pending === 0 && stats.failed === 0)}
              className="w-full bg-gradient-to-r from-teal-500 to-[#0F3057] hover:from-teal-400 hover:to-[#17467e] text-white flex items-center justify-center gap-2"
            >
              {isBroadcasting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Broadcasting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Trigger Welcome Broadcast
                </>
              )}
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Members List Table Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl">Lifetime WhatsApp Members</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, phone or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border dark:border-gray-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-3 border-b dark:border-gray-700">Name</th>
                  <th className="px-6 py-3 border-b dark:border-gray-700">Phone</th>
                  <th className="px-6 py-3 border-b dark:border-gray-700">Email</th>
                  <th className="px-6 py-3 border-b dark:border-gray-700">Status</th>
                  <th className="px-6 py-3 border-b dark:border-gray-700">Registration Date</th>
                  <th className="px-6 py-3 border-b dark:border-gray-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-250 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0F3057] dark:text-white" />
                      <p className="text-xs text-gray-400 mt-2">Loading WhatsApp members...</p>
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                      No registered members found.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{member.name}</td>
                      <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">
                        {editingId === member.id ? (
                          <input
                            type="text"
                            value={editPhoneValue}
                            onChange={(e) => setEditPhoneValue(e.target.value)}
                            className="px-2 py-1 text-sm border dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                            disabled={isUpdating}
                          />
                        ) : (
                          member.phone
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{member.email || "—"}</td>
                      <td className="px-6 py-4">{getStatusBadge(member.whatsappStatus)}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {member.registeredAt ? new Date(member.registeredAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 justify-center">
                          {editingId === member.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(member.id)}
                                className="p-1.5 hover:bg-green-500/10 text-green-500 rounded transition-colors"
                                title="Save"
                                disabled={isUpdating}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 hover:bg-gray-500/10 text-gray-500 rounded transition-colors"
                                title="Cancel"
                                disabled={isUpdating}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(member)}
                                className="p-1.5 hover:bg-teal-500/10 text-teal-500 dark:text-teal-400 rounded transition-colors"
                                title="Edit Phone Number"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {(member.whatsappStatus === "failed" || member.whatsappStatus === "pending") && (
                                <button
                                  onClick={() => handleRetryMember(member.id)}
                                  className="p-1.5 hover:bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded transition-colors"
                                  title="Re-initiate welcome template broadcast"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded transition-colors"
                                title="Delete Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
