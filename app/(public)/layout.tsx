import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </>
  );
};

export default PublicLayout;