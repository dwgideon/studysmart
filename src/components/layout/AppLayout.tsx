import React from "react";
import layout from "../../styles/layout.module.css";

type Props = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: Props) {
  return (
    <div className={layout.page}>
      <div className={layout.container}>{children}</div>
    </div>
  );
}
