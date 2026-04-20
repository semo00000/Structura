"use client";

import { motion, Variants } from "framer-motion";
import { TableRow, TableCell } from "./table";
import { Skeleton } from "./skeleton";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  }),
};

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="hover:bg-transparent">
          <TableCell colSpan={columns} className="p-0">
            <motion.div
              custom={rowIndex}
              initial="hidden"
              animate="visible"
              variants={rowVariants}
              className="flex w-full border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <table className="w-full">
                <tbody>
                  <tr>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                      <td key={colIndex} className="p-4 align-middle">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </motion.div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
