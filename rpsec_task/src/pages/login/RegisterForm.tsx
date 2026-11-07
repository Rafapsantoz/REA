import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleAlert, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { EMAIL_PATTERN } from "@/lib/validation";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name."),
  email: z.string().trim().regex(EMAIL_PATTERN, "Enter a valid email address."),
  password: z.string().min(6, "Passwords have at least 6 characters."),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await registerUser(values.name, values.email, values.password);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    navigate("/board", { replace: true });
  });

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-name">Name</Label>
        <Input
          id="register-name"
          autoComplete="name"
          placeholder="Your name"
          className="h-9"
          {...form.register("name")}
        />
        {errors.name && (
          <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="h-9"
          {...form.register("email")}
        />
        {errors.email && (
          <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          className="h-9"
          {...form.register("password")}
        />
        {errors.password && (
          <p className="text-xs font-medium text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {formError && (
        <p className="flex items-start gap-1.5 text-[13px] font-medium leading-snug text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {formError}
        </p>
      )}

      <Button type="submit" className="h-9 w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Create account
      </Button>

      <p className="text-2xs leading-relaxed text-muted-foreground">
        A fresh account starts with an empty board. The demo account holds example
        demands so you can see the board in action.
      </p>
    </form>
  );
}
