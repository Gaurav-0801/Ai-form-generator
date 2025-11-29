'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, FileText, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI-Powered Form Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create dynamic, shareable forms using natural language. 
            AI understands your form history and generates exactly what you need.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/auth/signup">
              <Button size="lg">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                Login
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>AI Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Describe your form in natural language and AI generates it instantly
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-indigo-600 mb-2" />
              <CardTitle>Dynamic Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Forms render dynamically from JSON schema with full validation
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Context Memory</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI remembers your past forms and uses relevant context for better generation
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Secure & Scalable</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Handles thousands of forms efficiently with vector search
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sign Up & Login</h3>
                <p className="text-sm text-muted-foreground">
                  Create your account to start generating forms
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Describe Your Form</h3>
                <p className="text-sm text-muted-foreground">
                  Use natural language: "I need a signup form with name, email, and profile picture"
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI Generates Form</h3>
                <p className="text-sm text-muted-foreground">
                  AI uses your past forms as context to generate the perfect form schema
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Share & Collect</h3>
                <p className="text-sm text-muted-foreground">
                  Share your form via public link and view submissions in your dashboard
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}