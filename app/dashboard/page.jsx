'use client'

import { useContext, useEffect } from "react";
import AuthContext from "@/context/AuthContext";
import { useRouter } from "next/navigation";


// import AdminDashboard from "@/components/dashboard/admin-dashboard";
// import TeacherDashboard from "@/components/dashboard/teacher-dashboard";
// import StudentDashboard from "@/components/dashboard/student-dashboard";
// import ParentDashboard from "@/components/dashboard/parent-dashboard";
// import SuperAdminDashboard from "./super-admin/page";
// import TeacherDashboard from "./teacher/page";
// import StudentDashboard from "./student/page";
// import ParentDashboard from "./parent/page";


import ProtectedRoute from "@/components/ProtectedRoute";







export default function DashboardPage(){
    const router = useRouter()

    const {userData} = useContext(AuthContext)

    console.log(userData?.role)

    // const displayDashboard = () => {
    //     switch (userData?.role) {
    //         case 'super_admin':
    //             router.push('/dashboard/super-admin')
    //             return
    //         case 'staff':
    //             router.push('/dashboard/staff')
    //             return
    //         case 'teacher':
    //             router.push('/dashboard/teacher')
    //             return
    //         case 'student':
    //             router.push('/dashboard/student')
    //             return
    //         case 'parent':
    //             router.push('/dashboard/parent')
    //             return
    //         default:
    //             router.push('/dashboard/student')
    //             return 
    //     }
    // }




    useEffect(() => {
        if (!userData?.role) return;
        switch (userData.role) {
            case 'super_admin':
                router.push('/dashboard/super-admin');
                break;
            case 'staff':
                router.push('/dashboard/super-admin');
                break;
            case 'teacher':
                router.push('/dashboard/teacher');
                break;
            case 'student':
                // Students should go to the homepage which is their dashboard
                router.push('/');
                break;
            case 'parent':
                router.push('/dashboard/parent');
                break;
            default:
                // Default to homepage for students
                router.push('/');
        }
    }, [userData?.role, router]);



    return (
        <ProtectedRoute>
            {/* {displayDashboard()} */}
        </ProtectedRoute>
    );
}