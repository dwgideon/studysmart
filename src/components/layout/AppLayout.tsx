import Header from "@/components/Header";
import layout from "@/styles/Layout.module.css";

type Props = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: Props) {
  return (
    <div className={layout.appShell}>
      <Header />
      <main className={layout.mainContent}>{children}</main>
    </div>
  );
}
