import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { useAuth } from "../context/AuthContext";
import logoImg from "../../assets/84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F3057] to-[#008080] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoImg} alt="Mor Events" className="h-16 w-16" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F3057]">Sign In to Mor Events</h1>
            <p className="text-gray-600">
              Sign in to view your tickets, manage your traveler profile, and receive event updates.
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <GoogleSignInButton onSuccess={() => navigate(from, { replace: true })} />
          <p className="text-xs text-gray-400 text-center max-w-xs">
            By continuing, you agree to Mor Events'{" "}
            <Link to="/terms" className="underline hover:text-[#008080]">
              Terms
            </Link>
            .
          </p>
          <Link to="/" className="text-sm text-gray-600 hover:text-[#008080] mt-2">
            ← Back to Website
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
