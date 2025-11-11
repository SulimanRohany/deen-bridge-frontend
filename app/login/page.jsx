import LoginForm from "@/components/forms/login-form"

export const metadata = {
    title: 'Login | Deen Bridge',
    description: 'Log in to your Deen Bridge account to access personalized Quran learning resources, track your progress, and connect with expert teachers worldwide.',
}

export default function LoginPage() {
    return (
        <div>
            <LoginForm />
        </div>
    )
}