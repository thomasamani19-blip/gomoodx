// This page should act as a router to the correct dashboard based on the user's role.
// In a real app, you would use a hook to get the user's role and redirect.
// For this prototype, we can show a generic message or default to one dashboard.

import CreatorDash from "@/components/dashboard/CreatorDash";
// import MemberDash from "@/components/dashboard/MemberDash";
// import PartnerDash from "@/components/dashboard/PartnerDash";
// import AdminDash from "@/components/dashboard/AdminDash";

// import { useAuth } from '@/hooks/useAuthRedirect';

export default function DashboardPage() {
    // const { user } = useAuth();

    const user = { role: 'creator' }; // MOCK USER

    const renderDashboard = () => {
        switch (user?.role) {
            case 'creator':
                return <CreatorDash />;
            // case 'member':
            //     return <MemberDash />;
            // case 'partner':
            //     return <PartnerDash />;
            // case 'admin':
            //     return <AdminDash />;
            default:
                return <p>Loading your dashboard...</p>
        }
    };

    return (
        <div>
            {renderDashboard()}
        </div>
    );
}
