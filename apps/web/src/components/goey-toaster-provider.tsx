"use client";

import { GoeyToaster } from "goey-toast";
import "goey-toast/styles.css";

export function GoeyToasterProvider() {
  return <GoeyToaster position="top-center" offset={16} gap={10} theme="light" />;
}
