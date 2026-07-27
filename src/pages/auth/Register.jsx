import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function Register() {
  const navigate = useNavigate()

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
          navigate('/dashboard')
        }}
      >
        <Input label="Full name" placeholder="Rahul Sharma" />
        <Input label="Email" type="email" placeholder="you@email.com" />
        <Input label="Phone" type="tel" placeholder="+91 98765 43210" />
        <Input label="Password" type="password" placeholder="Create a password" />
        <Button type="submit" className="w-full">
          Create Account
        </Button>
      </form>
    </AuthLayout>
  )
}
