import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import logoImg from "../../../assets/84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png";

import { apiFetch, setAuthToken } from "../../../api/client";

export function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (res.success && res.token) {
        setAuthToken(res.token);
        toast.success("Login successful!");
        navigate("/admin/dashboard");
      } else {
        toast.error(res.message || "Invalid credentials");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F3057] to-[#4B0082] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoImg} alt="Mor Events" className="h-16 w-16" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F3057]">Admin Login</h1>
            <p className="text-gray-600">Sign in to access the dashboard</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@morevents.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#0F3057] hover:bg-[#008080] text-white"
              size="lg"
            >
              Login
            </Button>
          </form>
          <div className="mt-4 text-center">
            <a href="/" className="text-sm text-gray-600 hover:text-[#008080]">
              ← Back to Website
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
