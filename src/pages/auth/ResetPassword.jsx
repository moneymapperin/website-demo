import { Link } from 'react-router-dom'
import { AuthLayout } from '../../components/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function ResetPassword() {
  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a new password for your account"
      footer={
        <Link to="/login" className="font-bold text-primary hover:underline">
          Back to Login
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Input label="New password" type="password" placeholder="New password" />
        <Input label="Confirm password" type="password" placeholder="Confirm password" />
        <Button type="submit" className="w-full">
          Update Password
        </Button>
      </form>
    </AuthLayout>
  )
}
