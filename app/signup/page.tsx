"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useLanguage } from "@/components/language-provider"
import { signUp } from "@/lib/auth-client"

export default function SignupPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error(t.passwordsDontMatch || "Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        throw new Error(error.message || t.errorCreatingAccount)
      }

      toast.success(t.accountCreatedSuccess)
      router.push("/login")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errorCreatingAccount)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t.signUp}</CardTitle>
          <CardDescription className="text-center text-zinc-400">
            {t.createAccountSubtitle || "Fill in the details below to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={handleChange}
                className="bg-black border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                value={formData.email}
                onChange={handleChange}
                className="bg-black border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="bg-black border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.confirmPassword || "Confirm Password"}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="bg-black border-zinc-800 text-white"
              />
            </div>
            <Button
              type="submit"
              className="w-full !bg-white !text-black hover:!bg-gray-200"
              disabled={isLoading}
            >
              {isLoading ? t.loading : t.createAccount}
            </Button>
            <div className="text-center text-sm text-zinc-400">
              {t.alreadyHaveAccount || "Already have an account?"}{" "}
              <Link href="/login" className="text-white hover:underline">
                {t.login}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
