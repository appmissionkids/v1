import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function HomePage() {
  const { user } = useAuth();

  if (!user) return <Redirect to="/auth" />;

  // Redirect to appropriate dashboard based on role
  if (user.role === "parent") {
    return <Redirect to="/parent" />;
  } else {
    return <Redirect to="/child" />;
  }
}
