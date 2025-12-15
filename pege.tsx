
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import Link from 'next/link';
import { BrainCircuit, LogIn, Mail, KeyRound, Eye, EyeOff, UserPlus, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { loginUser } from '@/app/actions/auth-actions';

const REMEMBER_ME_KEY = 'eduAIRememberMe';
const REMEMBERED_EMAIL_KEY = 'eduAIRememberedEmail';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    const shouldRemember = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    if (shouldRemember && rememberedEmail) {
      form.setValue('email', rememberedEmail);
      form.setValue('rememberMe', true);
    }
  }, [form]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await loginUser(data);
      if (result.success) {
        toast({
          title: 'Login Successful!',
          description: 'Redirecting to dashboard...',
        });
        if (data.rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
          localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
        router.push('/dashboard');
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || "Invalid email or password.",
          variant: 'destructive',
        });
      }
    } catch (error) {
       toast({
        title: 'Login Error',
        description: 'An unexpected error occurred during login.',
        variant: 'destructive',
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-4 bg-gradient-to-tr from-sky-100 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-sky-950 dark:to-indigo-950 min-h-screen">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex flex-col items-center justify-center mb-3">
            <BrainCircuit className="h-20 w-20 text-primary" />
            <CardTitle className="text-4xl font-headline text-primary mt-2">EduAI</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground text-lg px-4">
            Your intelligent learning assistant. Login to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-8 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Email Address</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                          disabled={isLoading}
                          className="bg-background/70 focus:ring-primary/80 pl-10 text-base py-3"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Password</FormLabel>
                     <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...field}
                            disabled={isLoading}
                            className="bg-background/70 focus:ring-primary/80 pl-10 pr-10 text-base py-3"
                        />
                        </FormControl>
                        <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                        </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                          id="remember-me"
                        />
                      </FormControl>
                      <FormLabel htmlFor="remember-me" className="text-sm font-normal text-muted-foreground cursor-pointer">
                        Remember me
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 hover:underline flex items-center gap-1">
                  <KeyRound className="h-4 w-4"/> Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md py-3 text-base font-semibold tracking-wide" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Login to EduAI
                  </>
                )}
              </Button>
            </form>
          </Form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full text-foreground/90 py-3" disabled>
                <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                Sign in with Google (Coming Soon)
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground"/>
            </Button>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:text-primary/80 hover:underline flex items-center justify-center gap-1">
              <UserPlus className="h-4 w-4" /> Create a new account
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
