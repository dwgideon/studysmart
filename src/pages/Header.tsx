import { signIn, signOut, useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  const handleSignIn = () => {
    signIn();
  };

  return (
    <header>
      {!session ? (
        <button onClick={handleSignIn}>Sign in</button>
      ) : (
        <button onClick={() => signOut()}>Sign out</button>
      )}
    </header>
  );
}
