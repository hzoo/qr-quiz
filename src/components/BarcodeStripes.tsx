import React from "react";

interface BarcodeStripesProps {
  className?: string;
}

export function BarcodeStripes({ className = "" }: BarcodeStripesProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="bg-black w-1 h-full" />
      <div className="bg-white w-2 h-full" />
      <div className="bg-black w-1 h-full" />
      <div className="bg-white w-3 h-full" />
      <div className="bg-black w-2 h-full" />
      <div className="bg-white w-1 h-full" />
      <div className="bg-black w-2 h-full" />
      <div className="bg-white w-1 h-full" />
      <div className="bg-black w-1 h-full" />
    </div>
  );
}

BarcodeStripes.displayName = "BarcodeStripes"; 