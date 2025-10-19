// app/components/AddExpenseButton.tsx
"use client";

import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";

interface PopUpButtonProps {
  onClick: () => void;
}

const PopUpButton: React.FC<PopUpButtonProps> = ({ onClick }) => {
  const { status } = useSession();

  

  // if (status === "unauthenticated") return null;

  return (
    <div className="fixed bottom-22 sm:bottom-4 right-4">
      <button
        onClick={onClick}
        className="group bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
      >
        <Plus
          size={22}
          color="black"
          className="transition-transform duration-300 ease-out group-hover:rotate-45"
        />
      </button>
    </div>
  );
};

export default PopUpButton;