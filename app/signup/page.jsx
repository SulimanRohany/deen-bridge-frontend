import SignupForm from "@/components/forms/signup-form";

export const metadata = {
    title: 'Sign Up | Deen Bridge',
    description: 'Create a free Deen Bridge account to begin your journey of learning the Quran with personalized resources, expert teachers, and comprehensive learning tools.',
}

export default function SignupPage() {
    return (
        <div>
            <SignupForm />
        </div>
    );
}
