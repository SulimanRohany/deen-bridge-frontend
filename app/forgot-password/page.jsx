import ForgotPasswordForm from "@/components/forms/forgot-password-form"

export const metadata = {
    title: 'Forgot Password | Deen Bridge',
    description: 'Reset your Deen Bridge account password. Enter your email address and we\'ll send you a secure link to reset your password.',
}

export default function ForgotPasswordPage() {
    return (
        <div>
            <ForgotPasswordForm />
        </div>
    )
}


