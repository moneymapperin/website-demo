import { Link } from 'react-router-dom'
import { AuthLayout } from '../../components/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function Register() {
  return (
    <AuthLayout
      title="Create account"
      subtitle="Start mapping your money in minutes"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Login
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Input label="Full name" placeholder="Rahul Sharma" />
        <Input label="Email" type="email" placeholder="you@email.com" />
        <Input label="Phone" type="tel" placeholder="+91 98765 43210" />
        <Input label="Password" type="password" placeholder="Create a password" />
        <Button type="submit" className="w-full">
          Create Account
        </Button>
        <Link to="/verify-otp" className="block text-center text-sm font-semibold text-primary hover:underline">
          Preview OTP screen →
        </Link>
      </form>
    </AuthLayout>
  )
}
