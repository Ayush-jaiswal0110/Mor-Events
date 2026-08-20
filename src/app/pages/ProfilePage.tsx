import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setError(null);
    try {
      setIsSaving(true);
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Couldn't save your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#0F3057] mb-6">Profile Settings</h1>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="h-14 w-14 rounded-full" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-[#0F3057] text-white flex items-center justify-center text-xl font-bold">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div>
            <CardTitle>{user?.name}</CardTitle>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled />
              <p className="text-xs text-gray-400">Managed by your Google account — can't be changed here.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 00000 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
              />
            </div>
            <Button type="submit" disabled={isSaving} className="w-full bg-[#0F3057] hover:bg-[#008080] text-white">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
