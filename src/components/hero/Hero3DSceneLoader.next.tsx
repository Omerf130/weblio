"use client";

import dynamic from "next/dynamic";

export default dynamic(() => import("./Hero3DScene"), { ssr: false });
