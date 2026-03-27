import { useState } from "react";
import PasswordGate from "@/components/PasswordGate";
import Index from "@/pages/Index";

const Coach = () => {
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem("alderos_coach_auth") === "true";
  });

  if (!authenticated) {
    return <PasswordGate onAuthenticated={() => setAuthenticated(true)} />;
  }

  return <Index />;
};

export default Coach;
