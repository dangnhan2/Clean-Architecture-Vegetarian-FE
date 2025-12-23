import PublicHeader from "@/components/PublicHeader";

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <PublicHeader />
            <main>{children}</main>
        </>
    )
}

export default PublicLayout