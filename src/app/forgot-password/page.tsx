"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSecurityQuestion, resetPassword } from "@/lib/auth";

type Step = "username" | "answer" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = getSecurityQuestion(username);
    if (result.success && result.question) {
      setSecurityQuestion(result.question);
      setStep("answer");
    } else {
      setError(result.error ?? "Account not found");
    }
    setLoading(false);
  }

  function handleAnswerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!securityAnswer.trim()) {
      setError("Please enter your answer");
      return;
    }
    setStep("reset");
  }

  function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = resetPassword(username, securityAnswer, newPassword);
    if (result.success) {
      setStep("done");
    } else {
      setError(result.error ?? "Failed to reset password");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          {step === "done" ? (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your password has been reset successfully.
              </p>
              <Button onClick={() => router.push("/login")}>
                Go to Login
              </Button>
            </div>
          ) : step === "username" ? (
            <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Enter your username to reset your password.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Looking up..." : "Continue"}
              </Button>
              <Link
                href="/login"
                className="text-center text-sm text-primary hover:underline"
              >
                Back to login
              </Link>
            </form>
          ) : step === "answer" ? (
            <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Answer your security question to reset your password.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label>Security Question</Label>
                <p className="text-sm font-medium">{securityQuestion}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="answer">Your Answer</Label>
                <Input
                  id="answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                Verify Answer
              </Button>
              <Link
                href="/login"
                className="text-center text-sm text-primary hover:underline"
              >
                Back to login
              </Link>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Create a new password for your account.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
              <Link
                href="/login"
                className="text-center text-sm text-primary hover:underline"
              >
                Back to login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
