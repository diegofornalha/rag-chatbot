import { motion } from "framer-motion";
import { useSession } from "next-auth/react"

import { GoogleDriveIcon } from "./icons";

export const Overview = () => {
const { data: session } = useSession();
  return (
    <motion.div
      key="overview"
      className="max-w-[500px] mt-20 mx-4 md:mx-0"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="border rounded-lg p-6 flex flex gap-4 items-center align-center text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
        <div className="p-2 rounded-sm bg-[#000]/10 dark:bg-[#FFF]/10">
          <GoogleDriveIcon size={24} />
        </div>

        <div className="">
          <p className="font-bold">{session?.user?.email}</p>
          <p>Your Google Drive is Connected</p>
        </div>
      </div>
    </motion.div>
  );
};
